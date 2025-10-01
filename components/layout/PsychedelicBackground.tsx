export default function PsychedelicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {/* 4K Ultra-HD Psychedelic gradient orbs - More visible */}
      <div className="absolute -top-80 -left-80 w-[1200px] h-[1200px] rounded-full bg-gradient-to-br from-fuchsia-500/35 via-purple-500/30 to-pink-400/35 blur-[150px] opacity-60" />
      <div className="absolute -bottom-80 -right-80 w-[1200px] h-[1200px] rounded-full bg-gradient-to-tl from-cyan-400/35 via-blue-500/30 to-indigo-400/35 blur-[150px] opacity-60" />
      <div className="absolute top-1/4 left-1/3 w-[900px] h-[900px] rounded-full bg-gradient-to-r from-violet-500/30 via-fuchsia-400/25 to-pink-500/30 blur-[130px] opacity-50" />
      <div className="absolute bottom-1/4 right-1/3 w-[900px] h-[900px] rounded-full bg-gradient-to-l from-emerald-400/25 via-teal-500/20 to-cyan-400/25 blur-[130px] opacity-45" />
      {/* Lighter overlay for better gradient visibility */}
      <div className="absolute inset-0 bg-black/15" />
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20" />
    </div>
  )
}
