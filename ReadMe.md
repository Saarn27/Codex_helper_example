# AI Movie Explorer

AI Movie Explorer is a lightweight React experience built with Vite and Tailwind CSS that lets you search the The Movie Database (TMDb) catalog, preview results, and store favorites locally in your browser.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the printed URL (typically http://localhost:5173) in your browser.

## Environment Variables

Create a `.env` file in the project root and provide your TMDb API key:

```bash
VITE_TMDB_API_KEY=YOUR_API_KEY
```

## Key Features

- Instant search results from TMDb with debounced requests.
- Responsive movie/TV cards with posters, release year, and star ratings.
- Favorite toggles stored in `localStorage` with quick filtering.
- Light/dark theme switcher that persists preferences.
- Optional TV/movie mode switch, plus loading feedback during fetches.

## License

Specify a license in a LICENSE file (e.g., MIT).
