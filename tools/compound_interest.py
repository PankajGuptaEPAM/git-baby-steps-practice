import argparse

parser = argparse.ArgumentParser(description="Calculate compound interest")
parser.add_argument("principal", type=float, help="Initial principal amount")
parser.add_argument("rate", type=float, help="Annual interest rate as a percentage (e.g. 7.34)")
parser.add_argument("compounds", type=int, help="Number of times interest compounds per year")
parser.add_argument("years", type=float, help="Total time in years")
args = parser.parse_args()

A = args.principal * (1 + (args.rate / 100) / args.compounds) ** (args.compounds * args.years)
interest = A - args.principal

print(f"Final amount:    ${A:,.2f}")
print(f"Interest earned: ${interest:,.2f}")
