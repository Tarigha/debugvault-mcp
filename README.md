# debugvault-mcp

Official MCP server for [DebugVault](https://debugvlt.com) — the production bug database for developers.

Search 5,530+ real production bugs, get AI-powered debugging, and post bounties directly from Cursor, Claude Code, Cline, and Windsurf.

## Quick Start

### Option 1: npx (recommended)
Add to your MCP config:
```json
{
  "mcpServers": {
    "debugvault": {
      "command": "npx",
      "args": ["debugvault-mcp"],
      "env": { "DEBUGVAULT_API_KEY": "your_api_key_here" }
    }
  }
}
```

### Option 2: HTTP (Cursor/Windsurf)
```json
{
  "mcpServers": {
    "debugvault": {
      "url": "https://debugvlt.com/api/mcp",
      "headers": { "Authorization": "Bearer your_api_key_here" }
    }
  }
}
```

Get your API key at [debugvlt.com/dashboard](https://debugvlt.com/dashboard)

## Tools (11)

| Tool | Description | Credits |
|------|-------------|---------|
| `search_debugvault` | Search bug database by error message | Free |
| `debug_error` | AI-powered diagnosis + vault search | 2-10 |
| `debug` | Alias for debug_error | 2-10 |
| `analyze_file` | Analyze source code for bugs | 2-10 |
| `debug_async` | Submit async debug job, get jobId | 2-10 |
| `get_bug` | Get full bug details by ID | Free |
| `post_bounty` | Post bug to bounty marketplace | 10-100 |
| `list_categories` | List all bug categories | Free |
| `get_account` | Check credit balance and tier | Free |
| `get_usage` | API usage statistics | Free |
| `get_transactions` | Credit transaction history | Free |

## Usage Examples

### Search for a known error
"search debugvault for TypeError cannot read properties of undefined"

### Get AI diagnosis
"debug this error: [paste your stack trace]"

### Analyze a file
"analyze this file for bugs" (Cline will call analyze_file with file contents)

### Check your balance
"how many credits do I have on debugvault"

## Credit Tiers
- **Free**: 100 credits on signup
- **Hacker**: $6.99/week — 100 credits/week
- **Pro**: $29.99/month — 500 credits/month
- **Team**: $79.99/month — 2,000 credits/month

## Links
- Website: https://debugvlt.com
- Dashboard: https://debugvlt.com/dashboard
- Pricing: https://debugvlt.com/pricing
- GitHub: https://github.com/Tarigha/debugvault-mcp
