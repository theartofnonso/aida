import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  COACH_OUTPUT_SCHEMA,
  type CoachBrief,
  type CoachCopy,
} from "@/lib/coach";
import { SYSTEM_PROMPT_COACH } from "@/lib/coach-prompts";

// Use Node.js runtime so the Anthropic SDK can read the env var natively.
export const runtime = "nodejs";

// Module-scoped client. Constructed once per server instance so the SDK's
// HTTP keep-alive can amortise across requests.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "missing_api_key" },
      { status: 503 },
    );
  }

  let brief: CoachBrief;
  try {
    brief = (await req.json()) as CoachBrief;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT_COACH,
          // Cache the voice rules + few-shot examples. Hits the prefix every
          // call in a session, so subsequent reads are ~10x cheaper.
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: COACH_OUTPUT_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: `Here is the brief. Translate it to Aida's voice and return the JSON.\n\n${JSON.stringify(
            brief,
            null,
            2,
          )}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "refused" },
        { status: 422 },
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "no_text_block" },
        { status: 502 },
      );
    }

    const copy = JSON.parse(textBlock.text) as CoachCopy;
    return NextResponse.json(copy, {
      headers: {
        // Surface cache stats to the dev console so we can verify caching.
        "x-aida-cache-read": String(
          response.usage.cache_read_input_tokens ?? 0,
        ),
        "x-aida-cache-write": String(
          response.usage.cache_creation_input_tokens ?? 0,
        ),
      },
    });
  } catch (err) {
    console.error("coach api error", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "anthropic_error", status: err.status, message: err.message },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
