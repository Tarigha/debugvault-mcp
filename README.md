# debugvault-mcp

MCP server for [DebugVault](https://debugvlt.com) — search 5,530+ production bugs, get AI-powered debugging, and post bounties directly from your IDE.

## Quick Start

```bash
npx debugvault-mcp
```

## Setup

### Claude Code / Cursor / Windsurf

Add to your MCP config (`~/.claude/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "debugvault": {
      "command": "npx",
      "args": ["debugvault-mcp"],
      "env": {
        "DEBUGVAULT_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Get your free API key at [debugvlt.com/dashboard](https://debugvlt.com/dashboard).

## Tools

| Tool | Description | Credits |
|------|-------------|---------|
| `search_bugs` | Search 5,530+ production bugs by error message | Free |
| `debug_error` | AI-powered error diagnosis with ranked results | 3-12 |
| `get_bug` | Get full bug details by ID | Free |
| `list_categories` | Browse bug categories | Free |
| `post_bounty` | Post bug to marketplace for community fixes | 10-100 |

### AI Models

- **flash** (default) — Gemini 2.5 Flash, 3 credits
- **pro** — Gemini 2.5 Pro, 8 credits  
- **sonnet** — Claude Sonnet 4, 12 credits (Enterprise tier)

## Free Tier

- 50 credits on signup
- 100 queries/month
- First AI debug each day is free
- Vault search is always free

## License

MIT
