import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export type AiAction = { task: string; assignee: string | null; deadline: string | null; date: string | null; time: string | null; source: number };

const INSTRUCTIONS = `You extract action items from a group chat. Messages are numbered "#N [time] Sender: text".
Rules:
- Only real tasks someone must do. Meeting/class/event announcements ("meeting Thursday 4pm, please attend") are NOT action items.
- task: a short imperative name for the work, under 12 words, no person's name in it.
- Resolve the assignee from context: "I'll do it" = the sender; replies like "Sure" accept the task asked of them; @mentions or names addressed. Use the participant's name as written. null if unclear.
- date: the day as stated ("Friday", "tomorrow", "18/03/25"), null if none.
- time: the clock time or part of day as stated ("11:59 pm", "2 pm", "evening"), null if none.
- deadline: the whole phrase as stated (e.g. "Friday 11:59 pm"), null if none.
- source = the message number where the task is defined.
- At most 30 items.
Return ONLY JSON: {"actions":[{"task":string,"assignee":string|null,"deadline":string|null,"date":string|null,"time":string|null,"source":number}]}`;

export async function extractActions(lines: string[]): Promise<AiAction[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system: INSTRUCTIONS,
    prompt: "Return json for this chat:\n" + lines.map((l, i) => `#${i} ${l}`).join("\n"),
    providerOptions: {
      openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
    },
    onError: ({ error }) => { failure = error; },
  });
  const text = await result.text;
  if (failure) {
    const status = (failure as { statusCode?: number }).statusCode;
    if (status === 429) throw new Error("AI is busy right now. Please try again in a minute.");
    if (status === 402) throw new Error("AI credits are used up. Add credits in workspace billing settings.");
    throw new Error("AI analysis failed. The local results are still shown.");
  }
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    const parsed = JSON.parse(json) as { actions?: AiAction[] };
    return (parsed.actions ?? [])
      .filter((a) => a && typeof a.task === "string" && Number.isInteger(a.source) && a.source >= 0 && a.source < lines.length)
      .slice(0, 30);
  } catch {
    throw new Error("AI returned an unreadable answer. Please try again.");
  }
}
