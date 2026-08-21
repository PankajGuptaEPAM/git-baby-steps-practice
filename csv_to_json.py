import csv
import json


def csv_to_json(csv_path, json_path):
    """Read a CSV file and write its contents as a JSON array of objects."""
    with open(csv_path, newline="", encoding="utf-8") as csv_file:
        rows = list(csv.DictReader(csv_file))

    with open(json_path, "w", encoding="utf-8") as json_file:
        json.dump(rows, json_file, indent=2)

    return rows


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python csv_to_json.py <input.csv> <output.json>")
        sys.exit(1)

    csv_to_json(sys.argv[1], sys.argv[2])
