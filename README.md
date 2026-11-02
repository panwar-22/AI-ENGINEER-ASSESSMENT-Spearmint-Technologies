# AI Product Recommendation System

A full-stack product recommender. Describe what you are looking for in plain
language, and the app uses Google Gemini to find matching products from its
catalog and explain its recommendations.

## Features

- Natural-language product search.
- Gemini-generated recommendations with explanations.
- A React catalog view and recommendation results.
- Express API with Zod validation for requests and AI responses.
- Server-side API key handling; the Gemini key is not exposed to the browser.
- Unknown product IDs in AI responses are discarded before results are returned.

## Tech stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **AI:** Google Gemini via `@google/genai`
- **Validation:** Zod

## Prerequisites

- Node.js **20.19+** (or **22.12+**) and npm.
- A Gemini API key with access to the model configured in the backend.

## Local setup

Install dependencies separately for the backend and frontend. Run commands
from the repository root unless a step says otherwise.

### 1. Configure the backend

```powershell
cd server
npm install
```

Create `server/.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Keep this key private. Do not commit the `.env` file.

### 2. Start the backend

In the `server` directory:

```powershell
npm run dev
```

Alternatively, from the repository root:

```powershell
npm run dev
```

The root `dev` script starts **only the backend**. By default, the API listens
on `http://localhost:5000`. Keep this terminal running.

### 3. Start the frontend

Open a second terminal at the repository root:

```powershell
cd client
npm install
npm run dev
```

Alternatively, from the repository root:

```powershell
npm --prefix client install
npm --prefix client run dev
```

Open the local URL printed by Vite, usually
[`http://localhost:5173`](http://localhost:5173). The Vite development server
proxies `/api` requests to the backend on port `5000`.

## Verify the backend

The health endpoint should return `{"status":"ok"}`:

```text
http://localhost:5000/api/health
```

Example recommendation request in PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:5000/api/recommend `
  -ContentType "application/json" `
  -Body (@{ query = 'Recommend a laptop under $500' } | ConvertTo-Json)
```

The recommendation endpoint expects a `query` between 3 and 200 characters and
returns a `recommendations` array. Each result includes product details and a
reason for the match.

## Deploy to Vercel

Import the repository into Vercel with the repository root as the project root.
The root `vercel.json` builds the React app in `client` and routes `/api/*` to
the Express function in `api/index.js`. Add `GEMINI_API_KEY` in the Vercel
project's Environment Variables, then redeploy. The root deployment URL should
show the frontend; check the backend at `/api/health`.

If the root URL displays `Cannot GET /`, confirm the config file is named
exactly `vercel.json` and that the deployment is using the latest commit.

## Example queries

- `Recommend a laptop under $500`
- `Show me noise-canceling headphones`
- `I need a phone with a good camera`
- `Suggest a tablet for drawing`

## Product catalog

The frontend catalog is in `client/src/products.js`; the backend uses
`server/products.js` to build its prompt and validate returned product IDs.
Keep the two lists in sync when adding, removing, or changing products.

## Useful commands

Run these from the appropriate package directory, or use the root-prefixed
commands shown above:

| Purpose | Command |
| --- | --- |
| Start backend (development) | `npm run dev` in `server` |
| Start backend (normal process) | `npm start` in `server` |
| Start frontend | `npm run dev` in `client` |
| Build frontend | `npm run build` in `client` |
| Lint frontend | `npm run lint` in `client` |
| Preview frontend build | `npm run preview` in `client` |

## Troubleshooting

- **`EADDRINUSE` on port 5000:** Another process is already using the backend
  port. Stop the other backend, or configure the server and Vite proxy to use
  the same available port.
- **Recommendation request returns an error:** Check that the backend is
  running, `server/.env` contains a valid `GEMINI_API_KEY`, and the configured
  Gemini model is available to your API key. Check the backend terminal for
  the underlying Gemini error.
- **Vite cannot resolve `./products`:** Confirm that
  `client/src/products.js` exists.
- **`npm` cannot find `package.json`:** Run commands in the package folder
  named by the command, or use the root-prefixed commands in this guide. For
  example, from `client`, run `npm run dev`; use
  `npm --prefix client run dev` from the repository root.
