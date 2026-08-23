# Module 15 Completion Report

## Script Metadata
- Filename: `tools/validate_instructions.py`
- Language: Python
- Purpose: Process each `.agent.md` instruction file individually and produce a Markdown validation report. The script checks whether files are non-empty, within the 700-line soft limit, registered in `main.agent.md`, and contain SRP review signals such as mixed platform or infrastructure concerns.

## Script Contents
```python
"""Validate instruction files one at a time and print an SRP review report."""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

MAX_LINES = 700
PLATFORM_MARKERS = {
    "VS Code/Copilot": ("VSCode", "Copilot", ".github/"),
    "Cursor": ("Cursor", ".cursor/"),
    "Claude Code": ("Claude Code", ".claude/"),
}


@dataclass
class FileResult:
    path: str
    line_count: int
    structural_status: str
    srp_status: str
    findings: str


def inspect_file(path: Path, catalog_text: str) -> FileResult:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    findings = []

    if not text.strip():
        findings.append("file is empty")
    if len(lines) > MAX_LINES:
        findings.append(f"exceeds {MAX_LINES}-line soft limit")
    if path.name != "main.agent.md" and path.name not in catalog_text:
        findings.append("not listed in main.agent.md")

    if path.name != "main.agent.md":
        platform_hits = [
            name
            for name, markers in PLATFORM_MARKERS.items()
            if any(marker in text for marker in markers)
        ]
        if len(platform_hits) > 1:
            findings.append("covers multiple platform concerns: " + ", ".join(platform_hits))

    if re.search(r"Bootstrap Installation|create skills|SKILL\.md", text, re.IGNORECASE):
        findings.append("may combine instruction authoring with infrastructure or skill setup")

    structural_status = "Pass" if not any(
        finding in {"file is empty", f"exceeds {MAX_LINES}-line soft limit", "not listed in main.agent.md"}
        for finding in findings
    ) else "Fail"
    srp_status = "Review" if any(
        "platform concerns" in finding or "combine instruction authoring" in finding
        for finding in findings
    ) else "No signal"

    return FileResult(
        path=path.as_posix(),
        line_count=len(lines),
        structural_status=structural_status,
        srp_status=srp_status,
        findings="; ".join(findings) if findings else "none detected",
    )


def build_report(instructions_dir: Path) -> str:
    paths = sorted(instructions_dir.glob("*.agent.md"))
    catalog_path = instructions_dir / "main.agent.md"
    catalog_text = catalog_path.read_text(encoding="utf-8") if catalog_path.exists() else ""
    results = [inspect_file(path, catalog_text) for path in paths]
    failures = sum(result.structural_status == "Fail" for result in results)
    reviews = sum(result.srp_status == "Review" for result in results)

    rows = [
        "# Instruction Validation Report",
        "",
        "## Summary",
        "",
        f"Processed {len(results)} instruction files individually. Structural failures: {failures}. SRP review signals: {reviews}.",
        "",
        "## File Assessments",
        "",
        "| File | Lines | Structural Status | SRP Status | Findings |",
        "|---|---:|---|---|---|",
    ]
    rows.extend(
        f"| `instructions/{Path(result.path).name}` | {result.line_count} | {result.structural_status} | {result.srp_status} | {result.findings} |"
        for result in results
    )
    rows.extend(
        [
            "",
            "## Interpretation",
            "",
            "- `Pass` means the objective file checks passed.",
            "- `Review` means the file contains signals worth checking for multiple responsibilities; it is not an automatic SRP violation.",
            "- `No signal` means the heuristic found no SRP signal and does not replace human review.",
        ]
    )
    return "\n".join(rows) + "\n"


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--instructions-dir",
        type=Path,
        default=project_root / "instructions",
        help="directory containing instruction files",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="optional path for the Markdown report; stdout is used by default",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    report = build_report(args.instructions_dir)
    if args.output:
        args.output.write_text(report, encoding="utf-8")
    else:
        print(report, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

## Parameters
| Parameter | Description | Default |
|-----------|-------------|---------|
| `--instructions-dir` | Directory containing the `.agent.md` instruction files to process | Project `instructions/` directory |
| `--output` | Optional path for the generated Markdown report; when omitted, output is printed to stdout | stdout |

## Test Run Output
```text
# Instruction Validation Report

## Summary

Processed 7 instruction files individually. Structural failures: 0. SRP review signals: 1.

## File Assessments

| File | Lines | Structural Status | SRP Status | Findings |
|---|---:|---|---|---|
| `instructions/calculate-compound-interest.agent.md` | 26 | Pass | No signal | none detected |
| `instructions/create-status-report.agent.md` | 44 | Pass | No signal | none detected |
| `instructions/creating-instructions.agent.md` | 244 | Pass | Review | covers multiple platform concerns: VS Code/Copilot, Cursor, Claude Code; may combine instruction authoring with infrastructure or skill setup |
| `instructions/main.agent.md` | 26 | Pass | No signal | none detected |
| `instructions/use-sprint-velocity.agent.md` | 29 | Pass | No signal | none detected |
| `instructions/use-sprint-workload.agent.md` | 29 | Pass | No signal | none detected |
| `instructions/validate-instructions.agent.md` | 12 | Pass | No signal | none detected |

## Interpretation

- `Pass` means the objective file checks passed.
- `Review` means the file contains signals worth checking for multiple responsibilities; it is not an automatic SRP violation.
- `No signal` means the heuristic found no SRP signal and does not replace human review.
```
