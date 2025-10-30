# AI Movie Explorer

AI Movie Explorer is a lightweight React experience built with Vite and Tailwind CSS. It lets you quickly look up movies and TV shows from The Movie Database (TMDb), preview key details, and bookmark your favorites so you can revisit them later.

## Prerequisites

- Node.js 18 or later
- npm (comes bundled with Node.js)
- A TMDb API key

## Setup and Local Development

1. Install the project dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open the printed URL (typically http://localhost:5173) in your browser to explore the app.

### Stopping the Development Server

When you are done, return to the terminal that is running `npm run dev` and press `Ctrl+C`. This stops the Vite development server and frees the port.

## Environment Variables

Create a `.env` file in the project root and set your TMDb API key:
```bash
VITE_TMDB_API_KEY=YOUR_API_KEY
```

## Highlights

- ⚡ **Instant search** with debounced requests to TMDb.
- 🎬 **Rich media cards** that showcase posters, release year, star ratings, and overviews.
- ⭐ **Favorites management** with quick filtering, all persisted in `localStorage`.
- 🌗 **Light/dark theme toggle** that remembers your preference.
- 📺 **Movie or TV mode switch**, plus loading states while data is retrieved.

## License

Add a LICENSE file (for example, MIT) to document your preferred terms.
