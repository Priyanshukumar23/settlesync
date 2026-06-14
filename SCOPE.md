# SettleSync Scope Boundaries

### Completed Features
1. **Authentication:** Secure credential and session management.
2. **Dashboard & Group Navigation:** Role-based visibility and group creation.
3. **Expense Management:** Manual creation of EQUAL, EXACT, and PERCENTAGE split expenses.
4. **Member Lifecycle:** Dynamic temporal bounds (`joinedAt`/`leftAt`) protecting past calculations.
5. **Multi-Currency:** Unified background currency calculation Engine (INR/USD).
6. **Debt Simplification:** Calculation engine returning min-max settlement graphs.
7. **Traceable Ledger:** Mathematical breakdown of user balances.
8. **CSV Importer:** Granular anomaly engine catching 6+ edge cases.
9. **Import Resolution Staging:** Interactive UI permitting row rejection, duplicate merging, and specific issue targeting.

### Out of Scope (For Future Consideration)
- **Live Exchange API:** The `ExchangeRateService` currently uses a mocked static conversion rate, which would be swapped for an external live API (e.g., Stripe or OpenExchangeRates) in a production setting.
- **Push Notifications:** Alerting users via email or mobile push when an expense is recorded.
- **Advanced CSV Templating:** The CSV importer uses heuristic mapping; it does not yet feature a drag-and-drop column mapper for fully unstandardized CSV files.
