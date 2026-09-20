/* oxlint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef } from 'react'
import { PinballTable, type GameSnapshot } from '../game/PinballTable'
type Props = { sound: boolean; command: { type: 'start' | 'pause'; id: number } | null; onChange: (state: GameState) => void; onPulse: (label: string) => void; onReady: (controls: GameControls) => void }
export type GameState = GameSnapshot
export type GameControls = { launch: () => void; flipper: (side: 'left' | 'right', pressed: boolean) => void }
export function GameBoard({ sound, command, onChange, onPulse, onReady }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null); const table = useRef<PinballTable>(null)
  // The engine is intentionally created once; later option changes use dedicated effects.
  useEffect(() => {
    if (!canvas.current) return
    table.current = new PinballTable({ canvas: canvas.current, sound, onChange, onPulse })
    onReady({ launch: () => table.current?.launch(), flipper: (side, pressed) => table.current?.setFlipper(side, pressed) })
    const down = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') table.current?.setFlipper('left', true)
      if (event.code === 'ArrowRight' || event.code === 'KeyD') table.current?.setFlipper('right', true)
      if (event.code === 'Space') { event.preventDefault(); table.current?.launch() }
      if (event.code === 'KeyP' || event.code === 'Escape') table.current?.togglePause()
    }
    const up = (event: KeyboardEvent) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') table.current?.setFlipper('left', false)
      if (event.code === 'ArrowRight' || event.code === 'KeyD') table.current?.setFlipper('right', false)
    }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); table.current?.destroy() }
  }, [])
  useEffect(() => table.current?.setSound(sound), [sound])
  useEffect(() => { if (command?.type === 'start') table.current?.start(); if (command?.type === 'pause') table.current?.togglePause() }, [command])
  return <canvas ref={canvas} className="h-auto max-h-[calc(100svh-12rem)] w-full touch-none rounded-box" aria-label="Neon pinball table" role="img" />
}
