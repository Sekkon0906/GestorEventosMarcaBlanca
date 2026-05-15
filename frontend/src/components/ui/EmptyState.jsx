export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-[fadeUp_0.4s_ease_both]">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/15 flex items-center justify-center">
          {Icon
            ? <Icon className="w-9 h-9 text-primary/60" />
            : <DefaultIcon />}
        </div>
        <div className="absolute -inset-3 rounded-full bg-primary/5 blur-xl pointer-events-none" />
      </div>
      <h3 className="text-base font-semibold text-text-1 mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-text-2 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

function DefaultIcon() {
  return (
    <svg className="w-9 h-9 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}
