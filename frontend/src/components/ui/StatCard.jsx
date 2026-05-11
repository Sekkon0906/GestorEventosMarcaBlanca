export default function StatCard({ label, value, icon: Icon, trend, color = 'blue' }) {
  const colors = {
    blue  : 'bg-primary/10 text-primary',
    purple: 'bg-accent/10 text-purple-400',
    green : 'bg-success/10 text-success',
    yellow: 'bg-warning/10 text-warning',
    red   : 'bg-danger/10 text-danger',
  };

  return (
    <div className="card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-text-secondary mb-1">{label}</p>
        <p className="text-2xl font-bold text-text-primary font-head">{value ?? '—'}</p>
        {trend && (
          <p className={`text-xs mt-1 ${trend.up ? 'text-success' : 'text-danger'}`}>
            {trend.up ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
