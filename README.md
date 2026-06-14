<div align="center">
  <h1>💸 SettleSync</h1>
  <p><b>Shared Expense Management with Membership History, CSV Import Intelligence, Multi-Currency Support, and Balance Traceability.</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

---

## 📖 Overview

**SettleSync** is a full-stack shared expense management application built as part of the **Spreetail Software Engineering Internship Assignment**.

The application helps groups to seamlessly:
- 📊 **Track** shared expenses
- 🕒 **Handle** changing memberships over time
- 📥 **Import** messy CSV files securely
- 🕵️ **Detect** anomalies before import
- 🧮 **Calculate** balances transparently
- 🤝 **Record** settlements
- 💱 **Support** multiple currencies (USD/INR)

---

## 🚀 Live Demo

**🌍 Deployed URL:** [https://your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)

---

## 📸 Application Screenshots

*(Replace the placeholder URLs with actual screenshots once deployed)*

| Dashboard | Group Details |
| :---: | :---: |
| <img src="https://placehold.co/600x400/1e1e2f/ffffff?text=Dashboard+Screenshot" alt="Dashboard" width="100%"/> | <img src="https://placehold.co/600x400/1e1e2f/ffffff?text=Group+Details+Screenshot" alt="Group Details" width="100%"/> |

| CSV Import Review | Settlement Suggestions |
| :---: | :---: |
| <img src="https://placehold.co/600x400/1e1e2f/ffffff?text=CSV+Import+Review" alt="CSV Import" width="100%"/> | <img src="https://placehold.co/600x400/1e1e2f/ffffff?text=Settlement+Suggestions" alt="Settlements" width="100%"/> |

---

## ✨ Key Features

### 👥 Membership History Enforcement
Members only participate in expenses during periods when they were active.
> **Example:**
> - Meera leaves March 31
> - Expense on April 10 ➔ *Meera is automatically excluded*
> - Sam joins April 15
> - Expense on April 10 ➔ *Sam is automatically excluded*

### 📂 Advanced CSV Import
Import raw CSV files without editing. The intelligent importer:
- Detects anomalies
- Surfaces issues to users
- Requires manual approval
- Generates import reports
- Preserves audit history

**Supported anomaly detection:**
`Duplicate Expenses` • `Negative Amounts` • `Invalid Currency` • `Unknown Users` • `Settlement Records` • `Membership Violations` • `Missing Data`

### 💱 Multi-Currency Support
Supported currencies: **INR** & **USD**.
Expenses store:
- Original Amount
- Original Currency
- Exchange Rate
- Converted INR Amount

*Balances are automatically calculated using the converted INR values.*

### 📊 Balance Traceability
**No magic numbers.** Every balance can be traced through:
1. Expense Contributions
2. Expense Shares
3. Settlement Adjustments

*Users can see exactly how a balance was generated row-by-row.*

### 🤝 Intelligent Settlement Suggestions
The balance engine generates simplified settlement recommendations that minimize the total number of transactions.
> **Instead of displaying a complex debt graph:**  
> `Alex pays Sam ₹500`

---

## 🏗️ Technology Stack

| Frontend | Backend | Database | Deployment |
| :--- | :--- | :--- | :--- |
| Next.js 15<br>React 19<br>TypeScript<br>Tailwind CSS | Next.js API Routes<br>Prisma ORM | PostgreSQL (Neon) | Vercel |

---

## 🤖 AI Tools Used

This project was developed using AI-assisted software engineering.

### ChatGPT (OpenAI)
Used for:
- Architecture discussions
- TypeScript debugging
- Prisma schema design
- CSV anomaly workflow planning
- Documentation assistance

### Antigravity (Gemini)
Used for:
- Feature implementation planning
- Component scaffolding
- UI generation
- Refactoring suggestions

> 💡 *All AI-generated code was manually reviewed, tested, modified, and validated before inclusion in the final submission. See `AI_USAGE.md` for detailed documentation.*

---

## ⚙️ Local Setup

### 1. Clone Repository
```bash
git clone https://github.com/Priyanshukumar23/settlesync.git
cd settlesync
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory and add:
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

### 4. Database Setup
Generate the Prisma client and push the schema:
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 🧪 Test Scenarios

### 1. Membership History
1. Add Member
2. Create Expense
3. Remove Member
4. Create Future Expense
* **Expected:** Removed member is correctly excluded from the future expense.

### 2. CSV Import
1. Open Group ➔ Click **Import CSV**
2. Upload CSV
3. Review anomalies
4. Approve or reject fixes
5. Execute import
* **Expected:** Import report generated successfully and ledger updated.

### 3. Settlements
1. Create complex debts across users
2. View **Settlement Suggestions**
3. Record settlement
* **Expected:** Balances update instantly with traceable records.

---

## 📚 Documentation
The repository includes additional documentation for deep-dives:
- `README.md` (You are here)
- `SCOPE.md`
- `DECISIONS.md`
- `AI_USAGE.md`

---

<div align="center">
  <p>Built with ❤️ by <b>Priyanshu Kumar</b></p>
</div>
