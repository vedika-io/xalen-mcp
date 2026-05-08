/**
 * XALEN API client.
 *
 * Handles HTTP communication with https://api.xalen.io/v1.
 * Auth via XALEN_API_KEY env var (Bearer token).
 */

const BASE_URL = process.env.XALEN_BASE_URL ?? "https://api.xalen.io/v1";

function getApiKey(): string {
  const key = process.env.XALEN_API_KEY;
  if (!key) {
    throw new Error(
      "XALEN_API_KEY environment variable is not set. " +
        "Get your key at https://xalen.io/dashboard"
    );
  }
  return key;
}

interface RequestOptions {
  method?: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Send a request to the XALEN API.
 */
export async function request<T = unknown>(
  opts: RequestOptions
): Promise<ApiResponse<T>> {
  const { method = "POST", path, body, timeout = 120_000 } = opts;
  const url = `${BASE_URL}${path}`;
  const apiKey = getApiKey();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "xalen-mcp/1.0.0",
    };

    const fetchOpts: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && method === "POST") {
      fetchOpts.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOpts);
    const data = (await res.json()) as T;

    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

// ── Typed API methods ──────────────────────────────────────────────

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export async function chatCompletion(params: ChatCompletionParams) {
  return request({
    path: "/chat/completions",
    body: {
      model: params.model,
      messages: params.messages,
      ...(params.temperature !== undefined && {
        temperature: params.temperature,
      }),
      ...(params.max_tokens !== undefined && {
        max_tokens: params.max_tokens,
      }),
      stream: false,
    },
  });
}

export async function listModels() {
  return request({ method: "GET", path: "/models" });
}

export interface ImageGenerationParams {
  prompt: string;
  model?: string;
  size?: string;
  n?: number;
}

export async function generateImage(params: ImageGenerationParams) {
  return request({
    path: "/images/generations",
    body: {
      prompt: params.prompt,
      model: params.model ?? "flux-1.1-pro",
      ...(params.size && { size: params.size }),
      n: params.n ?? 1,
    },
    timeout: 180_000, // image gen can be slow
  });
}

export interface KundaliParams {
  name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function generateKundali(params: KundaliParams) {
  return request({
    path: "/kundali",
    body: {
      name: params.name,
      date: params.date,
      time: params.time,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
    },
  });
}

export interface VoiceTTSParams {
  text: string;
  voice?: string;
  language?: string;
}

export async function voiceTTS(params: VoiceTTSParams) {
  return request({
    path: "/voice/tts",
    body: {
      text: params.text,
      voice: params.voice ?? "pandit",
      language: params.language ?? "en",
    },
    timeout: 60_000,
  });
}

export async function checkBalance() {
  return request({ method: "GET", path: "/billing/balance" });
}

// ── Embeddings ────────────────────────────────────────────────────

export interface EmbeddingsParams {
  input: string | string[];
  model?: string;
}

export async function generateEmbeddings(params: EmbeddingsParams) {
  return request({
    path: "/embeddings",
    body: {
      input: params.input,
      model: params.model ?? "e5-mistral-7b",
    },
  });
}

// ── Audio transcription ───────────────────────────────────────────

export interface TranscribeAudioParams {
  audio_url: string;
  model?: string;
  language?: string;
}

export async function transcribeAudio(params: TranscribeAudioParams) {
  return request({
    path: "/audio/transcriptions",
    body: {
      url: params.audio_url,
      model: params.model ?? "whisper-large-v3",
      ...(params.language && { language: params.language }),
    },
    timeout: 180_000,
  });
}

// ── Panchang (Vedic calendar) ─────────────────────────────────────

export interface PanchangParams {
  date: string; // YYYY-MM-DD
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function getPanchang(params: PanchangParams) {
  return request({
    path: "/v2/astrology/panchang",
    body: {
      date: params.date,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
    },
  });
}

// ── Kundali matching ──────────────────────────────────────────────

export interface MatchPerson {
  name: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface MatchKundaliParams {
  person1: MatchPerson;
  person2: MatchPerson;
}

export async function matchKundali(params: MatchKundaliParams) {
  return request({
    path: "/v2/astrology/match",
    body: {
      person1: params.person1,
      person2: params.person2,
    },
  });
}

// ── Horoscope ─────────────────────────────────────────────────────

export interface HoroscopeParams {
  sign: string;
  period?: string;
  system?: string;
}

export async function getHoroscope(params: HoroscopeParams) {
  return request({
    method: "GET",
    path: `/v2/astrology/horoscope/${encodeURIComponent(params.sign)}` +
      `?period=${encodeURIComponent(params.period ?? "daily")}` +
      `&system=${encodeURIComponent(params.system ?? "vedic")}`,
  });
}

// ── Vastu analysis ────────────────────────────────────────────────

export interface VastuRoom {
  name: string;
  direction: string;
}

export interface VastuAnalysisParams {
  direction: string;
  rooms: VastuRoom[];
  latitude: number;
  longitude: number;
}

export async function getVastuAnalysis(params: VastuAnalysisParams) {
  return request({
    path: "/v2/astrology/vastu/analysis",
    body: {
      direction: params.direction,
      rooms: params.rooms,
      latitude: params.latitude,
      longitude: params.longitude,
    },
  });
}

// ── Dasha (Vimshottari periods) ───────────────────────────────────

export interface DashaParams {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function getDasha(params: DashaParams) {
  return request({
    path: "/v2/astrology/dasha",
    body: {
      date: params.date,
      time: params.time,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
    },
  });
}

// ── Yoga analysis ─────────────────────────────────────────────────

export interface YogaAnalysisParams {
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function getYogaAnalysis(params: YogaAnalysisParams) {
  return request({
    path: "/v2/astrology/yoga",
    body: {
      date: params.date,
      time: params.time,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
    },
  });
}

// ── Planetary transits ────────────────────────────────────────────

export interface TransitParams {
  date: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function getTransits(params: TransitParams) {
  return request({
    path: "/v2/astrology/transit",
    body: {
      date: params.date,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
    },
  });
}
