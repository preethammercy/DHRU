// Local, rule-based text analysis. No network calls. Not an AI model.
export type Msg = { id: number; time?: string | undefined; sender: string; text: string; raw: string };
export type Item = {
  id: string;
  text: string;
  source: Msg;
  task?: string | undefined;
  assignee?: string | undefined;
  date?: string | undefined;
  time?: string | undefined;
  day?: string | undefined;
  at?: number | undefined;
  deadline?: string | undefined;
};
export type Analysis = {
  messages: Msg[];
  participants: string[];
  summary: string[];
  actions: Item[];
  assignments: Item[];
  meetings: Item[];
  reminders: Item[];
  deadlines: Item[];
  announcements: Item[];
  decisions: Item[];
  urgent: Item[];
  mentions: Item[];
};

// WhatsApp Android: "12/03/24, 9:15 pm - Name: msg"; iOS: "[12/03/24, 09:15:22] Name: msg"; simple: "[09:02] Name: msg"
const DATE = String.raw`\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4}`;
const TIME = String.raw`\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s*[ap]\.?\s?m\.?)?`;
const STAMP = String.raw`\[?\s*((?:${DATE},?\s*)?${TIME})\s*\]?\s*[-–]?\s*`;
const LINE = new RegExp(String.raw`^(?:${STAMP})?([^:\[\]\n]{1,40}?)\s*:\s+([\s\S]*)$`, "i");
const STAMPED = new RegExp(String.raw`^${STAMP}`, "i");
const SYSTEM = /(end-to-end encrypted|<media omitted>|created group|added|left|changed (the )?(subject|group|this group)|joined using)/i;

export function parseChat(input: string): Msg[] {
  const out: Msg[] = [];
  input.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.replace(/[\u200e\u200f\u202a-\u202e\ufeff]/g, "").trimEnd();
    if (!line.trim()) return;
    const m = line.match(LINE);
    const sender = m?.[2]?.trim() ?? "";
    // Sender must look like a name (no long sentences) — otherwise it's a continuation line.
    if (m && sender.split(/\s+/).length <= 4 && /[\p{L}+\d]/u.test(sender)) {
      out.push({ id: out.length, time: m[1]?.trim() || undefined, sender, text: (m[3] ?? "").trim(), raw: line.trim() });
    } else if (STAMPED.test(line) && SYSTEM.test(line)) {
      return; // WhatsApp system notice
    } else if (out.length) {
      const last = out[out.length - 1]!;
      last.text += "\n" + line.trim();
      last.raw += "\n" + line.trim();
    }
  });
  return out.filter((m) => m.text && !/^<media omitted>$/i.test(m.text));
}

export const MEETING = /\b(meeting|meetup|session|lecture|class|call|seminar|workshop|standup|stand-up|event|review|demo|presentation)\b/i;
const WHEN = /\b((mon|tues|wednes|thurs|fri|satur|sun)day|tomorrow|today|tonight|\d{1,2}([:.]\d{2})?\s*(am|pm)|at \d{1,2})\b/i;
export const isMeetingAnnouncement = (t: string) => MEETING.test(t) && WHEN.test(t) && !/@\w+/.test(t) && !/\b(can you|could you|you need to)\b/i.test(t);

const DAY_WORDS = /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i;
const REL = /\b(tomorrow|tonight|today|next week|end of (the )?(day|week))\b/i;
const MONTHS = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})\b|\b(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})\b/i;
const TIME_WORDS = /\b(\d{1,2}(?:[:.]\d{2})?\s*[ap]\.?\s?m\.?)\b/i;
const CLOCK = /\b(\d{1,2}[:.]\d{2})\b/;
const PERIOD = /\b(morning|afternoon|evening|night)\b/i;
const MONTH_IDX: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const DAY_IDX: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export type When = { date?: string | undefined; time?: string | undefined; day?: string | undefined; at?: number | undefined };

// Finds the date and time a message talks about, as stated, plus the resolved calendar day.
export function whenOf(text: string, now = new Date()): When {
  let date: string | undefined;
  let at: number | undefined;
  const d = text.match(DAY_WORDS);
  const r = text.match(REL);
  const n = text.match(MONTHS);
  if (d) {
    date = d[0];
    const want = DAY_IDX[d[0].toLowerCase()]!;
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + (want - base.getDay() + 7) % 7);
    at = base.getTime();
  } else if (r) {
    date = r[0];
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    if (/tomorrow/i.test(r[0])) base.setDate(base.getDate() + 1);
    if (/next week/i.test(r[0])) base.setDate(base.getDate() + 7);
    at = base.getTime();
  } else if (n) {
    date = n[0];
    const y = now.getFullYear();
    if (n[1] && n[2]) {
      const m = MONTH_IDX[n[2].toLowerCase()]!;
      const day = Number(n[1]);
      at = new Date(y, m, day).getTime();
      if (at < now.getTime() - 86400000) at = new Date(y + 1, m, day).getTime();
    } else if (n[3] && n[4]) {
      const m = MONTH_IDX[n[3].toLowerCase()]!;
      const day = Number(n[4]);
      at = new Date(y, m, day).getTime();
      if (at < now.getTime() - 86400000) at = new Date(y + 1, m, day).getTime();
    } else if (n[5]) {
      const [a, b, c] = n[5].split(/[\/.\-]/).map(Number);
      at = new Date(c! < 100 ? 2000 + c! : c!, (b! || 1) - 1, a! || 1).getTime();
    }
  }
  const time = text.match(TIME_WORDS)?.[1]?.replace(/\s+/g, " ") ?? text.match(CLOCK)?.[1] ?? text.match(PERIOD)?.[1];
  const day = at
    ? new Date(at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : undefined;
  return { date, time, day, at };
}

const RX = {
  announce: /\b(announce|announcement|notice|fyi|heads up|update|important|attention|everyone|all of you|@all|@everyone|class (is )?(cancelled|moved)|rescheduled)\b/i,
  decision: /\b(decided|we('| a)?re going with|let'?s go with|final(ized|ly)?|agreed|we will|we'll use|confirmed|settled|chose|vote(d)? for)\b/i,
  action: /\b(please|pls|can you|could you|need to|needs to|have to|must|should|will do|i'?ll|assign(ed)?|responsible|take care of|submit|prepare|complete|send|upload|bring|make sure|todo|to-do)\b/i,
  urgent: /\b(urgent|asap|immediately|right now|today|tonight|emergency|critical|last chance|hurry|no extensions?)\b/i,
  assign: /\b(assignment|project|proposal|abstract|report|submission|submit|slides|notes|documentation|lab record|journal|viva|quiz|presentation)\b/i,
  remind: /\b(reminder|remind|don'?t forget|remember to|note that|make sure|please note|kindly note)\b/i,
  deadline: /\b(by|before|due|deadline|until)\s+((mon|tues|wednes|thurs|fri|satur|sun)day|tomorrow|tonight|today|next \w+|\d{1,2}(st|nd|rd|th)?(\s+\w+)?|\w+ \d{1,2}(st|nd|rd|th)?|\d{1,2}[:.]\d{2}\s*(am|pm)?|\d{1,2}\s*(am|pm)|end of (the )?(day|week))/i,
  dueWord: /\b(due|deadline|submit|submitted|upload|uploaded|hand ?in|attach)\b/i,
};

const SUBJECT = /\b((?:[\w.]+\s+){0,4}(?:assignment|project|proposal|abstract|report|slides|notes|documentation|lab ?record|journal|viva|quiz|presentation|model|poster))\s*(\d+)?\b/i;
const FILLER = /^(the|a|an|our|my|your|his|her|their|to|of|for|and|but|or|is|are|was|were|be|been|being|must|should|will|shall|can|could|would|need|needs|want|wants|asked|said|says|told|that|this|it|its|in|on|at|by|with|about|from|up|me|you|him|them|we|they|he|she|i|ll|please|kindly|make|do|done|send|submit|upload|prepare|complete|bring|share)$/i;

// Keep only the words that name the thing: drop everything up to the last filler word.
const cleanSubject = (s: string) => {
  const words = s.trim().replace(/\s+/g, " ").split(" ");
  let start = 0;
  words.forEach((w, i) => { if (FILLER.test(w.replace(/[.,;:!?]/g, ""))) start = i + 1; });
  return words.slice(start).join(" ");
};

const shorten = (s: string, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// Turns a chat message into a short task name: "can you prepare the slides" -> "Prepare the slides"
const taskName = (t: string) => {
  let s = t
    .replace(/^(hey|hi|hello|ok|okay|so|also|and|but|right|sure|urgent)[,!\s]+/i, "")
    .replace(/@+/g, " ")
    .replace(/\b(can|could)\s+you\s+(please\s+)?/i, " ")
    .replace(/\b(please|pls|kindly)\s+/i, " ")
    .replace(/\b(i'?ll|i will|we'?ll|we will)\s+/i, " ")
    .replace(/\b(you|he|she)\s+(need to|has to|have to)\s+/i, " ")
    .replace(/\s+/g, " ")
    .replace(/^(to|the|a|an)\s+/i, "")
    .replace(/^[^\p{L}\d]+/u, "")
    .replace(/[.,;:!?]+$/, "")
    .trim();
  if (s) s = s[0]!.toUpperCase() + s.slice(1);
  return shorten(s, 90);
};

// For "assignment 3 is due Friday" notices, name the task after the thing to hand in.
const nameTask = (t: string, who?: string) => {
  if (RX.dueWord.test(t)) {
    const s = t.match(SUBJECT);
    const what = s?.[1] ? cleanSubject(s[1]) : "";
    if (what) return shorten(`Submit the ${what}${s?.[2] ? " " + s[2] : ""}`, 90);
  }
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = who ? t.replace(new RegExp(`\\b${esc(who.split(" ")[0] ?? who)}\\b`, "i"), " ") : t;
  return taskName(body);
};

const ACCEPT = /^(sure|ok|okay|yes|yep|yeah|done|done it|on it|will do|will share|i'?ll (do|handle|take)|got it|sure thing|no problem|np|👍|✅)\b/i;

export function analyze(input: string): Analysis {
  const messages = parseChat(input);
  const now = new Date();
  const participants = [...new Set(messages.map((m) => m.sender))];
  const names = participants.map((p) => (p.split(" ")[0] ?? p).toLowerCase());
  const first = (p: string) => (p.split(" ")[0] ?? p).toLowerCase();
  const item = (m: Msg, k: string, extra: Partial<Item> = {}): Item => ({ id: `${k}-${m.id}`, text: m.text, source: m, ...extra });

  // Who owns a piece of text: @mention, a named person, "I'll" = the sender, or a "sure / on it" reply.
  const ownerOf = (text: string, m: Msg, nxt?: Msg): string | undefined => {
    const at = text.match(/@(\w+)/);
    const named = names.find((n) => n !== first(m.sender) && new RegExp(`\\b${n}\\b`, "i").test(text));
    const self = /\b(i'?ll|i will)\b/i.test(text) ? m.sender : undefined;
    const picks: { who: string; pos: number }[] = [];
    if (at) picks.push({ who: at[1]!, pos: text.toLowerCase().indexOf("@" + at[1]!.toLowerCase()) });
    if (named) picks.push({ who: participants[names.indexOf(named)]!, pos: text.search(new RegExp(`\\b${named}\\b`, "i")) });
    if (self) picks.push({ who: self, pos: text.search(/\b(i'?ll|i will)\b/i) });
    if (picks.length) return picks.sort((a, b) => a.pos - b.pos)[0]!.who;
    if (nxt && nxt.sender !== m.sender && ACCEPT.test(nxt.text.trim())) return nxt.sender;
    return undefined;
  };

  const actions: Item[] = [], assignments: Item[] = [], meetings: Item[] = [], reminders: Item[] = [],
    announcements: Item[] = [], decisions: Item[] = [], urgent: Item[] = [], mentions: Item[] = [];

  messages.forEach((m, i) => {
    const t = m.text;
    const w0 = whenOf(t, now);
    const dl = t.match(RX.deadline)?.[0];
    const meeting = isMeetingAnnouncement(t);
    const isRemind = RX.remind.test(t);

    if (meeting) meetings.push(item(m, "mt", { date: w0.date, time: w0.time, day: w0.day, at: w0.at }));
    else if (RX.announce.test(t) || isRemind) announcements.push(item(m, "a", { date: w0.date, time: w0.time, day: w0.day, at: w0.at }));
    if (isRemind) reminders.push(item(m, "r", { date: w0.date, time: w0.time, day: w0.day, at: w0.at, deadline: dl }));
    if (RX.decision.test(t)) decisions.push(item(m, "d"));
    if (RX.urgent.test(t)) urgent.push(item(m, "u", { date: w0.date, time: w0.time, day: w0.day, at: w0.at, deadline: dl }));
    if (/@\w+/.test(t)) mentions.push(item(m, "m"));
    if (meeting) return;

    // One message can hold two tasks: "I'll submit it. Rahul please send the abstract."
    const parts = t.split(/(?<=[.!?])\s+|\n+/).map((p) => p.trim()).filter(Boolean);
    const useParts = parts.length > 1;
    (useParts ? parts : [t]).forEach((part, pi) => {
      const dl2 = part.match(RX.deadline)?.[0] ?? (useParts ? undefined : dl);
      if (!(RX.action.test(part) || (!!dl2 && RX.dueWord.test(part)))) return;
      const w = useParts ? whenOf(part, now) : w0;
      const who = ownerOf(part, m, messages[i + 1]);
      const extra = { task: nameTask(part, who), assignee: who, date: w.date, time: w.time, day: w.day, at: w.at, deadline: dl2 };
      actions.push(item(m, `t${pi}`, extra));
      if (RX.assign.test(part)) assignments.push(item(m, `as${pi}`, extra));
    });
  });

  // Everything with a date or time, soonest first, one line per message.
  const once = new Set<number>();
  const deadlines = [...actions, ...meetings, ...reminders]
    .filter((a) => (a.date || a.time) && !once.has(a.source.id) && (once.add(a.source.id), true))
    .sort((a, b) => (a.at ?? Number.POSITIVE_INFINITY) - (b.at ?? Number.POSITIVE_INFINITY));

  const summary: string[] = [];
  if (messages.length) {
    summary.push(`${messages.length} messages from ${participants.length} participant${participants.length === 1 ? "" : "s"} (${participants.slice(0, 5).join(", ")}${participants.length > 5 ? "…" : ""}).`);
    [...decisions.slice(0, 1), ...meetings.slice(0, 1), ...announcements.slice(0, 1)]
      .forEach((i) => summary.push(`${i.source.sender}: ${shorten(i.text)}`));
    summary.push(`${actions.length} task${actions.length === 1 ? "" : "s"}, ${assignments.length} assignment${assignments.length === 1 ? "" : "s"}, ${meetings.length} meeting${meetings.length === 1 ? "" : "s"}, ${reminders.length} reminder${reminders.length === 1 ? "" : "s"}, ${urgent.length} urgent message${urgent.length === 1 ? "" : "s"}.`);
  }
  return { messages, participants, summary, actions, assignments, meetings, reminders, deadlines, announcements, decisions, urgent, mentions };
}

export const SAMPLE_CHAT = `[09:02] Priya: Good morning everyone! Quick reminder: the DBMS assignment 3 is due Friday by 11:59 pm on the portal.
[09:05] Rahul: Thanks Priya, totally forgot about that 😅
[09:07] Ananya: lol same. Anyone watched the match last night?
[09:08] Rahul: Yes!! What a finish
[09:15] Karan: Announcement: our mini-project meeting is on Thursday at 4 pm in Lab 2. Everyone please attend.
[09:18] Ananya: Can we do it online instead?
[09:20] Karan: Let's keep it in Lab 2, we need the lab PCs for the demo.
[09:31] Priya: For the project topic, we voted and decided to go with the Smart Attendance System.
[09:32] Rahul: Agreed, final choice 👍
[09:40] Karan: @Ananya can you prepare the presentation slides by Wednesday evening?
[09:42] Ananya: Sure, I'll do the slides.
[09:45] Rahul: I'll set up the GitHub repo today.
[09:50] Priya: Urgent: Prof. Mehta said the project proposal must be submitted by tomorrow 10 am, no extensions!!
[09:52] Karan: Ok I'll submit the proposal tonight. Rahul please send me the abstract asap.
[10:01] Ananya: Also does anyone have notes from Monday?
[10:03] Rahul: Will share later
[10:10] Priya: FYI the canteen is closed today.`;

// A WhatsApp-style export: dated stamps, a multi-line message and a system notice.
export const SAMPLE_WHATSAPP = `12/03/25, 9:15 am - Meera: Good morning! Reminder: the Data Science assignment 2 is due on 18/03/25 by 11:59 pm.
12/03/25, 9:16 am - Meera: Submit it on the portal, not by email.
12/03/25, 9:20 am - Arjun: Noted, thanks
12/03/25, 9:32 am - Meera: You have deleted the message "hello"
12/03/25, 9:45 am - Farhan: Mini project review meeting on Saturday at 2 pm in Seminar Hall 1.
Everyone must attend with their working model.
12/03/25, 9:50 am - Divya: @Arjun can you arrange the projector for Saturday?
12/03/25, 9:52 am - Arjun: Sure, on it.
12/03/25, 10:05 am - Farhan: We decided to use Python for the model, not R. Final.
12/03/25, 10:12 am - Meera: Urgent: the report must be uploaded tomorrow 10 am, no extensions.
12/03/25, 10:20 am - Divya: I'll make the slides tonight.
12/03/25, 10:31 am - Arjun: <media omitted>
12/03/25, 10:40 am - Farhan: Reminder: bring your ID cards on exam day.`;
