/**
 * AudioPort — interface for game audio.
 * Adapters: WebAudioAdapter
 */
export interface AudioPort {
  readonly playSound: (soundId: string) => void
  readonly playMusic: (trackId: string) => void
  readonly stopMusic: () => void
  readonly setVolume: (volume: number) => void
  readonly mute: () => void
  readonly unmute: () => void
}
