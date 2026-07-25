let audioContext = null

function getContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  return audioContext
}

function playDefaultChime() {
  const ctx = getContext()
  if (!ctx) return

  const now = ctx.currentTime
  const baseFreq = 523.25

  const notes = [
    { freq: baseFreq * 1, start: 0, duration: 0.12 },
    { freq: baseFreq * 1.25, start: 0.1, duration: 0.12 },
    { freq: baseFreq * 1.5, start: 0.2, duration: 0.3 },
  ]

  for (const note of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(note.freq, now + note.start)
    gain.gain.setValueAtTime(0.3, now + note.start)
    gain.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + note.start)
    osc.stop(now + note.start + note.duration + 0.05)
  }
}

let cachedAudio = null

function playFromUrl(url) {
  if (cachedAudio) {
    cachedAudio.currentTime = 0
    cachedAudio.play().catch(() => {})
    return
  }
  const audio = new Audio(url)
  audio.volume = 0.5
  audio.play().catch(() => {
    playDefaultChime()
  })
  cachedAudio = audio
}

export function playNotificationSound(soundUrl) {
  if (soundUrl) {
    playFromUrl(soundUrl)
  } else {
    playDefaultChime()
  }
}

export function clearCachedAudio() {
  if (cachedAudio) {
    cachedAudio.pause()
    cachedAudio = null
  }
}
