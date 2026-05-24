import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  TRANSITION_OUTPUT_SCHEMA,
  type TransitionBrief,
  type TransitionCopy,
} from "@/lib/coach";
import { SYSTEM_PROMPT_TRANSITION } from "@/lib/coach-prompts";

export const runtime = "nodejs";

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

  let brief: TransitionBrief;
  try {
    brief = (await req.json()) as TransitionBrief;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const response = await getClient().messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT_TRANSITION,
          cache_control: { type: "ephemeral" },
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: TRANSITION_OUTPUT_SCHEMA,
        },
      },
      messages: [
        {
          role: "user",
          content: `Here is the brief. Return the JSON.\n\n${JSON.stringify(
            brief,
            null,
            2,
          )}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "refused" }, { status: 422 });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "no_text_block" }, { status: 502 });
    }

    const copy = JSON.parse(textBlock.text) as TransitionCopy;
    return NextResponse.json(copy, {
      headers: {
        "x-aida-cache-read": String(
          response.usage.cache_read_input_tokens ?? 0,
        ),
        "x-aida-cache-write": String(
          response.usage.cache_creation_input_tokens ?? 0,
        ),
      },
    });
  } catch (err) {
    console.error("transition api error", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "anthropic_error", status: err.status, message: err.message },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
