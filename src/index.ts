#!/usr/bin/env node

/**
 * @xalen/mcp-server
 *
 * MCP server that exposes the XALEN API to AI assistants (Claude, Cursor, Copilot).
 *
 * Tools (15):
 *   - chat_completion   — Send chat completions to any XALEN model
 *   - list_models       — List available models with pricing
 *   - generate_image    — Generate images with FLUX/SDXL
 *   - kundali           — Generate a Vedic birth chart
 *   - voice_tts         — Text to speech
 *   - check_balance     — Check wallet balance
 *   - embeddings        — Generate text embeddings
 *   - transcribe_audio  — Speech-to-text transcription
 *   - panchang          — Vedic calendar / panchang
 *   - match_kundali     — Kundali matching for compatibility
 *   - horoscope         — Daily/weekly/monthly horoscope
 *   - vastu_analysis    — Vastu Shastra property analysis
 *   - dasha             — Vimshottari Dasha periods
 *   - yoga_analysis     — Birth chart yoga identification
 *   - transit           — Planetary transits and effects
 *
 * Auth: Set XALEN_API_KEY env var.
 * Transport: stdio (for Claude Desktop, Cursor, VS Code, etc.)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

const server = new McpServer(
  {
    name: "xalen",
    version: "1.0.0",
  },
  {
    instructions:
      "XALEN API server — full faith-tech marketplace. " +
      "AI: chat_completion, list_models, embeddings, transcribe_audio, generate_image. " +
      "Vedic Astrology: kundali, match_kundali, panchang, dasha, yoga_analysis, transit, horoscope. " +
      "Vastu: vastu_analysis. Voice: voice_tts. Billing: check_balance. " +
      "Requires XALEN_API_KEY env var.",
  }
);

registerTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("XALEN MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
