# Connect DHRU.AI to Gemini

Ask DHRU sends chat requests to Google's Gemini API from the Node/Express backend. The API key stays on the server and is not included in Vite's browser bundle.

## Local development

1. In the project root (the folder containing `package.json`), copy `.env.example` to `.env`.
2. Replace the placeholder with your key:

   ```env
   GEMINI_API_KEY=your_actual_Gemini_API_key
   ```

3. Save `.env`, then restart the app with `npm run dev` (or restart both backend and Vite separately).
4. Open **Settings → Intelligence Engine**. It should show `Gemini API · gemini-3.8-flash`.

Never put the key in a `VITE_*` variable, React source, HTML, or a checked-in file. `.env` is ignored by Git.

## Vercel deployment

In the Vercel project, open **Settings → Environment Variables**, add `GEMINI_API_KEY` with the key value for the environments you deploy, then redeploy. The setting in local `.env` does not configure the hosted app.

## Chat behavior

The assistant uses Gemini for the user's question and recent conversation context. If the key is missing, rejected, or Gemini is unavailable, the app displays the configuration/provider error instead of returning a canned response. Replies can address general questions; market-specific answers use the selected instrument context when available and must not invent live prices.

The backend currently tries `gemini-3.8-flash` and then `gemini-3.5-flash-lite`. API access, quotas, and billing depend on the Google AI project that issued the key.
