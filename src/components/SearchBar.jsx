import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

// Debounced search input with optional media type toggle.
export default function SearchBar({ query, onQueryChange, mediaType, onMediaTypeChange }) {
  const [internalValue, setInternalValue] = useState(query);

  // Keep the internal state in sync when the query is updated externally (e.g., clearing filters).
  useEffect(() => {
    setInternalValue(query);
  }, [query]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (internalValue !== query) {
        onQueryChange(internalValue);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [internalValue, onQueryChange, query]);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-slate-700 dark:text-slate-200">
      <label htmlFor="movie-search" className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Search the TMDb catalog
      </label>
      <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-4 shadow-lg ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/80 dark:ring-slate-700">
        <input
          id="movie-search"
          type="text"
          value={internalValue}
          placeholder="Start typing a movie or show title..."
          onChange={(event) => setInternalValue(event.target.value)}
          className="w-full rounded-xl border border-transparent bg-slate-100 px-4 py-3 text-base text-slate-900 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 dark:bg-slate-900 dark:text-slate-100"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Results update as you type. Data provided by The Movie Database (TMDb).
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Mode</span>
            <div className="flex overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs dark:border-slate-700 dark:bg-slate-900">
              {['movie', 'tv'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onMediaTypeChange(type)}
                  className={`px-3 py-1 font-medium capitalize transition ${
                    mediaType === type
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {type === 'movie' ? 'Movies' : 'TV Shows'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

SearchBar.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  mediaType: PropTypes.oneOf(['movie', 'tv']).isRequired,
  onMediaTypeChange: PropTypes.func.isRequired,
};
