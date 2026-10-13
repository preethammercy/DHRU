import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "./route";
import { aiExtractActions } from "@/lib/ai-actions.functions";
import { analyze, SAMPLE_CHAT, SAMPLE_WHATSAPP, whenOf, type Analysis, type Item } from "@/lib/analyzer";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "MissedMate AI — Catch up on what matters" },
      { name: "description", content: "Paste a WhatsApp or group chat and see the tasks, deadlines, meetings and reminders — each with who is responsible. Processed on your device." },
      { property: "og:title", content: "MissedMate AI — Catch up on what matters" },
      { property: "og:description", content: "Private, on-device catch-up for busy college group chats: tasks, deadlines, meetings and reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const STORE = "missedmate:v1";
const CHUNK_LINES = 250;
const CHUNK_CHARS = 45000;
type AiRes = Awaited<ReturnType<typeof aiExtractActions>>;

// Split a chat into AI-sized batches so chats of any length still work.
const chunkLines = (lines: string[]) => {
  const chunks: { start: number; lines: string[] }[] = [];
  let start = 0;
  let cur: string[] = [];
  let chars = 0;
  lines.forEach((l, i) => {
    if (cur.length && (cur.length >= CHUNK_LINES || chars + l.length > CHUNK_CHARS)) {
      chunks.push({ start, lines: cur });
      start = i;
      cur = [];
      chars = 0;
    }
    cur.push(l);
    chars += l.length;
  });
  if (cur.length) chunks.push({ start, lines: cur });
  return chunks;
};

const askAi = (lines: string[]): Promise<AiRes> =>
  aiExtractActions({ data: { lines } }).catch(() => ({ actions: [], error: "AI analysis failed" }) as AiRes);

function Index() {
  const account = useAccount();
  const navigate = useNavigate();
  const signOut = async () => {
    sessionStorage.removeItem("missedmate:pin-unlocked");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState("");
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || "null");
      if (s?.text) { setText(s.text); setDone(s.done || {}); const r = analyze(s.text); setResult(Array.isArray(s.aiActions) ? { ...r, actions: s.aiActions } : r); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!result) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ text, done, aiActions: result.actions.some((a) => a.id.startsWith("ai-")) ? result.actions : undefined }));
      setSaveNote("");
    } catch {
      setSaveNote("This chat is too large for your browser to remember — it stays on screen but won't come back after a refresh.");
    }
  }, [result, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    const t = text.trim();
    if (!t) return setError("Please paste a conversation first.");
    const r = analyze(t);
    if (r.messages.length < 2) return setError('Couldn\'t find chat messages. Paste a WhatsApp export or lines like "Name: message".');
    setError(""); setAiNote(""); setSaveNote(""); setDone({}); setResult(r);
  };
  const runAi = async () => {
    const t = text.trim();
    if (!t) return setError("Please paste a conversation first.");
    const base = analyze(t);
    if (base.messages.length < 2) return setError("Couldn't find chat messages to send to AI.");
    const lines = base.messages.map((m) => `${m.time ? `[${m.time}] ` : ""}${m.sender}: ${m.text.replace(/\n/g, " ")}`);
    const chunks = chunkLines(lines);
    if (!confirm(`This sends the chat text to Lovable AI for analysis${chunks.length > 1 ? ` in ${chunks.length} parts` : ""}. Continue?`)) return;
    setError(""); setAiBusy(true); setAiNote(""); setSaveNote("");
    try {
      const actions: Item[] = [];
      const seen = new Set<string>();
      let ok = 0;
      for (let i = 0; i < chunks.length; i += 3) {
        const group = chunks.slice(i, i + 3);
        if (chunks.length > 1) setAiNote(`AI is reading part ${i + 1}–${Math.min(i + group.length, chunks.length)} of ${chunks.length}…`);
        const rs = await Promise.all(group.map((c) => askAi(c.lines)));
        rs.forEach((r, j) => {
          if (r.error) return;
          ok++;
          r.actions.forEach((a) => {
            const key = a.task.trim().toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            const src = base.messages[group[j]!.start + a.source];
            if (!src) return;
            const w = whenOf(src.text);
            const w2 = a.date || a.time ? whenOf(`${a.date ?? ""} ${a.time ?? ""}`) : undefined;
            actions.push({
              id: `ai-${actions.length}`, text: src.text, source: src, task: a.task,
              assignee: a.assignee ?? undefined, date: a.date ?? w.date, time: a.time ?? w.time,
              day: w2?.day ?? w.day, at: w2?.at ?? w.at, deadline: a.deadline ?? undefined,
            });
          });
        });
      }
      if (!ok) { setResult(base); setAiNote("AI analysis failed. Showing local results."); return; }
      setDone({}); setResult({ ...base, actions });
      setAiNote(`AI found ${actions.length} task${actions.length === 1 ? "" : "s"}${chunks.length > 1 ? ` (read ${ok} of ${chunks.length} parts)` : ""}.`);
    } catch { setAiNote("AI analysis failed. Showing local results."); setResult(base); }
    finally { setAiBusy(false); }
  };
  const clear = () => { setText(""); setResult(null); setDone({}); setError(""); setAiNote(""); setSaveNote(""); localStorage.removeItem(STORE); };
  const load = (sample: string) => { setText(sample); setError(""); setAiNote(""); };

  const completed = result ? result.actions.filter((a) => done[a.id]).length : 0;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand font-bold text-primary-foreground">M</div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight">MissedMate AI</h1>
            <p className="text-sm text-muted-foreground">Catch up on what matters.</p>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success sm:inline">🔒 On-device by default</span>
            <span className="hidden text-sm font-semibold md:inline">{account.displayName || account.email}</span>
            <button onClick={signOut} className="rounded-xl border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted">Sign out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <section className="rounded-2xl border bg-card p-5 shadow-card">
          <label htmlFor="chat" className="mb-1 block font-semibold">Paste your group chat</label>
          <p className="mb-2 text-xs text-muted-foreground">WhatsApp, Telegram or any export — any length, no sign-up.</p>
          <textarea
            id="chat" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"[09:02] Priya: Assignment due Friday by 11:59 pm\n[09:15] Karan: Meeting Thursday 4 pm in Lab 2"}
            className="h-64 w-full resize-y rounded-xl border bg-background p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">{text.length.toLocaleString()} characters</div>
          {saveNote && <p className="mt-1 text-xs text-muted-foreground">{saveNote}</p>}
          {aiNote && <p className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{aiNote}</p>}
          {error && <p role="alert" className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
            <button onClick={run} className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-primary-foreground shadow-card transition hover:opacity-90">Analyze Messages</button>
            <button onClick={() => load(SAMPLE_CHAT)} className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-2.5 font-semibold text-primary hover:bg-primary/10">Load Sample Messages</button>
            <button onClick={() => load(SAMPLE_WHATSAPP)} className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-2.5 font-semibold text-primary hover:bg-primary/10">Load WhatsApp Sample</button>
            <button onClick={clear} className="rounded-xl border px-5 py-2.5 font-semibold text-muted-foreground hover:bg-muted">Clear</button>
            <button onClick={runAi} disabled={aiBusy} className="rounded-xl border border-primary bg-card px-5 py-2.5 font-semibold text-primary hover:bg-primary/10 disabled:opacity-60">{aiBusy ? "AI is reading…" : "✨ Find tasks with AI"}</button>
          </div>
        </section>

        {result && (
          <>
            <Card title="Summary" icon="📝" tone="primary">
              <ul className="list-disc space-y-1 pl-5 text-sm">{result.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </Card>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                <span>✅</span> Tasks
                <span className="text-sm font-normal text-muted-foreground">({completed} of {result.actions.length} done)</span>
              </h2>
              {result.actions.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
                  <p className="font-semibold">No tasks found in this chat.</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Either nobody was asked to do anything, or the wording was unusual. Try "Find tasks with AI",
                    or check the deadlines, meetings and reminders below.
                  </p>
                </div>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {result.actions.map((a) => (
                    <li key={a.id} className={`flex flex-col rounded-2xl border bg-card p-4 shadow-card ${done[a.id] ? "opacity-70" : ""}`}>
                      <label className="flex flex-1 cursor-pointer items-start gap-3">
                        <input type="checkbox" aria-label={`Mark "${a.task ?? a.text}" completed`} checked={!!done[a.id]} onChange={(e) => setDone({ ...done, [a.id]: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-[var(--success)]" />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={`block text-sm font-semibold ${done[a.id] ? "text-muted-foreground line-through" : ""}`}>{a.task ?? a.text}</span>
                          <span className="mt-2 flex flex-wrap gap-1.5 text-xs">
                            <Chip icon="👤" label="Who" value={a.assignee ?? "Not stated"} tone="primary" />
                            <Chip icon="📅" label="When" value={[a.date, a.day].filter(Boolean).join(" · ") || "No date"} tone="muted" />
                            <Chip icon="⏰" label="Time" value={a.time ?? "No time"} tone={a.time ? "destructive" : "muted"} />
                          </span>
                          <blockquote className="mt-auto border-l-2 pl-2 pt-2 text-xs text-muted-foreground">Source: {a.source.raw}</blockquote>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <Card title="Deadlines" icon="🗓️" tone="destructive">
              {result.deadlines.length === 0 ? <Empty what="deadlines" /> : (
                <ul className="space-y-2 text-sm">
                  {result.deadlines.map((d) => (
                    <li key={`dl-${d.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border bg-background px-3 py-2">
                      <span className="min-w-0 flex-1 truncate font-medium">{d.task ?? d.text}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{[d.day ?? d.date, d.time].filter(Boolean).join(" · ") || "No date"}</span>
                      {d.assignee && <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">👤 {d.assignee}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Assignments" icon="📚" tone="primary"><List items={result.assignments} /></Card>
              <Card title="Meetings" icon="🙋" tone="success"><List items={result.meetings} /></Card>
              <Card title="Reminders" icon="🔔" tone="primary"><List items={result.reminders} /></Card>
              <Card title="Announcements" icon="📢" tone="primary"><List items={result.announcements} /></Card>
              <Card title="Decisions" icon="🤝" tone="success"><List items={result.decisions} /></Card>
              <Card title="Urgent" icon="⚠️" tone="destructive"><List items={result.urgent} /></Card>
              <Card title="Mentions" icon="@" tone="primary"><List items={result.mentions} /></Card>
            </div>
          </>
        )}

        <section className="rounded-2xl border border-success/30 bg-success/5 p-5 text-sm">
          <h2 className="mb-2 font-bold">🔒 Privacy & how it works</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>"Analyze Messages" runs entirely on this device. "Find tasks with AI" is optional and sends the chat text to Lovable AI only after you confirm.</li>
            <li>Results are saved only in this browser so they survive a refresh. <button onClick={clear} className="font-semibold text-destructive underline">Delete my data</button></li>
            <li><b>Honest disclosure:</b> the default analysis uses local keyword rules, not an AI model, so it may miss items phrased unusually or flag casual messages. Always check the original message shown under each item.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function Chip({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: "primary" | "destructive" | "muted" }) {
  const tones = { primary: "bg-primary/10 text-primary", destructive: "bg-destructive/10 text-destructive", muted: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${tones[tone]}`}>
      <span aria-hidden>{icon}</span>
      <span className="opacity-70">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

const tones = { primary: "border-t-primary", success: "border-t-success", destructive: "border-t-destructive" };
function Card({ title, icon, tone, children }: { title: string; icon: string; tone: keyof typeof tones; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-t-4 bg-card p-5 shadow-card ${tones[tone]}`}>
      <h2 className="mb-3 flex items-center gap-2 font-bold"><span aria-hidden>{icon}</span>{title}</h2>
      {children}
    </section>
  );
}
const Empty = ({ what = "items" }: { what?: string }) => (
  <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
    No {what} found in this chat.
  </p>
);
function List({ items }: { items: Item[] }) {
  if (!items.length) return <Empty what="items" />;
  return <ul className="space-y-3">{items.map((i) => <li key={i.id}><ItemBody item={i} /></li>)}</ul>;
}
function ItemBody({ item }: { item: Item }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium">{item.task ?? item.text}</p>
      {(item.assignee || item.date || item.time) && (
        <div className="mt-1 flex flex-wrap gap-2 text-xs">
          {item.assignee && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">👤 {item.assignee}</span>}
          {(item.date || item.day) && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">📅 {[item.date, item.day].filter(Boolean).join(" · ")}</span>}
          {item.time && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">⏰ {item.time}</span>}
        </div>
      )}
      <blockquote className="mt-1 border-l-2 pl-2 text-xs text-muted-foreground">Source: {item.source.raw}</blockquote>
    </div>
  );
}
