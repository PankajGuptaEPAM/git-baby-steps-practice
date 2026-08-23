- Use `tools/validate_instructions.py` to review every `.agent.md` file in `instructions/`.
- Process files individually: enumerate the directory, analyze one file at a time, and retain one result per file.
- Check that each file is non-empty, stays within the 700-line soft limit, and is listed in `instructions/main.agent.md`.
- Check for SRP signals, including multiple platform concerns or combined bootstrap and skill-authoring concerns.
- Treat SRP signals as review prompts, not automatic violations; read the flagged file before making a final judgment.
- Use the default command from the project root:
  ```powershell
  python tools/validate_instructions.py
  ```
- Use `--instructions-dir` to validate another directory and `--output` to write the Markdown report to a file.
- Report results in Markdown with a summary followed by one table row per processed file.
- Include each file path, line count, structural status, SRP status, and findings in the output.
