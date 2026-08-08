import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('glow'), 100)
    const t2 = setTimeout(() => setPhase('exit'), 800)
    const t3 = setTimeout(() => onFinish(), 1100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-950 transition-opacity duration-300 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`transition-all duration-500 ease-out ${
          phase === 'enter' ? 'scale-75 opacity-0' : phase === 'glow' ? 'scale-100 opacity-100 drop-shadow-[0_0_30px_rgba(255,61,61,0.5)]' : 'scale-110 opacity-0'
        }`}
      >
        <svg width="80" height="80" viewBox="0 0 1024 1024">
          <defs>
            <radialGradient id="splashBg" cx="42%" cy="35%" r="72%">
              <stop offset="0%" stopColor="#23262E"/>
              <stop offset="100%" stopColor="#16181D"/>
            </radialGradient>
            <linearGradient id="splashBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5252"/>
              <stop offset="40%" stopColor="#FF3D3D"/>
              <stop offset="100%" stopColor="#E62929"/>
            </linearGradient>
            <clipPath id="splashClip">
              <rect width="1024" height="1024" rx="225"/>
            </clipPath>
            <mask id="splashPlay">
              <rect width="1024" height="1024" fill="white"/>
              <polygon points="415,432 415,610 705,521" fill="black"/>
            </mask>
          </defs>
          <g clipPath="url(#splashClip)">
            <rect width="1024" height="1024" fill="url(#splashBg)"/>
            <path d="M172,235 A40,40 0 0,1 212,195 L812,195 A40,40 0 0,1 852,235 L852,848 L512,938 L172,848 Z" fill="url(#splashBody)" mask="url(#splashPlay)"/>
          </g>
        </svg>
      </div>
      <h1
        className={`mt-4 text-lg font-bold tracking-wide transition-all duration-500 delay-100 ${
          phase === 'enter' ? 'opacity-0 translate-y-2' : phase === 'glow' ? 'opacity-100 translate-y-0 text-dark-100' : 'opacity-0 translate-y-2 text-dark-100'
        }`}
      >
        MediaPulse
      </h1>
    </div>
  )
}
