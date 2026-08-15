export function PodcastArtwork({ podcast, className = "" }) {
  const initial = podcast.name?.trim().charAt(0).toUpperCase() || "P";

  return (
    <span className={`podcast-artwork ${className}`}>
      <span className="podcast-artwork-fallback">{initial}</span>
      {podcast.artworkUrl && (
        <img
          src={podcast.artworkUrl}
          alt={`Illustration de ${podcast.name}`}
          onError={(event) => { event.currentTarget.hidden = true; }}
        />
      )}
    </span>
  );
}
