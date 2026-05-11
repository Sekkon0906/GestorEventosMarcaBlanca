export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;

  const styles = {
    error  : 'bg-danger/10 border-danger/30 text-danger',
    success: 'bg-success/10 border-success/30 text-success',
    warning: 'bg-warning/10 border-warning/30 text-warning',
    info   : 'bg-primary/10 border-primary/30 text-primary',
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${styles[type]}`}>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          ✕
        </button>
      )}
    </div>
  );
}
