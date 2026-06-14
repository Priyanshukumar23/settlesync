# SettleSync

SettleSync is a robust group expense sharing application tailored for tracking complex debts, executing precise split calculations, and importing detailed expense sheets.

## Core Features

- **Membership History Enforcement:** User join/leave dates are tracked and enforced during all balance calculations.
- **Advanced CSV Import:** Built with a sophisticated anomaly detection engine. Upload CSV files securely; the engine automatically catches duplicate rows, invalid currencies, negative amounts, and membership violations, prompting manual resolutions instead of executing unseen auto-fixes.
- **Traceable Ledger:** A "Your Ledger" table eliminates magic numbers by showcasing a row-by-row progression of exactly how your balance reached its current state.
- **Intelligent Settlements:** A built-in simplification algorithm calculates the minimum number of transactions needed to settle up all group debts.
- **Multi-Currency Support:** Seamlessly create expenses in USD or INR, with an automated `ExchangeRateService` unifying the background debt graph into a single base currency (INR).

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Ensure your `.env` file contains your Neon Database URLs:
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   ```

3. **Database Migration**
   ```bash
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Test Scenarios

**1. Membership Rules:** Add a member, record an expense today, then remove them. Add an expense tomorrow. The removed member will not be charged for tomorrow's expense.
**2. CSV Import:** Go to a group as an OWNER. Click "Import CSV". Upload `expenses_export.csv`. Observe the detailed anomaly flagging. Reject rows or approve suggested fixes. Execute and verify the balances instantly update.
**3. Settlements:** Create complex debts across 3 users. View the "Settlement Suggestions" box. Record a settlement between two users and watch the ledger and total balance update.
