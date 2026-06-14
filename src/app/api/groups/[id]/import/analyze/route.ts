import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function parseCSV(csvText: string) {
  // Ignore BOM if present
  let text = csvText.startsWith('\uFEFF') ? csvText.slice(1) : csvText;
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return [];
  
  // Normalize headers: strip quotes, lowercase, remove whitespace/underscores 
  // so 'Paid By', 'paidby', or 'paid_by' all become 'paidby'
  const headers = lines[0].split(',').map(h => {
    let clean = h.replace(/^"|"$/g, '').trim().toLowerCase();
    clean = clean.replace(/[^a-z0-9]/g, ''); 
    return clean;
  });
  
  console.log("[CSV Parser Debug] Normalized Headers:", headers);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    const values = lines[i].split(regex).map(v => v.replace(/^"|"$/g, '').trim());
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }
  
  if (rows.length > 0) {
    console.log("[CSV Parser Debug] First Parsed Row Object:", rows[0]);
  }
  return rows;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groupId = (await params).id;
    const body = await req.json();
    const { csvText } = body;

    if (!csvText) return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } }, expenses: true }
    });

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const isOwner = group.members.some(m => m.userId === session.userId && m.role === "OWNER");
    if (!isOwner) return NextResponse.json({ error: "Only OWNER can import expenses" }, { status: 403 });

    const rows = parseCSV(csvText);
    const anomalies: any[] = [];
    const validRows: any[] = [];

    const memberByEmail = new Map(group.members.map(m => [m.user.email.toLowerCase(), m]));
    const memberByName = new Map(group.members.map(m => [m.user.name.toLowerCase(), m]));

    rows.forEach((row, index) => {
      const rowNum = index + 2;
      
      // Map normalized keys safely
      const date = row['date'] || row['timestamp'];
      const title = row['title'] || row['description'] || row['name'];
      const amount = row['amount'] || row['cost'];
      const currency = row['currency'];
      const paid_by = row['paidby'] || row['payer'] || row['paidbyemail'];
      const split_method = row['splitmethod'] || row['splittype'] || row['split'];
      const participants = row['participants'] || row['sharedwith'];

      if (index === 0) {
         console.log("[CSV Parser Debug] Mapped Payer Value:", paid_by);
      }
      
      const issueList: string[] = [];
      let severity = "WARNING";
      const suggestedFixes: any = {};

      const payerRaw = (paid_by || "").trim();
      const payerLower = payerRaw.toLowerCase();
      
      const payer = memberByEmail.get(payerLower) || memberByName.get(payerLower);

      if (index === 0) {
         console.log(`\n--- [CSV Validation Debug] ---`);
         console.log(`CSV payer: ${payerRaw}`);
         if (payer) {
           console.log(`Member name: ${payer.user.name}`);
           console.log(`Member email: ${payer.user.email}`);
           console.log(`Match result: SUCCESS`);
         } else {
           console.log(`Member name: N/A`);
           console.log(`Member email: N/A`);
           console.log(`Match result: FAILED`);
         }
         console.log(`------------------------------\n`);
      }

      const expenseDate = new Date(date || new Date());
      const expenseTime = new Date(expenseDate).setHours(0, 0, 0, 0);

      if (!payer) {
        issueList.push(`Payer '${paid_by}' is not a member`);
        severity = "ERROR";
      } else {
        const joinTime = new Date(payer.joinedAt).setHours(0, 0, 0, 0);
        const leaveTime = payer.leftAt ? new Date(payer.leftAt).setHours(0, 0, 0, 0) : null;
        
        if (expenseTime < joinTime || (leaveTime && expenseTime > leaveTime)) {
           issueList.push(`Payer '${paid_by}' was not an active member on ${expenseDate.toLocaleDateString()}`);
           severity = "ERROR";
        }
      }

      // 2. Negative amounts
      let parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        issueList.push(`Invalid amount '${amount}'`);
        severity = "ERROR";
      } else if (parsedAmount < 0) {
        issueList.push(`Negative amount detected`);
        suggestedFixes['amount'] = ["Convert to Positive", "Treat as Refund"];
      }

      // 3. Invalid currency
      let finalCurrency = (currency || "INR").toUpperCase();
      if (finalCurrency !== "INR" && finalCurrency !== "USD") {
        issueList.push(`Invalid currency '${currency}'`);
        suggestedFixes['currency'] = ["Default to INR", "Default to USD"];
      }

      // 4. Duplicate expenses
      const isDuplicate = group.expenses.some(e => 
        e.title.toLowerCase() === (title || "").toLowerCase() && 
        e.originalAmount === Math.abs(parsedAmount) &&
        new Date(e.date).toDateString() === expenseDate.toDateString()
      );
      if (isDuplicate) {
        issueList.push("Possible duplicate expense");
        suggestedFixes['duplicate'] = ["Ignore Duplicate", "Merge", "Keep Original"];
      }

      // 5. Settlement recorded as expense
      if ((title || "").toLowerCase().includes("settle") || (title || "").toLowerCase().includes("paid back")) {
        issueList.push("Appears to be a settlement, not an expense");
        suggestedFixes['type'] = ["Convert to Settlement"];
      }

      // We do not auto fix anything. We push to anomalies if there's any warning/error.
      if (issueList.length > 0) {
        anomalies.push({
          rowNumber: rowNum,
          rawRow: row,
          issue: issueList.join(", "),
          severity,
          suggestedFixes,
          originalValue: { amount, currency, title } // Help the UI display context
        });
      }

      // Pass everything as valid rows if not ERROR (UI will handle resolutions via execute endpoint)
      if (severity !== "ERROR") {
         validRows.push({ ...row, rowNumber: rowNum });
      }
    });

    return NextResponse.json({ success: true, anomalies, validRows, totalRows: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
