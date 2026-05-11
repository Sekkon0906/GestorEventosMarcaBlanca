/**
 * Logo de GESTEK
 *  - 3 figuras de personas (conexión / asistentes)
 *  - Arco/onda (gestión, fluidez)
 *  - Engranaje (automatización, sistema operativo)
 *
 *  Props:
 *    size      → tamaño en px (default 48)
 *    showText  → mostrar "GESTEK" al lado (default false)
 *    tagline   → mostrar tagline debajo (default false)
 *    className → clases extra para el wrapper
 */
export default function GestekLogo({ size = 48, showText = false, tagline = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_18px_rgba(37,99,235,0.4)]"
      >
        <defs>
          <linearGradient id="gestekGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#60A5FA" />
            <stop offset="55%"  stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient id="gestekDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* Personas (3 figuras) */}
        {/* Cabeza izquierda */}
        <circle cx="32" cy="30" r="8" fill="url(#gestekGrad)" />
        {/* Cuerpo izquierda */}
        <path d="M22 56 Q22 42 32 42 Q42 42 42 56 Z" fill="url(#gestekDark)" />

        {/* Cabeza central (más grande) */}
        <circle cx="60" cy="22" r="10" fill="url(#gestekGrad)" />
        {/* Cuerpo central */}
        <path d="M47 58 Q47 38 60 38 Q73 38 73 58 Z" fill="url(#gestekDark)" />

        {/* Cabeza derecha */}
        <circle cx="88" cy="30" r="8" fill="url(#gestekGrad)" />
        {/* Cuerpo derecha */}
        <path d="M78 56 Q78 42 88 42 Q98 42 98 56 Z" fill="url(#gestekDark)" />

        {/* Arco/onda */}
        <path
          d="M10 64 Q60 80 110 64"
          stroke="url(#gestekGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Engranaje */}
        <g transform="translate(60, 90)">
          {/* Dientes del engranaje */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
            <rect
              key={deg}
              x="-3" y="-21" width="6" height="9"
              rx="1.5"
              fill="url(#gestekGrad)"
              transform={`rotate(${deg})`}
            />
          ))}
          {/* Cuerpo del engranaje */}
          <circle r="14" fill="url(#gestekGrad)" />
          {/* Centro */}
          <circle r="5" fill="#0B1120" />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-extrabold font-head text-xl tracking-tight text-text-primary">
            GESTEK
          </span>
          {tagline && (
            <span className="text-[10px] text-text-secondary font-medium tracking-widest mt-1">
              EVENT OPERATIONS
            </span>
          )}
        </div>
      )}
    </div>
  );
}
