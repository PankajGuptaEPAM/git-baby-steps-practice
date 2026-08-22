# Module 13 Completion Report

## MCP Configuration
```json
{
    "servers": {
        "echo": {
            "command": "python",
            "args": [
                "./tools/mcp_echo_server.py"
            ]
        },
        "atlassian": {
            "command": "npx",
            "args": ["-y", "@sooperset/mcp-atlassian"],
            "env": {
                "JIRA_URL": "${env:JIRA_BASE_URL}",
                "JIRA_EMAIL": "${env:JIRA_EMAIL}",
                "JIRA_API_TOKEN": "[REDACTED]",
                "CONFLUENCE_URL": "${env:CONFLUENCE_URL}"
            }
        },
        "github": { 
      "type": "http", 
      "url": "https://api.githubcopilot.com/mcp/"
    }  
        
    }
}
```

## Configured Servers
- echo
- atlassian

## MCP Tool Test
- Tool used: mcp_mcp-echo_echo
- Output:
Hello MCP!
