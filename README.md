# @xalen/mcp-server

MCP (Model Context Protocol) server for the [XALEN API](https://xalen.io). Lets AI assistants — Claude Desktop, Cursor, GitHub Copilot, VS Code — interact with XALEN directly.

## Tools (15)

### AI & Media

| Tool | Description |
|------|-------------|
| `chat_completion` | Send a chat completion request to any XALEN model |
| `list_models` | List available models with pricing |
| `generate_image` | Generate images with FLUX/SDXL models |
| `embeddings` | Generate text embeddings for search, clustering, or RAG |
| `transcribe_audio` | Speech-to-text transcription via Whisper |
| `voice_tts` | Convert text to speech |

### Vedic Astrology

| Tool | Description |
|------|-------------|
| `kundali` | Generate a Vedic birth chart (Kundali / Janam Patri) |
| `match_kundali` | Kundali matching — Ashtakoot compatibility score |
| `panchang` | Vedic calendar — tithi, nakshatra, yoga, karana, muhurta |
| `dasha` | Vimshottari Dasha periods with Mahadasha/Antardasha hierarchy |
| `yoga_analysis` | Identify 100+ classical yogas in a birth chart |
| `horoscope` | Daily/weekly/monthly horoscope (Vedic or Western) |
| `transit` | Current planetary transits and their effects |

### Vastu & Billing

| Tool | Description |
|------|-------------|
| `vastu_analysis` | Vastu Shastra property analysis with remedies |
| `check_balance` | Check wallet balance and usage |

## Quick Start

### Claude Desktop

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "xalen": {
      "command": "npx",
      "args": ["-y", "@xalen/mcp-server"],
      "env": {
        "XALEN_API_KEY": "xln_live_..."
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "xalen": {
      "command": "npx",
      "args": ["-y", "@xalen/mcp-server"],
      "env": {
        "XALEN_API_KEY": "xln_live_..."
      }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "xalen": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xalen/mcp-server"],
      "env": {
        "XALEN_API_KEY": "xln_live_..."
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add xalen -- npx -y @xalen/mcp-server
```

Set the API key in your environment:

```bash
export XALEN_API_KEY="xln_live_..."
```

## Get Your API Key

1. Sign up at [xalen.io](https://xalen.io)
2. Go to the [Dashboard](https://xalen.io/dashboard)
3. Copy your API key (starts with `xln_live_`)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XALEN_API_KEY` | Yes | Your XALEN API key |
| `XALEN_BASE_URL` | No | Override API base URL (default: `https://api.xalen.io/v1`) |

## Build from Source

```bash
git clone https://github.com/xalen-io/mcp-server.git
cd mcp-server
npm install
npm run build
node dist/index.js
```

## Example Usage

Once configured, ask your AI assistant:

- "Use XALEN to list available models"
- "Generate an image of a sunset over mountains using XALEN"
- "Create a Vedic birth chart for someone born on 1990-05-15 at 14:30 in Mumbai"
- "Match two kundalis for compatibility — person A born 1992-03-10 Delhi, person B born 1994-07-22 Mumbai"
- "Get today's panchang for Pune"
- "What yogas are present in my chart?"
- "Show Vimshottari Dasha periods for this birth time"
- "Get daily Vedic horoscope for Aries"
- "Analyze Vastu for a north-facing house with kitchen in southeast"
- "What are the current planetary transits?"
- "Generate embeddings for these product descriptions"
- "Transcribe this audio recording"
- "Check my XALEN API balance"
- "Use XALEN chat to explain quantum computing with the gpt-oss-120b model"

## License

MIT
