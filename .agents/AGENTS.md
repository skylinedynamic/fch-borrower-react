# Project Rules: borrower-fch

- **PrimeReact Dropdowns**: Always set `optionLabel="label"` and `optionValue="value"` on `<Dropdown>` controls.
- **DataTable Action Column**: Ensure the Action column and its body elements are center-aligned (`alignHeader="center" align="center" headerClassName="text-center" bodyClassName="text-center"` and `justify-content-center`).
- **Filter State**: Always sanitize payload values in `loadData()` using `extractValue()` helper so primitive values are sent to backend.
- **Date Formatting**: Format date ranges using local timezone to avoid date shifts (`YYYY-MM-DD`).
