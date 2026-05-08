/**
 * MCP tool definitions for the XALEN API.
 *
 * Each tool is registered on the McpServer instance with a Zod input schema
 * and a handler that calls the XALEN API client.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  chatCompletion,
  listModels,
  generateImage,
  generateKundali,
  voiceTTS,
  checkBalance,
  generateEmbeddings,
  transcribeAudio,
  getPanchang,
  matchKundali,
  getHoroscope,
  getVastuAnalysis,
  getDasha,
  getYogaAnalysis,
  getTransits,
} from "./client.js";

function errorContent(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

function jsonContent(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

// ── Tool registrations ────────────────────────────────────────────

export function registerTools(server: McpServer): void {
  // 1. Chat completion
  server.registerTool(
    "chat_completion",
    {
      title: "Chat Completion",
      description:
        "Send a chat completion request to any XALEN model. Returns the assistant's response. " +
        "Compatible with OpenAI chat format.",
      inputSchema: z.object({
        model: z
          .string()
          .describe(
            'Model ID to use (e.g. "gpt-oss-120b", "llama-3.3-70b", "qwen-2.5-72b")'
          ),
        messages: z
          .array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          )
          .min(1)
          .describe("Array of chat messages with role and content"),
        temperature: z
          .number()
          .min(0)
          .max(2)
          .optional()
          .describe("Sampling temperature (0-2). Lower = more deterministic."),
        max_tokens: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Maximum tokens in the response"),
      }),
    },
    async (params) => {
      try {
        const res = await chatCompletion({
          model: params.model,
          messages: params.messages,
          temperature: params.temperature,
          max_tokens: params.max_tokens,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        // Extract the assistant message if present
        const data = res.data as Record<string, unknown>;
        const choices = data.choices as Array<{
          message?: { content?: string };
        }>;
        if (choices?.[0]?.message?.content) {
          return {
            content: [
              { type: "text" as const, text: choices[0].message.content },
            ],
          };
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 2. List models
  server.registerTool(
    "list_models",
    {
      title: "List Models",
      description:
        "List all available XALEN models with their pricing and capabilities.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const res = await listModels();
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 3. Image generation
  server.registerTool(
    "generate_image",
    {
      title: "Generate Image",
      description:
        "Generate an image using FLUX or SDXL models via the XALEN API. " +
        "Returns image URL(s).",
      inputSchema: z.object({
        prompt: z.string().min(1).describe("Text description of the image to generate"),
        model: z
          .string()
          .default("flux-1.1-pro")
          .describe(
            'Image model ID (e.g. "flux-1.1-pro", "sdxl-1.0", "flux-schnell")'
          ),
        size: z
          .string()
          .optional()
          .describe(
            'Image dimensions (e.g. "1024x1024", "1024x768", "768x1024")'
          ),
      }),
    },
    async (params) => {
      try {
        const res = await generateImage({
          prompt: params.prompt,
          model: params.model,
          size: params.size,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        // Try to extract image URLs
        const data = res.data as Record<string, unknown>;
        const images = data.data as Array<{ url?: string; b64_json?: string }>;
        if (images?.[0]?.url) {
          const urls = images.map((img) => img.url).join("\n");
          return {
            content: [{ type: "text" as const, text: `Generated image(s):\n${urls}` }],
          };
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 4. Kundali (Vedic birth chart)
  server.registerTool(
    "kundali",
    {
      title: "Vedic Birth Chart (Kundali)",
      description:
        "Generate a Vedic birth chart (Kundali/Janam Patri) with planetary positions, " +
        "houses, nakshatras, dashas, and yogas for a given birth time and location.",
      inputSchema: z.object({
        name: z.string().min(1).describe("Name of the person"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Date of birth in YYYY-MM-DD format"),
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .describe("Time of birth in HH:MM (24-hour) format"),
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Birth location latitude (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Birth location longitude (-180 to 180)"),
        timezone: z
          .string()
          .describe('IANA timezone (e.g. "Asia/Kolkata", "America/New_York")'),
      }),
    },
    async (params) => {
      try {
        const res = await generateKundali({
          name: params.name,
          date: params.date,
          time: params.time,
          latitude: params.latitude,
          longitude: params.longitude,
          timezone: params.timezone,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 5. Voice TTS
  server.registerTool(
    "voice_tts",
    {
      title: "Text to Speech",
      description:
        "Convert text to speech using XALEN voice synthesis. " +
        "Returns audio URL or base64-encoded audio data.",
      inputSchema: z.object({
        text: z.string().min(1).max(5000).describe("Text to convert to speech"),
        voice: z
          .string()
          .default("pandit")
          .describe(
            'Voice ID (e.g. "pandit", "devi", "guru"). Defaults to "pandit".'
          ),
        language: z
          .string()
          .default("en")
          .describe(
            'Language code (e.g. "en", "hi", "ta", "te"). Defaults to "en".'
          ),
      }),
    },
    async (params) => {
      try {
        const res = await voiceTTS({
          text: params.text,
          voice: params.voice,
          language: params.language,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        const data = res.data as Record<string, unknown>;
        if (typeof data.audio_url === "string") {
          return {
            content: [
              {
                type: "text" as const,
                text: `Audio generated: ${data.audio_url}`,
              },
            ],
          };
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 6. Check balance
  server.registerTool(
    "check_balance",
    {
      title: "Check Wallet Balance",
      description:
        "Check your XALEN API wallet balance, usage stats, and plan details.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const res = await checkBalance();
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 7. Embeddings
  server.registerTool(
    "embeddings",
    {
      title: "Generate Embeddings",
      description:
        "Generate text embeddings using XALEN embedding models. " +
        "Returns vector representations for semantic search, clustering, or RAG pipelines.",
      inputSchema: z.object({
        input: z
          .union([z.string(), z.array(z.string())])
          .describe("Text string or array of strings to embed"),
        model: z
          .string()
          .default("e5-mistral-7b")
          .describe(
            'Embedding model ID (e.g. "e5-mistral-7b"). Defaults to "e5-mistral-7b".'
          ),
      }),
    },
    async (params) => {
      try {
        const res = await generateEmbeddings({
          input: params.input,
          model: params.model,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 8. Audio transcription
  server.registerTool(
    "transcribe_audio",
    {
      title: "Speech to Text",
      description:
        "Transcribe audio to text using Whisper models via the XALEN API. " +
        "Provide a URL to an audio file and get back the transcription.",
      inputSchema: z.object({
        audio_url: z
          .string()
          .url()
          .describe("URL of the audio file to transcribe"),
        model: z
          .string()
          .default("whisper-large-v3")
          .describe(
            'Whisper model ID (e.g. "whisper-large-v3"). Defaults to "whisper-large-v3".'
          ),
        language: z
          .string()
          .optional()
          .describe(
            'Language code hint (e.g. "en", "hi", "ta"). Auto-detected if omitted.'
          ),
      }),
    },
    async (params) => {
      try {
        const res = await transcribeAudio({
          audio_url: params.audio_url,
          model: params.model,
          language: params.language,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        const data = res.data as Record<string, unknown>;
        if (typeof data.text === "string") {
          return {
            content: [{ type: "text" as const, text: data.text }],
          };
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 9. Panchang (Vedic calendar)
  server.registerTool(
    "panchang",
    {
      title: "Vedic Calendar (Panchang)",
      description:
        "Get the Vedic panchang (calendar) for a given date and location. " +
        "Returns tithi, nakshatra, yoga, karana, muhurta, sunrise/sunset, and auspicious timings.",
      inputSchema: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Date in YYYY-MM-DD format"),
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Location latitude (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Location longitude (-180 to 180)"),
        timezone: z
          .string()
          .describe('IANA timezone (e.g. "Asia/Kolkata", "America/New_York")'),
      }),
    },
    async (params) => {
      try {
        const res = await getPanchang({
          date: params.date,
          latitude: params.latitude,
          longitude: params.longitude,
          timezone: params.timezone,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 10. Kundali matching
  const matchPersonSchema = z.object({
    name: z.string().min(1).describe("Person's name"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Date of birth in YYYY-MM-DD format"),
    time: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .describe("Time of birth in HH:MM (24-hour) format"),
    latitude: z.number().min(-90).max(90).describe("Birth location latitude"),
    longitude: z.number().min(-180).max(180).describe("Birth location longitude"),
    timezone: z.string().describe('IANA timezone (e.g. "Asia/Kolkata")'),
  });

  server.registerTool(
    "match_kundali",
    {
      title: "Kundali Matching",
      description:
        "Match two birth charts (Kundali) for compatibility analysis. " +
        "Returns Ashtakoot guna milan score (out of 36), mangal dosha check, " +
        "and detailed compatibility breakdown.",
      inputSchema: z.object({
        person1: matchPersonSchema.describe("First person's birth details"),
        person2: matchPersonSchema.describe("Second person's birth details"),
      }),
    },
    async (params) => {
      try {
        const res = await matchKundali({
          person1: params.person1,
          person2: params.person2,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 11. Horoscope
  server.registerTool(
    "horoscope",
    {
      title: "Daily/Weekly/Monthly Horoscope",
      description:
        "Get a daily, weekly, or monthly horoscope prediction for a zodiac sign. " +
        "Supports both Vedic (Moon sign / rashi) and Western (Sun sign) systems.",
      inputSchema: z.object({
        sign: z
          .string()
          .describe(
            'Zodiac sign (e.g. "aries", "taurus", "gemini", "mesha", "vrishabha")'
          ),
        period: z
          .enum(["daily", "weekly", "monthly"])
          .default("daily")
          .describe("Horoscope period. Defaults to daily."),
        system: z
          .enum(["vedic", "western"])
          .default("vedic")
          .describe("Astrology system. Defaults to vedic."),
      }),
    },
    async (params) => {
      try {
        const res = await getHoroscope({
          sign: params.sign,
          period: params.period,
          system: params.system,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        const data = res.data as Record<string, unknown>;
        if (typeof data.prediction === "string") {
          return {
            content: [{ type: "text" as const, text: data.prediction }],
          };
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 12. Vastu analysis
  server.registerTool(
    "vastu_analysis",
    {
      title: "Vastu Shastra Analysis",
      description:
        "Analyze a property layout using Vastu Shastra principles. " +
        "Provide the main entrance direction, room placements, and location " +
        "to get compliance scores, remedies, and recommendations.",
      inputSchema: z.object({
        direction: z
          .string()
          .describe(
            'Main entrance direction (e.g. "north", "northeast", "east", "south")'
          ),
        rooms: z
          .array(
            z.object({
              name: z
                .string()
                .describe('Room name (e.g. "kitchen", "bedroom", "puja room")'),
              direction: z
                .string()
                .describe('Room placement direction (e.g. "southeast", "northwest")'),
            })
          )
          .min(1)
          .describe("Array of rooms with their directional placements"),
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Property latitude (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Property longitude (-180 to 180)"),
      }),
    },
    async (params) => {
      try {
        const res = await getVastuAnalysis({
          direction: params.direction,
          rooms: params.rooms,
          latitude: params.latitude,
          longitude: params.longitude,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 13. Dasha periods
  server.registerTool(
    "dasha",
    {
      title: "Vimshottari Dasha Periods",
      description:
        "Calculate Vimshottari Dasha periods for a birth chart. " +
        "Returns the full Mahadasha-Antardasha-Pratyantardasha hierarchy " +
        "with start/end dates and planetary rulers.",
      inputSchema: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Date of birth in YYYY-MM-DD format"),
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .describe("Time of birth in HH:MM (24-hour) format"),
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Birth location latitude (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Birth location longitude (-180 to 180)"),
        timezone: z
          .string()
          .describe('IANA timezone (e.g. "Asia/Kolkata", "America/New_York")'),
      }),
    },
    async (params) => {
      try {
        const res = await getDasha({
          date: params.date,
          time: params.time,
          latitude: params.latitude,
          longitude: params.longitude,
          timezone: params.timezone,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 14. Yoga analysis
  server.registerTool(
    "yoga_analysis",
    {
      title: "Yoga Analysis",
      description:
        "Analyze planetary yogas present in a birth chart. " +
        "Identifies Raja Yoga, Dhana Yoga, Vipreeta Raja Yoga, Pancha Mahapurusha Yoga, " +
        "and 100+ other classical yoga combinations with their effects.",
      inputSchema: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Date of birth in YYYY-MM-DD format"),
        time: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .describe("Time of birth in HH:MM (24-hour) format"),
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Birth location latitude (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Birth location longitude (-180 to 180)"),
        timezone: z
          .string()
          .describe('IANA timezone (e.g. "Asia/Kolkata", "America/New_York")'),
      }),
    },
    async (params) => {
      try {
        const res = await getYogaAnalysis({
          date: params.date,
          time: params.time,
          latitude: params.latitude,
          longitude: params.longitude,
          timezone: params.timezone,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );

  // 15. Planetary transits
  server.registerTool(
    "transit",
    {
      title: "Planetary Transits",
      description:
        "Get current planetary transits (gochar) and their effects for a given date and location. " +
        "Returns planet positions, sign ingresses, retrograde status, and transit predictions.",
      inputSchema: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .describe("Date in YYYY-MM-DD format"),
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Location latitude (-90 to 90)"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Location longitude (-180 to 180)"),
        timezone: z
          .string()
          .describe('IANA timezone (e.g. "Asia/Kolkata", "America/New_York")'),
      }),
    },
    async (params) => {
      try {
        const res = await getTransits({
          date: params.date,
          latitude: params.latitude,
          longitude: params.longitude,
          timezone: params.timezone,
        });
        if (!res.ok) {
          return errorContent(
            `API error ${res.status}: ${JSON.stringify(res.data)}`
          );
        }
        return jsonContent(res.data);
      } catch (e) {
        return errorContent(`Request failed: ${(e as Error).message}`);
      }
    }
  );
}
