# Deployment

This source copy retains the repository's Vercel configuration and build scripts.

## Vercel

1. Import the project repository into Vercel.
2. Keep the framework preset as Other (the checked-in `vercel.json` sets `npm run build`, `dist`, API rewrites and SPA rewrites).
3. Set only the environment variables needed for the deployed backend, using values from your own secure environment. Do not commit `.env` files.
4. Deploy the selected branch. Review the Vercel build log and test `/`, a page route, and API endpoints used by the app.

## Local production build

```sh
npm ci
npm run build
npm start
```

The existing `npm start` server listens on port 5000. No deployment scripts, API routes, or backend code were changed in this presentation pass.

## Verification boundary

The production build and existing Node tests pass. The API parity snapshot set, Playwright feature suite, screenshot matrix, Lighthouse and axe runs requested by the design prompts are not included; see `PARITY_REPORT.md` and `KNOWN_ISSUES.md` before treating visual acceptance as complete.
