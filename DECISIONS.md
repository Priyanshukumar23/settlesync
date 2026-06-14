# Architectural Decisions (DECISIONS.md)

### 1. CSV Anomaly Resolution Engine
**Decision:** We rejected automatic CSV correction in favor of a user-approved interactive resolution pipeline.
**Rationale:** Financial data requires high integrity. An automatic currency converter or sign flipper could easily commit incorrect debts. By pausing the import and prompting the user for decisions via a staging UI, we guarantee data transparency.

### 2. The Debt Simplification Algorithm
**Decision:** We implemented a greedy min-max algorithm for calculating settlements.
**Rationale:** In a group where User A owes User B $10, and User B owes User C $10, it is inefficient for two separate transactions to occur. The algorithm computes a net balance array and iteratively matches the largest debtor with the largest creditor. This yields O(N) complexity for resolving debts and minimizes the actual number of bank transfers needed by users.

### 3. Membership History Ledger Mapping
**Decision:** Instead of deleting a `GroupMember` row when a user is removed, we append a `leftAt` timestamp.
**Rationale:** True traceability requires historical integrity. If we hard-deleted members, past expenses would lose references to their participants, causing cascading calculation failures. Using temporal boundaries (`joinedAt` and `leftAt`) allows the `BalanceService` to accurately recreate the exact state of the group on the specific date an expense was incurred.

### 4. Dual Currency Storage
**Decision:** Expenses store `originalAmount`, `originalCurrency`, `exchangeRate`, and `convertedAmount`.
**Rationale:** While the Balance Engine calculates strictly in the base currency (INR) to prevent floating-point mismatching between varied currencies, the UI needs to display exactly what was originally inputted (e.g., USD). We store both states.
