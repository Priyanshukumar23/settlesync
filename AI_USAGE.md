# AI Usage and Implementation Correctness

During the development of SettleSync, the AI agent functioned as the primary architect and engineer.

### Overcoming Roadblocks

**1. Database Syncing**
Early in the project, Prisma schema modifications were not syncing correctly due to intermittent timeout issues with the Neon Postgres cluster connection. 
*Correction:* The agent proactively provided direct bash execution commands for the user to forcefully push the schema locally using `npx prisma db push`.

**2. CSV Parsing Logic Bug**
During the implementation of the CSV Analyzer (Phase 5), the regex parsing logic was too aggressive in sanitizing headers, removing spaces from `"Paid By"` into `"paidby"`, and causing the subsequent destructuring logic (`const { paid_by } = row`) to fail. This resulted in every payer being evaluated as `undefined`. 
*Correction:* The agent successfully isolated the dictionary map, updated the code to allow for dynamic case-insensitive property lookups across both names AND emails (`memberByEmail.get() || memberByName.get()`), and injected debug logging tools directly into the analyzer.

**3. Next.js Hydration Mismatches**
A hydration error triggered due to differences in Date rendering across the client and the server within the React Tree.
*Correction:* The agent standardized all Date logic by writing a `formatDate(date)` utility function using `Intl.DateTimeFormat("en-IN")` ensuring uniform output string compilation.
