# Project Prompt: MissedMate AI (Screen-to-Code Sidekick)

> **Project Name:** MissedMate AI (`screen-to-code-sidekick`)  
> **Tagline:** Catch up on what matters — private, on-device group chat action extractor  
> **Primary Stack:** TanStack Start (Full-stack React 19) + Vite 8 + Tailwind CSS v4 + Supabase Auth / PostgreSQL + Drizzle ORM + Vercel AI SDK (Lovable AI Gateway) + PWA  

---

## 1. Executive Summary & Problem Statement

College students, project teams, and study groups frequently exchange hundreds of messages every day on chat platforms like WhatsApp, Telegram, and Discord. Crucial deadlines, assignments, meeting times, and task assignments get buried beneath casual conversation, memes, and banter.

**MissedMate AI** is a privacy-first, on-device chat intelligence sidekick designed to parse group chat conversations of any length and extract:
- **Actionable Tasks & Assignments** (with automatically identified task names and assignees)
- **Deadlines & Schedules** (with relative day/time calculations)
- **Meetings & Standups** (location, agenda, date, and time)
- **Important Announcements & Notices**
- **Group Decisions & Agreed Topics**
- **Urgent Items & Emergency Alerts**
- **Direct @Mentions**

### Core Architectural Differentiator: Local-First Privacy
1. **100% On-Device by Default:** Standard analysis runs entirely within the user's browser using intelligent regex and heuristic NLP rules (`src/lib/analyzer.ts`). No chat text is sent to any server or LLM backend.
2. **Opt-in AI Deep Extraction:** Users can selectively trigger deep task extraction powered by LLMs (Lovable AI Gateway / GPT-6 / OpenAI). Before sending data, users are presented with an explicit confirmation dialog informing them of the transmission and chunk batching.
3. **Multi-layer Device Security:** In addition to cloud email/password authentication, a local 4–8 digit PIN lock (`PinLock.tsx`) protects sensitive chats on shared physical devices via salted SHA-256 client-side hashing.

---

## 2. Master AI Prompt (Ready to Copy & Paste into LLM Builders)

*Use the master prompt below in Lovable, Cursor, v0, Bolt, Claude, or ChatGPT to reproduce or extend this application:*

```markdown
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
```

---

## 3. System Architecture & Tech Stack

```
+-----------------------------------------------------------------------------------+
|                                 BROWSER CLIENT                                    |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  |  TanStack Router   |   |   Local Storage       |   |    Device PIN Lock     |  |
|  |  (File Routes)     |   |   (missedmate:v1)     |   |  (Web Crypto SHA-256)  |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
|            |                          |                           |               |
|  +---------v--------------------------v---------------------------v------------+  |
|  |                         LOCAL HEURISTIC ENGINE                              |  |
|  |                         (src/lib/analyzer.ts)                               |  |
|  |  - WhatsApp / Telegram / Custom Chat Log Parser                             |  |
|  |  - Regex Heuristics: Tasks, Assignees, Dates, Deadlines, Meetings, Urgent   |  |
|  |  - 100% On-Device / Zero Network Transmission by Default                    |  |
|  +------------------------------------+----------------------------------------+  |
+---------------------------------------|-------------------------------------------+
                                        | (Opt-in user confirmation only)
                                        v
+-----------------------------------------------------------------------------------+
|                           TANSTACK START SERVER                                   |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |  Server Function: aiExtractActions (src/lib/ai-actions.functions.ts)        |  |
|  |  - Middleware: requireSupabaseAuth                                          |  |
|  |  - Chunking & Batching: <= 250 lines / 45k chars per payload                |  |
|  +------------------------------------+----------------------------------------+  |
|                                       |                                           |
|  +------------------------------------v----------------------------------------+  |
|  |  Lovable AI Gateway / Vercel AI SDK (@ai-sdk/openai)                        |  |
|  |  Endpoint: https://ai.gateway.lovable.dev/v1                                |  |
|  |  Model: openai/gpt-6-astra (structured JSON action extraction)              |  |
|  +-----------------------------------------------------------------------------+  |
+---------------------------------------+-------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                        SUPABASE POSTGRESQL & AUTH                                 |
|  - Auth: email / password + password reset callbacks                              |
|  - Database: `profiles` table (UUID pk references auth.users)                     |
|  - Row Level Security (RLS) policies                                              |
|  - Database trigger: on_auth_user_created -> handle_new_user()                     |
+-----------------------------------------------------------------------------------+
```

### Detailed Tech Stack Matrix

| Layer | Technology | Details & Purpose |
| :--- | :--- | :--- |
| **Framework** | TanStack Start (`1.168.x`) | Full-stack React 19 framework with type-safe server functions and file routing |
| **Routing** | TanStack React Router (`1.170.x`) | File-based routing with root layouts, route guards, and SSR control |
| **Bundler** | Vite 8 + `@lovable.dev/vite-tanstack-config` | Lightning-fast HMR and Nitro server compilation |
| **Styling** | Tailwind CSS v4 + `@tailwindcss/vite` | Next-gen CSS engine with OKLCH design tokens and `tw-animate-css` |
| **UI Primitives** | Radix UI + Lucide React | Accessible headless components and iconography |
| **Local NLP Engine** | Pure TypeScript (`analyzer.ts`) | Zero-dependency heuristic parser for on-device processing |
| **AI Integration** | Vercel AI SDK (`ai` v7 + `@ai-sdk/openai`) | Streaming and structured responses via Lovable AI Gateway |
| **Database & ORM** | PostgreSQL + Drizzle ORM | Relational schema definitions and migrations |
| **Authentication** | Supabase Auth (`@supabase/supabase-js`) | Session management, sign-up, sign-in, password reset |
| **Device Security** | Web Crypto API (`crypto.subtle`) | Client-side salted SHA-256 PIN hashing |
| **Offline / PWA** | `vite-plugin-pwa` + Workbox | NetworkFirst page caching, CacheFirst asset caching, web manifest |
| **Unit Testing** | Vitest 4 + Testing Library + jsdom | Route matching and unit validation |

---

## 4. Key Functional Features & Logic Deep Dive

### 4.1 On-Device Regex Analysis (`src/lib/analyzer.ts`)
The parser processes unstructured chat text without sending data to external APIs:
1. **Timestamp & Sender Identification:**
   - Detects standard WhatsApp date/time stamps: `[DD/MM/YY, HH:MM:SS] Sender: Message` and `DD/MM/YY, HH:MM am/pm - Sender: Message`.
   - Filters out system messages (`end-to-end encrypted`, `<media omitted>`, group join/leave events).
   - Handles multi-line messages by attaching continuations to the previous message record.
2. **Entity & Intent Recognition:**
   - **Meetings:** Detects keywords (`meeting`, `workshop`, `session`, `call`, `demo`) combined with temporal terms (`today`, `tomorrow`, `4 pm`).
   - **Assignments:** Identifies academic and project deliverables (`assignment`, `project`, `proposal`, `report`, `slides`, `viva`, `lab record`).
   - **Deadlines:** Evaluates patterns like `due Friday by 11:59 pm`, `before tomorrow 10 am`, or `by Monday`.
   - **Decisions:** Recognizes consensus phrases (`we decided`, `we're going with`, `agreed`, `finalized`).
   - **Urgent Notices:** Flags urgency markers (`urgent`, `asap`, `immediately`, `no extension`).
3. **Smart Task Naming & Assignee Resolution:**
   - Trims filler phrases: `"can you please prepare the slides"` $\rightarrow$ `"Prepare the slides"`.
   - Resolves assignee via:
     - `@mention` in message body.
     - Addressed team member name.
     - Self-assignment ("I'll do...", "I will share...").
     - Follow-up message acceptance ("Sure", "On it", "Done", "👍").

### 4.2 Opt-in AI Deep Task Extractor (`src/lib/ai-actions.server.ts`)
- **User Confirmation:** A browser dialog alerts the user before any chat text is transmitted.
- **Large Chat Chunking:** Splits oversized chats into sub-batches of 250 lines or 45,000 characters.
- **Concurrent Execution:** Dispatches chunks in groups of 3 to the AI Gateway to minimize latency.
- **Prompt Guardrails:** Instructs the LLM to return strictly JSON formatted action items with imperative titles under 12 words, context-resolved assignees, and stated deadlines.
- **Deduplication & Local Merging:** Merges AI-derived task cards with local message anchors to preserve source message traceability.

### 4.3 Device PIN Security (`src/components/PinLock.tsx`)
- College students frequently share laptops or phones with peers. MissedMate implements device-level PIN protection:
  - **Setup:** User configures a 4 to 8 digit numeric PIN upon initial use.
  - **Zero Server Exposure:** The PIN is combined with the user ID and hashed using `SHA-256` via `window.crypto.subtle`. Only the digest is saved in `localStorage`.
  - **Automatic Re-Lock:** The unlocked session flag resides in `sessionStorage`. When the tab or browser is closed, the lock engages automatically.

### 4.4 Data Persistence & Quota Resilience
- Processed tasks, analysis state, and checklist statuses are stored under `missedmate:v1` in `localStorage`.
- If an analyzed chat exceeds the browser's storage quota (~5MB), the app captures the error and displays a non-blocking notification: *"This chat is too large for your browser to remember — it stays on screen but won't come back after a refresh."*

---

## 5. Database Schema & Row Level Security

The application utilizes PostgreSQL managed via Drizzle ORM migrations (`drizzle/migrations/0000_create_profiles.sql`):

```sql
-- Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Automatic Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 6. Project Directory Map

```
screen-to-code-sidekick/
├── drizzle/
│   ├── migrations/
│   │   └── 0000_create_profiles.sql     # Database migration for user profiles & RLS
│   └── schema.ts                        # Drizzle schema definitions
├── public/
│   ├── favicon.png                      # App favicon
│   ├── manifest.webmanifest             # PWA web app manifest
│   └── robots.txt                       # Search engine directives
├── src/
│   ├── components/
│   │   ├── ui/                          # Radix-based UI components (buttons, cards, dialogs, etc.)
│   │   └── PinLock.tsx                  # Salted SHA-256 client PIN security screen
│   ├── integrations/
│   │   └── supabase/
│   │       ├── auth-middleware.ts       # Server-function auth verification
│   │       ├── client.ts                # Browser Supabase client instance
│   │       ├── client.server.ts         # Nitro server-side Supabase client
│   │       └── types.ts                 # Database TypeScript definitions
│   ├── lib/
│   │   ├── ai-actions.functions.ts      # TanStack Start server function definition
│   │   ├── ai-actions.server.ts         # Vercel AI SDK integration with Lovable Gateway
│   │   ├── analyzer.ts                  # Local regex heuristic parser and NLP engine
│   │   ├── register-sw.ts               # Safe service worker registration utility
│   │   └── utils.ts                     # Tailwind class merging utility (cn)
│   ├── routes/
│   │   ├── __root.tsx                   # HTML shell, PWA metadata, TanStack Query provider
│   │   ├── auth.tsx                     # Sign in / Sign up page with password reset request
│   │   ├── reset-password.tsx           # Password recovery page (guarded by hash session)
│   │   └── _authenticated/
│   │       ├── route.tsx                # Authenticated layout, user context & PinLock wrapper
│   │       └── index.tsx                # Main application dashboard & chat analyzer UI
│   ├── test/
│   │   ├── app-routing.test.tsx         # Route matching unit tests
│   │   └── setup.ts                     # Vitest testing environment setup
│   ├── styles.css                       # Tailwind CSS v4 design tokens & theme configuration
│   └── routeTree.gen.ts                 # Auto-generated TanStack router tree
├── .env                                 # Supabase project URL and publishable keys
├── components.json                      # Shadcn component configuration
├── package.json                         # Project dependencies and npm scripts
├── tsconfig.json                        # TypeScript compiler options & path aliases
├── vite.config.ts                       # Vite 8 & VitePWA configuration
└── vitest.config.ts                     # Unit test configuration
```

---

## 7. Environment Variables Configuration

Create a `.env` file in the root directory:

```bash
# Supabase Configuration
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PUBLISHABLE_KEY="your-anon-or-publishable-key"
SUPABASE_URL="https://your-project-ref.supabase.co"

# Vite Client Exposed Variables
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-or-publishable-key"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"

# AI Gateway Key (Server-side only for opt-in AI extraction)
LOVABLE_API_KEY="your-lovable-or-openai-api-key"
```

---

## 8. Local Setup & Development Commands

### Prerequisites
- Node.js 20+ or 22+
- npm or bun

### Commands

```sh
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Execute unit tests
npm run test

# 4. Check linting rules
npm run lint

# 5. Format code with Prettier
npm run format

# 6. Build production bundle
npm run build

# 7. Preview production build locally
npm run preview
```

---

## 9. Feature Extension & Evolution Prompts

To continue developing MissedMate AI, paste any of the following extension prompts into your AI coding assistant:

### Extension Prompt A: One-Click Calendar & Task App Export
```markdown
Extend MissedMate AI with one-click export actions on task and meeting cards:
1. "Add to Google Calendar" button: Generate a direct Google Calendar template URL (`https://calendar.google.com/calendar/render?action=TEMPLATE&text=...`) using the parsed date, time, and task title.
2. "Download .ics file": Generate an iCalendar (.ics) string for Apple Calendar and Outlook.
3. "Copy as Markdown / Todoist": Provide a button to copy selected tasks formatted as `- [ ] [Date] Task title (Assignee)`.
```

### Extension Prompt B: Direct WhatsApp `.txt` File Upload & Drag-and-Drop
```markdown
Add a drag-and-drop file upload zone to MissedMate AI:
1. Accept `.txt` chat export files generated by WhatsApp ("Export Chat without media").
2. Read the file client-side via the FileReader API without uploading it to any server.
3. Automatically strip BOM markers and RTL directional Unicode characters.
4. Populate the chat textarea and trigger instant local analysis.
```

### Extension Prompt C: Multi-Language & Regional Date Support
```markdown
Enhance `src/lib/analyzer.ts` with multi-language and regional date recognition:
1. Support international date formats: DD/MM/YYYY, MM/DD/YYYY, and YYYY-MM-DD.
2. Add support for Indian standard timestamps (e.g., "12/03/24, 2:30 pm").
3. Recognize Hindi/Hinglish chat task phrases (e.g., "kal submit karna hai", "aaj meeting hai", "slides bana do").
```

---

## 10. Verification & Quality Checklist

- [x] **Local-First Verification:** Running "Analyze Messages" triggers zero network calls in the browser DevTools Network tab.
- [x] **AI Privacy Guard:** Clicking "Find tasks with AI" opens an explicit confirmation prompt displaying chunk counts.
- [x] **Large File Support:** Chats exceeding 50,000 characters process seamlessly through client-side chunking.
- [x] **PIN Security:** Application locks upon browser restart, requiring the local SHA-256 PIN.
- [x] **PWA Compatibility:** Manifest and service workers cache assets for responsive offline performance.
- [x] **Type Safety:** 100% TypeScript compliance across routes, server functions, and database client schemas.
