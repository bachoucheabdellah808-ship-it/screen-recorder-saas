# Screen Recorder — Local & Private

A browser-based screen recorder that runs entirely in your browser. No uploads, no accounts, no tracking. Download your recording as WebM.

Built with React 19 + TypeScript + Vite. Zero external UI dependencies.

## What it does

- Record your screen, a window, or a browser tab using the native MediaRecorder API
- Pause and resume mid-recording
- Preview playback after stopping
- Download the recording as a WebM file
- Everything stays on your device — nothing is uploaded

## Phase 2 (in progress)

- Supabase Storage for cloud save (so recordings survive across devices)
- Supabase Auth for per-user private storage
- Dashboard listing your cloud recordings

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

## Build

```bash
npm run build
```

Produces `dist/` with an optimized static bundle (HTML + JS + CSS).

## Tech

- React 19 + TypeScript + Vite
- Native MediaRecorder API (screen/window/tab capture via `getDisplayMedia`)
- `@supabase/supabase-js` (Phase 2)
- CSS custom properties for theming — no Tailwind, no CSS framework
- Content-Security-Policy meta tag for security

## Security

- CSP: `default-src 'self'`, `frame-ancestors 'none'`, no external script/style sources
- No cookies, no tracking, no analytics
- Media stream tracks are released on unmount
- Recording blobs are created in-memory and downloaded — nothing persists unless you save it

## Author

Built by Abdo — [electromenager.best](https://electromenager.best)
