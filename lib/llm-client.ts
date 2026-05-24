/**
 * Client-side helpers that call the /api/coach and /api/transition routes.
 *
 * Both helpers return null on any failure (timeout, network error, refusal,
 * malformed response). Callers should treat null as "fall back to the
 * deterministic copy" — the LLM enhances, it never blocks.
 */

import type {
  CoachBrief,
  CoachCopy,
  TransitionBrief,
  TransitionCopy,
} from "@/lib/coach";

async function postJson<TIn, TOut>(
  url: string,
  body: TIn,
  timeoutMs: number,
): Promise<TOut | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[aida] ${url} returned ${res.status}`);
      }
      return null;
    }
    return (await res.json()) as TOut;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[aida] ${url} failed`, err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function fetchCoachCopy(
  brief: CoachBrief,
  signal?: AbortSignal,
): Promise<CoachCopy | null> {
  // Final results call can spend a bit longer — the user is already in a
  // "thinking" state. Cap at ~8s.
  return postJsonWithExternalSignal<CoachBrief, CoachCopy>(
    "/api/coach",
    brief,
    8000,
    signal,
  );
}

export function fetchTransition(
  brief: TransitionBrief,
  signal?: AbortSignal,
): Promise<TransitionCopy | null> {
  // Transitions sit between questions, so latency is visible. Cap at ~4s and
  // fall back to the deterministic transition if we miss the window.
  return postJsonWithExternalSignal<TransitionBrief, TransitionCopy>(
    "/api/transition",
    brief,
    4000,
    signal,
  );
}

async function postJsonWithExternalSignal<TIn, TOut>(
  url: string,
  body: TIn,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<TOut | null> {
  if (!externalSignal) return postJson<TIn, TOut>(url, body, timeoutMs);

  // Combine our timeout with any caller-supplied AbortSignal so a session
  // restart cleanly cancels in-flight LLM calls.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternal = () => controller.abort();
  externalSignal.addEventListener("abort", onExternal);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as TOut;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    externalSignal.removeEventListener("abort", onExternal);
  }
}
