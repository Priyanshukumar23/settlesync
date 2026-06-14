import { z } from "zod";

export type CsvRow = Record<string, string>;

export type ImportIssueType = {
  rowNumber: number;
  issue: string;
  severity: "WARNING" | "ERROR";
  actionTaken: "SKIP" | "FIXED" | "REQUIRES_REVIEW";
};

// Modular rules
type RuleContext = {
  row: CsvRow;
  rowNumber: number;
  allRows: CsvRow[];
  activeMemberIds: string[];
};

type RuleResult = {
  isValid: boolean;
  issues: ImportIssueType[];
  modifiedRow?: CsvRow;
};

export interface AnomalyRule {
  name: string;
  evaluate: (ctx: RuleContext) => RuleResult;
}

// Map standard columns to user CSV
export type ColumnMapping = {
  title: string;
  amount: string;
  currency: string;
  paidBy: string;
  date: string;
  participants: string; // Comma separated emails or IDs
  splitMethod: string;
};

// Example Rule 1: Missing Required Fields
export const missingFieldsRule: AnomalyRule = {
  name: "missing_fields",
  evaluate: (ctx) => {
    const issues: ImportIssueType[] = [];
    const required = ["title", "amount", "paidBy", "date"];
    let isValid = true;
    for (const req of required) {
      if (!ctx.row[req] || ctx.row[req].trim() === "") {
        issues.push({
          rowNumber: ctx.rowNumber,
          issue: `Missing required field: ${req}`,
          severity: "ERROR",
          actionTaken: "SKIP"
        });
        isValid = false;
      }
    }
    return { isValid, issues };
  }
};

// Example Rule 2: Negative Amount
export const negativeAmountRule: AnomalyRule = {
  name: "negative_amount",
  evaluate: (ctx) => {
    const issues: ImportIssueType[] = [];
    let isValid = true;
    const amount = parseFloat(ctx.row["amount"]);
    if (!isNaN(amount) && amount < 0) {
      issues.push({
        rowNumber: ctx.rowNumber,
        issue: "Amount is negative",
        severity: "ERROR",
        actionTaken: "SKIP"
      });
      isValid = false;
    }
    return { isValid, issues };
  }
};

// Engine
export class AnomalyEngine {
  private rules: AnomalyRule[] = [];

  addRule(rule: AnomalyRule) {
    this.rules.push(rule);
  }

  process(rows: CsvRow[], mapping: ColumnMapping, activeMemberIds: string[]) {
    const allIssues: ImportIssueType[] = [];
    const cleanRows: CsvRow[] = [];

    // Map rows to standard schema based on mapping
    const mappedRows = rows.map(r => {
      return {
        title: r[mapping.title],
        amount: r[mapping.amount],
        currency: r[mapping.currency] || "INR",
        paidBy: r[mapping.paidBy],
        date: r[mapping.date],
        participants: r[mapping.participants],
        splitMethod: r[mapping.splitMethod] || "EQUAL"
      };
    });

    mappedRows.forEach((row, index) => {
      const rowNumber = index + 2; // Assuming row 1 is header
      const ctx: RuleContext = { row, rowNumber, allRows: mappedRows, activeMemberIds };
      
      let rowValid = true;
      let currentRow = { ...row };

      for (const rule of this.rules) {
        const result = rule.evaluate({ ...ctx, row: currentRow });
        if (result.issues.length > 0) {
          allIssues.push(...result.issues);
        }
        if (!result.isValid) {
          rowValid = false;
        }
        if (result.modifiedRow) {
          currentRow = result.modifiedRow;
        }
      }

      if (rowValid) {
        cleanRows.push(currentRow);
      }
    });

    return { cleanRows, issues: allIssues };
  }
}

export const defaultEngine = new AnomalyEngine();
defaultEngine.addRule(missingFieldsRule);
defaultEngine.addRule(negativeAmountRule);
