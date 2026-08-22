"""Minimal MCP echo server — speaks JSON-RPC 2.0 over stdio."""
import json
import sys
from datetime import datetime, timezone


TOOLS = [
    {
        "name": "echo",
        "description": "Returns the message you send it.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "The text to echo back."}
            },
            "required": ["message"],
        },
    },
    {
        "name": "get_time",
        "description": "Returns the current date and time.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "timezone": {"type": "string", "description": "Timezone name (e.g. UTC, local). Defaults to local."}
            },
            "required": [],
        },
    },
    {
        "name": "calculate",
        "description": "Performs basic arithmetic on two numbers.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "a":         {"type": "number", "description": "First operand."},
                "b":         {"type": "number", "description": "Second operand."},
                "operation": {
                    "type": "string",
                    "enum": ["add", "subtract", "multiply", "divide"],
                    "description": "Arithmetic operation to perform.",
                },
            },
            "required": ["a", "b", "operation"],
        },
    },
]


def respond(id_, result):
    msg = json.dumps({"jsonrpc": "2.0", "id": id_, "result": result})
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def error(id_, code, message):
    msg = json.dumps({"jsonrpc": "2.0", "id": id_, "error": {"code": code, "message": message}})
    sys.stdout.write(msg + "\n")
    sys.stdout.flush()


def handle(req):
    id_ = req.get("id")
    method = req.get("method", "")

    if method == "initialize":
        respond(id_, {
            "protocolVersion": "2024-11-05",
            "capabilities": {"tools": {}},
            "serverInfo": {"name": "mcp-echo", "version": "1.0.0"},
        })

    elif method == "notifications/initialized":
        pass  # no response needed for notifications

    elif method == "tools/list":
        respond(id_, {"tools": TOOLS})

    elif method == "tools/call":
        name = req.get("params", {}).get("name")
        args = req.get("params", {}).get("arguments", {})
        if name == "echo":
            respond(id_, {
                "content": [{"type": "text", "text": args.get("message", "")}]
            })
        elif name == "get_time":
            tz = args.get("timezone", "local")
            if tz.lower() == "utc":
                now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
            else:
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S (local)")
            respond(id_, {"content": [{"type": "text", "text": now}]})
        elif name == "calculate":
            a, b, op = args.get("a"), args.get("b"), args.get("operation")
            if op == "add":           result = a + b
            elif op == "subtract":    result = a - b
            elif op == "multiply":    result = a * b
            elif op == "divide":
                if b == 0:
                    error(id_, -32602, "Division by zero"); return
                result = a / b
            else:
                error(id_, -32602, f"Unknown operation: {op}"); return
            text = f"{a} {op} {b} = {result:g}"
            respond(id_, {"content": [{"type": "text", "text": text}]})
        else:
            error(id_, -32601, f"Unknown tool: {name}")

    else:
        if id_ is not None:
            error(id_, -32601, f"Method not found: {method}")


for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        handle(json.loads(line))
    except json.JSONDecodeError as e:
        error(None, -32700, f"Parse error: {e}")
