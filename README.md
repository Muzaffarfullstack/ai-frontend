# PromptUsta frontend

Next.js frontend for the FastAPI service in `../ai-backend`. The application
supports email/phone authentication, courses, signed Mux playback, progress,
manual payments, AI prompt tools, leaderboard, profile and administration.

## Local development

```bash
copy .env.example .env.local
npm install
npm run dev
```

## Docker

Run the full stack from `../ai-backend`:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API docs: `http://localhost:8000/docs`

The old Cloudflare/Vinext starter files were moved out of this project to
`C:\Users\USER\Desktop\ai-frontend-legacy-cloudflare-backup`. They are not
referenced by the active Next.js application.
