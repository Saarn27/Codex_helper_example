import PropTypes from 'prop-types';

// Utility to render a rating as a row of stars out of 5.
const renderStars = (rating) => {
  const maxStars = 5;
  const normalized = Math.round((rating / 10) * maxStars);
  return Array.from({ length: maxStars }, (_, index) => (
    <span key={index} aria-hidden className={index < normalized ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>
      ★
    </span>
  ));
};

export default function MovieCard({ item, isFavorite, onToggleFavorite }) {
  const {
    title,
    name,
    poster_path: posterPath,
    vote_average: voteAverage,
    release_date: releaseDate,
    first_air_date: firstAirDate,
    overview,
  } = item;

  const displayTitle = title || name || 'Untitled';
  const year = (releaseDate || firstAirDate || '').split('-')[0];
  const posterUrl = posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : null;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-800">
      <div className="relative h-72 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={displayTitle}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No poster available</div>
        )}
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold shadow-lg transition ${
            isFavorite
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {isFavorite ? '❤️ Saved' : '🤍 Favorite'}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 text-slate-700 dark:text-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{displayTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{year || 'Year unknown'}</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="flex items-center gap-1" aria-label={`Rating ${voteAverage ?? 0} out of 10`}>
            {renderStars(voteAverage || 0)}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{voteAverage?.toFixed(1) ?? 'NR'}</span>
        </div>

        {overview && (
          <p className="max-h-24 overflow-hidden text-ellipsis text-sm text-slate-600 dark:text-slate-300">
            {overview}
          </p>
        )}
      </div>
    </article>
  );
}

MovieCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string,
    name: PropTypes.string,
    poster_path: PropTypes.string,
    vote_average: PropTypes.number,
    release_date: PropTypes.string,
    first_air_date: PropTypes.string,
    overview: PropTypes.string,
    media_type: PropTypes.string,
  }).isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onToggleFavorite: PropTypes.func.isRequired,
};
