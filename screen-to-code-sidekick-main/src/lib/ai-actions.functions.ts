import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const aiExtractActions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lines: string[] }) => {
    if (!Array.isArray(d?.lines) || d.lines.length === 0) throw new Error("No messages.");
    const lines = d.lines.slice(0, 400).map((l) => String(l).slice(0, 2000));
    if (lines.join("").length > 90000) throw new Error("This part of the conversation is too long for AI.");
    return { lines };
  })
  .handler(async ({ data }) => {
    const { extractActions } = await import("./ai-actions.server");
    try {
      return { actions: await extractActions(data.lines), error: null as string | null };
    } catch (e) {
      return { actions: [], error: e instanceof Error ? e.message : "AI analysis failed." };
    }
  });
