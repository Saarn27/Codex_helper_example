import { useEffect, useMemo, useState } from 'react';
import MovieCard from './components/MovieCard.jsx';
import SearchBar from './components/SearchBar.jsx';

const API_BASE = 'https://api.themoviedb.org/3';

// Helper that safely reads JSON data from localStorage.
const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key} from localStorage`, error);
    return fallback;
  }
};

// Helper that safely writes JSON data to localStorage.
const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to save ${key} to localStorage`, error);
  }
};

const FAVORITES_KEY = 'ai-movie-explorer-favorites';
const THEME_KEY = 'ai-movie-explorer-theme';
const MEDIA_TYPE_KEY = 'ai-movie-explorer-media-type';

export default function App() {
  // Search query typed by the user.
  const [query, setQuery] = useState('');
  // Loading state to drive the progress indicator.
  const [isLoading, setIsLoading] = useState(false);
  // Any error message surfaced by the fetch logic.
  const [error, setError] = useState(null);
  // Raw search results from the TMDb API.
  const [results, setResults] = useState([]);
  // Bookkeeping for showing only favorites.
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  // Persist the user's favorite selections across sessions.
  const [favorites, setFavorites] = useState(() => readStorage(FAVORITES_KEY, {}));
  // Track the current media type (movie / tv) with persistence.
  const [mediaType, setMediaType] = useState(() => readStorage(MEDIA_TYPE_KEY, 'movie'));
  // Track theme preference and update the DOM + localStorage.
  const [isDarkMode, setIsDarkMode] = useState(() => readStorage(THEME_KEY, false));

  // Derive the API key from Vite's environment variables for security.
  const apiKey = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_API_KEY';

  // Keep the document root in sync with the theme selection.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    root.classList.toggle('light', !isDarkMode);
    writeStorage(THEME_KEY, isDarkMode);
  }, [isDarkMode]);

  // Persist the currently selected media type for future visits.
  useEffect(() => {
    writeStorage(MEDIA_TYPE_KEY, mediaType);
  }, [mediaType]);

  // Persist favorites whenever they change.
  useEffect(() => {
    writeStorage(FAVORITES_KEY, favorites);
  }, [favorites]);

  // Debounced search that re-fetches whenever the query or media type changes.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const handler = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/search/${mediaType}?api_key=${apiKey}&query=${encodeURIComponent(query.trim())}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error(fetchError);
          setError('We hit a snag while talking to TMDb. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(handler);
    };
  }, [apiKey, mediaType, query]);

  // Build a map of favorite IDs for quick lookups in renders.
  const favoriteMap = useMemo(() => new Map(Object.entries(favorites)), [favorites]);

  // Decide which list of items to render based on the "Favorites" filter toggle.
  const itemsToDisplay = useMemo(() => {
    if (showFavoritesOnly) {
      return Object.values(favorites).map((item) => item.data);
    }
    return results;
  }, [favorites, results, showFavoritesOnly]);

  // Toggle favorites by either creating or removing the entry in localStorage-backed state.
  const handleFavoriteToggle = (item) => {
    setFavorites((prev) => {
      const key = `${item.media_type || mediaType}-${item.id}`;
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          mediaType: item.media_type || mediaType,
          data: { ...item, media_type: item.media_type || mediaType },
        };
      }
      return next;
    });
  };

  // Helper to check if an item is currently a favorite.
  const isFavorite = (item) => {
    const key = `${item.media_type || mediaType}-${item.id}`;
    return favoriteMap.has(key);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-16 transition-colors duration-300 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pt-10">
        {/* Header containing title, favorites toggle, and theme switch */}
        <header className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">AI Movie Explorer</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Search TMDb, save your favorites locally, and explore in light or dark mode.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`rounded-full border border-transparent px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                showFavoritesOnly
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400'
                  : 'bg-slate-200 text-slate-900 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {showFavoritesOnly ? 'Showing Favorites' : 'Favorites'}
            </button>

            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition-colors duration-200 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-900"
            >
              {isDarkMode ? '🌙 Dark' : '☀️ Light'} Mode
            </button>
          </div>
        </header>

        {/* Search bar and filters */}
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          mediaType={mediaType}
          onMediaTypeChange={setMediaType}
        />

        {/* Status messaging */}
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400" role="status">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
              Fetching titles from TMDb...
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!isLoading && !error && itemsToDisplay.length === 0 && query && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No results yet. Try refining your search terms.
            </p>
          )}
        </section>

        {/* Result grid */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {itemsToDisplay.map((item) => (
            <MovieCard
              key={`${item.media_type || mediaType}-${item.id}`}
              item={item}
              isFavorite={isFavorite(item)}
              onToggleFavorite={() => handleFavoriteToggle(item)}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
