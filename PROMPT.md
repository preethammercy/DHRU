# Master AI Prompt: MissedMate AI (Screen-to-Code Sidekick)

Build a production-ready, mobile-friendly full-stack web application called "MissedMate AI" using TanStack Start (React 19, TypeScript), Tailwind CSS v4, Supabase (Auth + PostgreSQL), Drizzle ORM, and Vite with PWA support.

### 1. Vision & Core Value Proposition
A private, on-device catch-up tool for busy college group chats (WhatsApp exports, Telegram, or raw "Name: message" lines). It extracts tasks, deadlines, meetings, reminders, decisions, and announcements. Local-first privacy is paramount: all default parsing is performed client-side using heuristic algorithms without network calls; AI analysis is strictly opt-in behind a user confirmation modal.

### 2. Architecture & File Structure
- Router & Server Functions: TanStack Start with file-based routing in `src/routes/`.
  - `src/routes/__root.tsx`: Root shell, Head meta tags, PWA worker registration, TanStack QueryClientProvider, global auth state listener.
  - `src/routes/auth.tsx`: Sign in and Sign up with Supabase Auth, email verification prompt, and "Forgot password" flow.
  - `src/routes/reset-password.tsx`: Password recovery callback handler with guarded input state.
  - `src/routes/_authenticated/route.tsx`: Protected route layout with client-side session gate and device PIN lock wrapper.
  - `src/routes/_authenticated/index.tsx`: Main dashboard interface for pasting chats, viewing statistics, and interacting with task cards.
- Core Business Logic & State:
  - `src/lib/analyzer.ts`: Zero-dependency, regex-based chat parser and classifier.
  - `src/lib/ai-actions.server.ts` & `src/lib/ai-actions.functions.ts`: TanStack Start server functions using `@ai-sdk/openai` and `ai` streaming to extract actions via Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1`).
  - `src/components/PinLock.tsx`: Client-side PIN lock using `crypto.subtle` SHA-256 hashing with `sessionStorage` session unlock state.
  - `src/integrations/supabase/`: Client and server Supabase SDK bindings, auth middleware, and types.
  - `drizzle/schema.ts` & migrations: Drizzle ORM profiles table schema with Postgres Row Level Security (RLS).

### 3. Parsing & Analysis Requirements (analyzer.ts)
- Support WhatsApp format exports (iOS: `[12/03/24, 09:15:22] Name: text`, Android: `12/03/24, 9:15 pm - Name: text`, Simple: `[09:02] Name: text`).
- Clean multiline messages and ignore system notices (e.g. "Messages are end-to-end encrypted", "<media omitted>").
- Extract:
  - Actions & Tasks: Shortened imperative task title (e.g., "Prepare the slides", "Submit DBMS assignment 3").
  - Assignee Detection: Resolve who owns the task via `@username`, direct name address, first-person self-assignment ("I'll...", "I will..."), or immediate follow-up acceptance replies ("Sure", "On it", "Will do", "👍").
  - Date & Time Calculation: Parse relative keywords ("tomorrow", "tonight", "next week", "Friday") into concrete calendar timestamps (`whenOf`).
  - Categories: Meetings, Reminders, Deadlines, Announcements, Decisions, Urgent messages, and Mentions.
- Provide sample chats for quick one-click testing (General college chat and WhatsApp export).

### 4. Opt-in AI Deep Extraction
- Server function `aiExtractActions` requiring authenticated user session.
- Chunking strategy: Support chats of any length by splitting messages into chunks of <= 250 lines and <= 45,000 characters.
- User confirmation prompt before sending text to AI.
- Process chunks in batches of 3 concurrently with live progress notes.
- Output schema: `Array<{ task: string, assignee: string | null, deadline: string | null, date: string | null, time: string | null, source: number }>`.
- Fall back gracefully to local analysis on network or rate limit errors.

### 5. Security & Device PIN Lock
- Supabase Auth: email + password with user display name.
- Database: `profiles` table linked to `auth.users(id)` with RLS policies allowing users to read, insert, and update only their own profile.
- Trigger `on_auth_user_created` creates profile entry automatically on signup.
- Device PIN Lock: Prompts user to set a 4–8 digit PIN upon first login on a device. Stores salted SHA-256 hash in `localStorage` (`missedmate:pin:<uid>`). Stores unlocked status in `sessionStorage` (`missedmate:pin-unlocked`) so closing the tab or browser locks the application.

### 6. UI & Styling
- Tailwind CSS v4 styling with `@theme inline` oklch palette:
  - Brand blue primary (`#0033d6` / oklch), card elevation shadows, muted secondary elements, success emerald accents, and destructive alert badges.
  - Typography: Plus Jakarta Sans.
  - Interactive Task cards: Checkboxes with strikethrough completion, assignee chip (`👤`), date chip (`📅`), time badge (`⏰`), and original message quote.
  - Category grids: Deadlines, Assignments, Meetings, Reminders, Announcements, Decisions, Urgent, Mentions.
  - Responsive design: optimized for both mobile phone browsers and desktop viewports.

*For complete project architecture, schema, and extension guides, see [PROJECT_PROMPT.md](PROJECT_PROMPT.md).*
