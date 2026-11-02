import Nimbus from "./Nimbus.jsx";

// Shows an error from api.js. "AI is busy" errors get a friendly notice with
// a sleepy Nimbus; anything else is plain red text. onRetry adds a Try again button.
export default function ErrorNotice({ error, onRetry }) {
  if (!error) return null;

  if (!error.busy) {
    return (
      <p className="error" role="alert">
        {error.message}
      </p>
    );
  }

  return (
    <div className="busy-notice" role="alert">
      <Nimbus size={72} sleepy />
      <div className="busy-text">
        <strong>Nimbus is a little overwhelmed</strong>
        <span>{error.message}</span>
      </div>
      {onRetry && (
        <button type="button" className="secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
