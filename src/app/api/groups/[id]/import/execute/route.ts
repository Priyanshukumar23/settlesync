import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ExchangeRateService } from "@/lib/ExchangeRateService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const groupId = (await params).id;
    const body = await req.json();
    const { validRows, anomalies, resolutions, totalRows } = body;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { members: { include: { user: true } } }
    });

    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const isOwner = group.members.some(m => m.userId === session.userId && m.role === "OWNER");
    if (!isOwner) return NextResponse.json({ error: "Only OWNER can execute imports" }, { status: 403 });

    let importedExpenses = 0;
    let importedSettlements = 0;
    let skippedCount = 0;
    const dbIssues: any[] = [];

    console.log(`\n=== IMPORT EXECUTION STARTED ===`);
    console.log("Total rows received:", totalRows);
    console.log("Valid rows:", validRows.length);
    console.log("Anomalies:", anomalies.length);

    await prisma.$transaction(async (tx) => {
      // Create Report Entry
      const report = await tx.importReport.create({
        data: {
          groupId,
          uploadedById: session.userId,
          status: "COMPLETED",
        }
      });

      // Combine all rows for processing: validRows are fine, anomalies require resolutions
      const allRows = [
        ...validRows.map((r: any) => ({ ...r, isAnomaly: false })),
        ...anomalies.map((a: any) => ({ ...a.rawRow, rowNumber: a.rowNumber, isAnomaly: true, originalIssue: a }))
      ];

      const memberByEmail = new Map(group.members.map(m => [m.user.email.toLowerCase(), m]));
      const memberByName = new Map(group.members.map(m => [m.user.name.toLowerCase(), m]));

      const rowsToImport: any[] = [];

      for (const row of allRows) {
        const rowNum = row.rowNumber;
        
        if (row.isAnomaly) {
          const issueObj = row.originalIssue;
          // Check if user rejected row
          const rejectResolutions = Object.values(resolutions).filter((res: any, idx) => {
             const key = Object.keys(resolutions)[idx];
             return key.startsWith(`${rowNum}_`) && res === "Reject Row";
          });

          if (rejectResolutions.length > 0 || issueObj.severity === "ERROR") {
            skippedCount++;
            dbIssues.push({
              reportId: report.id,
              rowNumber: rowNum,
              issue: issueObj.issue,
              severity: issueObj.severity,
              actionTaken: "User Decision: Reject",
              finalResult: "Row Skipped",
            });
            continue;
          }
        }

        // Apply resolutions
        const date = row['date'] || row['timestamp'];
        const title = row['title'] || row['description'] || row['name'];
        let amount = row['amount'] || row['cost'];
        let currency = row['currency'];
        const paid_by = row['paidby'] || row['payer'] || row['paidbyemail'];
        const split_method = row['splitmethod'] || row['splittype'] || row['split'];
        const participants = row['participants'] || row['sharedwith'];
        const payerRaw = (paid_by || "").trim().toLowerCase();
        const payer = memberByEmail.get(payerRaw) || memberByName.get(payerRaw);

        if (!payer) {
           skippedCount++;
           continue; // Failsafe
        }

        let parsedAmount = parseFloat(amount);
        let finalCurrency = (currency || "INR").toUpperCase();
        let isSettlement = false;
        
        rowsToImport.push(row);

        // Apply fixes from resolutions
        if (row.isAnomaly) {
          const rKeys = Object.keys(resolutions).filter(k => k.startsWith(`${rowNum}_`));
          let appliedFixes: string[] = [];

          for (const k of rKeys) {
            const fix = resolutions[k];
            if (k.endsWith("_amount")) {
              if (fix === "Convert to Positive" || fix === "Treat as Refund") {
                parsedAmount = Math.abs(parsedAmount);
                appliedFixes.push(fix);
              }
            } else if (k.endsWith("_currency")) {
              if (fix === "Default to INR") finalCurrency = "INR";
              if (fix === "Default to USD") finalCurrency = "USD";
              appliedFixes.push(fix);
            } else if (k.endsWith("_type")) {
              if (fix === "Convert to Settlement") {
                isSettlement = true;
                appliedFixes.push(fix);
              }
            } else if (k.endsWith("_duplicate")) {
              if (fix === "Ignore Duplicate") {
                 appliedFixes.push(fix);
              }
            }
          }

          dbIssues.push({
            reportId: report.id,
            rowNumber: rowNum,
            issue: row.originalIssue.issue,
            severity: row.originalIssue.severity,
            actionTaken: appliedFixes.join(", ") || "No explicit fix applied",
            finalResult: isSettlement ? "Imported as Settlement" : "Imported as Expense",
          });
        }

        const expenseDate = new Date(date || new Date());
        
        // Final calculations
        const exchangeRate = ExchangeRateService.getRate(finalCurrency);
        const convertedAmount = ExchangeRateService.convertToINR(parsedAmount, finalCurrency);

        if (isSettlement) {
          // Attempt to find a payee if it's a settlement. Just using the first other active member for now.
          const payee = group.members.find(m => m.userId !== payer.userId && m.leftAt === null);
          if (payee) {
             await tx.settlement.create({
               data: {
                 groupId,
                 payerId: payer.userId,
                 payeeId: payee.userId,
                 amount: convertedAmount,
                 currency: "INR", // Internally converted
                 date: expenseDate,
                 notes: title || "Imported Settlement",
               }
             });
             importedSettlements++;
             console.log(`[Import] Created Settlement of ${convertedAmount} INR (Payer: ${payer.user.name})`);
          } else {
             skippedCount++;
             if (row.isAnomaly) {
               dbIssues[dbIssues.length-1].finalResult = "Failed: No Payee found";
             }
          }
        } else {
          // Regular Expense
          // Simple EQUAL split among active members at the time of expense
          const expenseTime = new Date(expenseDate).toISOString().split('T')[0];
          
          const activeMembers = group.members.filter(m => {
            const joinTime = new Date(m.joinedAt).toISOString().split('T')[0];
            const leaveTime = m.leftAt ? new Date(m.leftAt).toISOString().split('T')[0] : "9999-12-31";
            return expenseTime >= joinTime && expenseTime <= leaveTime;
          });
          
          if (row.rowNumber === 2) {
             console.log("Rows being imported:", rowsToImport.length);
             console.log("Membership validation result:", activeMembers.map(a => a.user.name));
          }

          if (activeMembers.length === 0) {
            skippedCount++;
            continue;
          }

          const splitAmount = Number((convertedAmount / activeMembers.length).toFixed(2));
          const calculatedParticipants = activeMembers.map(m => ({
            userId: m.userId,
            amountOwed: splitAmount,
            share: null
          }));
          
          // Fix rounding
          const sum = calculatedParticipants.reduce((acc, p) => acc + p.amountOwed, 0);
          if (sum !== convertedAmount) {
            calculatedParticipants[0].amountOwed += (convertedAmount - sum);
            calculatedParticipants[0].amountOwed = Number(calculatedParticipants[0].amountOwed.toFixed(2));
          }

          const expenseData = {
            data: {
              groupId,
              title: title || "Imported Expense",
              description: "Imported via CSV",
              originalAmount: parsedAmount,
              originalCurrency: finalCurrency,
              exchangeRate,
              convertedAmount,
              paidById: payer.userId,
              splitMethod: "EQUAL", // Assuming EQUAL for simple imports unless strict validation handles EXACT
              date: expenseDate,
              participants: {
                create: calculatedParticipants
              }
            }
          };

          if (row.rowNumber === 2) {
            console.log("Expense create payload:", expenseData);
          }

          await tx.expense.create(expenseData);
          importedExpenses++;
          console.log(`[Import] Created Expense '${title || "Imported Expense"}' of ${convertedAmount} INR (Payer: ${payer.user.name})`);
        }
      }

      if (dbIssues.length > 0) {
        await tx.importIssue.createMany({
          data: dbIssues
        });
      }
    });

    console.log(`=== IMPORT EXECUTION COMPLETED ===\n`);
    return NextResponse.json({ 
      success: true, 
      importedExpenses, 
      importedSettlements,
      skippedRows: skippedCount
    });
  } catch (error: any) {
    console.error("[Import Execution Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
