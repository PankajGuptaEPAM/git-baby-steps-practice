- Use `tools/compound_interest.py` when asked to calculate compound interest, final investment amount, or interest earned over time.
- Requires Python 3; no additional dependencies.

## When to invoke

- User provides a principal, interest rate, compounding frequency, and time period.
- User asks "how much will X grow to", "what is the final amount", or "how much interest will I earn".
- User gives partial time input such as "8 years 7 months" — convert to decimal years before passing (e.g. 8y 7m → 8 + 7/12 ≈ 8.5833).

## Invocation

```
python tools/compound_interest.py <principal> <rate> <compounds> <years>
```

- `principal` — starting amount in dollars (e.g. `15847`)
- `rate` — annual interest rate as a percentage, not a decimal (e.g. `7.34` for 7.34%)
- `compounds` — number of compounding periods per year (e.g. `12` monthly, `4` quarterly, `1` annually)
- `years` — total time in years as a decimal (e.g. `8.5833` for 8 years 7 months)

## Presenting results

- Show the script output verbatim.
- Follow with a brief summary: principal, rate, period, final amount, and interest earned.
- If the user gave months, note the decimal conversion used.
- Do not restate the formula unless the user asks.
