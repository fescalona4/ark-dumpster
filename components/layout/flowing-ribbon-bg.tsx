'use client';

interface FlowingRibbonBackgroundProps {
  className?: string;
}

export default function FlowingRibbonBackground({ className = "" }: FlowingRibbonBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Static Centered Silky Ribbon */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Silky purple-blue gradient */}
          <linearGradient id="silkyRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.12" />
            <stop offset="20%" stopColor="#764ba2" stopOpacity="0.20" />
            <stop offset="40%" stopColor="#667eea" stopOpacity="0.30" />
            <stop offset="60%" stopColor="#f093fb" stopOpacity="0.40" />
            <stop offset="80%" stopColor="#667eea" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#4facfe" stopOpacity="0.20" />
          </linearGradient>

          {/* Silk highlight gradient */}
          <linearGradient id="silkHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.08" />
          </linearGradient>

          {/* Soft shadow for depth */}
          <linearGradient id="silkShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1a2e" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#16213e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1a1a2e" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Main static silky ribbon - centered */}
        <path
          d="M-300,450 Q100,350 400,400 Q700,450 1000,400 Q1300,350 1700,450"
          stroke="url(#silkyRibbon)"
          strokeWidth="180"
          fill="none"
          strokeLinecap="round"
          style={{
            // filter: 'blur(1px)',
          }}
        />

        {/* Silk highlight layer - centered */}
        <path
          d="M-300,440 Q100,340 400,390 Q700,440 1000,390 Q1300,340 1700,440"
          stroke="url(#silkHighlight)"
          strokeWidth="90"
          fill="none"
          strokeLinecap="round"
          style={{
            // filter: 'blur(1px)',
          }}
        />

        {/* Soft shadow for depth - centered */}
        <path
          d="M-300,470 Q100,370 400,420 Q700,470 1000,420 Q1300,370 1700,470"
          stroke="url(#silkShadow)"
          strokeWidth="160"
          fill="none"
          strokeLinecap="round"
          style={{
            // filter: 'blur(1px)',
          }}
        />
      </svg>

      {/* Static CSS ribbon complement - centered */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-24 rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.20), rgba(102, 126, 234, 0.30), rgba(240, 147, 251, 0.40), rgba(102, 126, 234, 0.30), rgba(79, 172, 254, 0.20), transparent)',
            // filter: 'blur(10px)',
          }}
        />
      </div>
    </div>
  );
}