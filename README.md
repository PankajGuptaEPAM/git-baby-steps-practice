# hello-genai

AI-assisted engineering toolkit — sprint reporting, Jira/Confluence automation, MCP server, and agent instruction infrastructure.

## Tools

| Script | Description |
|---|---|
| `tools/compound_interest.py` | Calculate compound interest from CLI arguments |
| `tools/sprint_velocity.py` | Report committed vs completed story points for a sprint |
| `tools/sprint_workload.py` | Show per-developer task assignments and SP distribution |
| `tools/mcp_echo_server.py` | Local MCP server with `echo`, `get_time`, and `calculate` tools |

### compound_interest.py

```powershell
python tools/compound_interest.py <principal> <rate%> <compounds/year> <years>
# Example:
python tools/compound_interest.py 15847 7.34 12 8.5833
```

### sprint_velocity.py

```powershell
python tools/sprint_velocity.py [--sprint <number>]
```

### sprint_workload.py

```powershell
python tools/sprint_workload.py [--sprint <number>]
```

> **Note:** Jira tools use fake data when `.env` is not configured. Set `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_BOARD_ID`, `JIRA_PROJECT_KEY` to connect to a real Jira instance.

## Report Generator

The `report_generator/` package fetches sprint data from Jira and publishes reports to Confluence.

```powershell
python main.py [--dry-run] [--date YYYY-MM-DD]
```

| Module | Purpose |
|---|---|
| `jira_client.py` | Fetch sprint issues, velocity, blockers via Jira REST API |
| `confluence_client.py` | Create/update Confluence pages |
| `report_builder.py` | Assemble report sections with RAG status |
| `formatter.py` | Convert report to Confluence Storage Format (XHTML) |

## MCP Server

A local MCP server (`tools/mcp_echo_server.py`) exposes three tools to GitHub Copilot agent mode:

| Tool | Parameters |
|---|---|
| `echo` | `message` |
| `get_time` | `timezone` (optional, default: local) |
| `calculate` | `a`, `b`, `operation` (add/subtract/multiply/divide) |

Configured in `.vscode/mcp.json`. Also includes the `@sooperset/mcp-atlassian` server for Jira/Confluence MCP access.

## Agent Instructions

Instructions in `instructions/` define reusable AI workflows loaded automatically via `.github/copilot-instructions.md`:

| File | Purpose |
|---|---|
| `create-status-report.agent.md` | Weekly status report with fake-data warning |
| `creating-instructions.agent.md` | Create/update instruction files and IDE wrappers |
| `calculate-compound-interest.agent.md` | Invoke compound interest tool |
| `use-sprint-velocity.agent.md` | Invoke sprint velocity tool |
| `use-sprint-workload.agent.md` | Invoke sprint workload tool |

## Requirements

```powershell
pip install -r requirements.txt
```

## Calculator

`multiply(first_number, second_number)` returns the product of two numbers.

```python
from calculator import multiply
result = multiply(6, 7)  # 42
```