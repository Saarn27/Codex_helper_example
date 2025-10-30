# AI Chat Next.js App

A responsive, accessible chat interface for talking with OpenAI models using streaming responses.

## Features
- Next.js App Router with TypeScript
- Streaming chat with the OpenAI API (Responses API preferred, Chat Completions fallback)
- Markdown rendering with syntax-highlighted code blocks and copy buttons
- Model selector, system prompt, temperature and max token controls
- Dark mode toggle with persistence
- Local chat history with clear/reset and JSON export

## Getting started

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd Codex_helper_example
   npm install
   ```

2. **Configure environment variables**
   - Copy `.env.example` to `.env.local` and provide your OpenAI API key:
     ```bash
     cp .env.example .env.local
     ```
   - Edit `.env.local` and replace `sk-...` with your real key.

3. **Run the development server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to use the app. Streaming responses require a valid API key and a model that supports streaming.

4. **Building for production**
   ```bash
   npm run build
   npm run start
   ```

## Usage notes
- The chat stores conversations locally in your browser (`localStorage`). Use **Clear chat** to reset or **Export** to download the current session as JSON.
- The optional system prompt is applied to the first message for each session.
- Temperature and max token preferences are remembered per browser.
- API errors (including invalid keys and rate limits) display actionable messages in the UI.

## Deployment
- Deploy easily to [Vercel](https://vercel.com/) or any platform that supports Next.js 14+ and Node.js 18+.
- Set the `OPENAI_API_KEY` environment variable in your hosting provider's dashboard.

## Safety
- The app forwards user input directly to OpenAI. Remind users not to share sensitive data.
- Consider implementing additional safeguards (moderation, logging, user controls) before public release.
