import Matter from 'matter-js'
import { BALLS_PER_GAME, nextMultiplier, pointsForTarget, type TargetKind } from './scoring'
const { Bodies, Body, Composite, Engine, Events, Runner } = Matter
const WIDTH = 720
const HEIGHT = 1000
export type GameSnapshot = { score: number; highScore: number; balls: number; multiplier: number; status: 'ready' | 'playing' | 'paused' | 'gameover' }
type TableOptions = { canvas: HTMLCanvasElement; sound: boolean; onChange: (snapshot: GameSnapshot) => void; onPulse: (label: string) => void }
type TaggedBody = Matter.Body & { gameType?: TargetKind | 'drain'; hitAt?: number }

export class PinballTable {
  private engine = Engine.create({ gravity: { x: 0, y: 1, scale: 0.00125 } })
  private runner = Runner.create()
  private frame = 0
  private ball?: Matter.Body
  private leftFlipper: Matter.Body
  private rightFlipper: Matter.Body
  private leftPressed = false
  private rightPressed = false
  private sound = true
  private score = 0
  private highScore = Number(localStorage.getItem('neon-pinball-high-score') ?? 0)
  private balls = BALLS_PER_GAME
  private multiplier = 1
  private litLanes = new Set<string>()
  private status: GameSnapshot['status'] = 'ready'
  private ctx: CanvasRenderingContext2D
  private audio?: AudioContext
  private options: TableOptions

  constructor(options: TableOptions) {
    this.options = options
    this.sound = options.sound
    options.canvas.width = WIDTH; options.canvas.height = HEIGHT
    const ctx = options.canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas rendering is unavailable.')
    this.ctx = ctx
    const wall = { isStatic: true, restitution: 0.7, friction: 0, render: { visible: false } }
    const bodies: Matter.Body[] = [
      Bodies.rectangle(35, 500, 30, 910, wall), Bodies.rectangle(685, 500, 30, 910, wall), Bodies.rectangle(360, 42, 650, 30, wall),
      Bodies.rectangle(124, 820, 245, 22, { ...wall, angle: 0.48 }), Bodies.rectangle(596, 820, 245, 22, { ...wall, angle: -0.48 }),
      Bodies.rectangle(620, 470, 12, 650, wall), this.target(245, 250, 42, 'bumper'), this.target(430, 245, 52, 'bumper'),
      this.target(350, 400, 46, 'bumper'), this.target(190, 500, 30, 'spinner'), this.target(500, 505, 30, 'spinner'),
      this.lane(170, 'A'), this.lane(320, 'B'), this.lane(470, 'C'),
    ]
    const drain = Bodies.rectangle(360, 990, 400, 20, { isStatic: true, isSensor: true }) as TaggedBody
    drain.gameType = 'drain'; bodies.push(drain)
    this.leftFlipper = Bodies.rectangle(265, 825, 145, 28, { isStatic: true, angle: 0.2, chamfer: { radius: 14 }, restitution: 0.35 })
    this.rightFlipper = Bodies.rectangle(455, 825, 145, 28, { isStatic: true, angle: -0.2, chamfer: { radius: 14 }, restitution: 0.35 })
    bodies.push(this.leftFlipper, this.rightFlipper); Composite.add(this.engine.world, bodies)
    Events.on(this.engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        const target = ([pair.bodyA, pair.bodyB] as TaggedBody[]).find((body) => body.gameType)
        if (!target || !this.ball || (pair.bodyA !== this.ball && pair.bodyB !== this.ball)) continue
        if (target.gameType === 'drain') this.loseBall(); else this.hitTarget(target)
      }
    })
    Events.on(this.engine, 'afterUpdate', () => this.updateFlippers())
    Runner.run(this.runner, this.engine); this.render(); this.emit()
  }
  private target(x: number, y: number, radius: number, gameType: TargetKind): Matter.Body {
    const body = Bodies.circle(x, y, radius, { isStatic: true, restitution: 1.55, friction: 0 }) as TaggedBody; body.gameType = gameType; return body
  }
  private lane(x: number, label: string): Matter.Body {
    const body = Bodies.rectangle(x, 110, 76, 16, { isStatic: true, isSensor: true, label }) as TaggedBody; body.gameType = 'lane'; return body
  }
  start(): void {
    this.score = 0; this.balls = BALLS_PER_GAME; this.multiplier = 1; this.litLanes.clear(); this.status = 'playing'; this.engine.timing.timeScale = 1
    this.spawnBall(); this.emit()
  }
  togglePause(): void {
    if (this.status !== 'playing' && this.status !== 'paused') return
    this.status = this.status === 'playing' ? 'paused' : 'playing'; this.engine.timing.timeScale = this.status === 'paused' ? 0 : 1; this.emit()
  }
  setSound(enabled: boolean): void { this.sound = enabled }
  setFlipper(side: 'left' | 'right', pressed: boolean): void { if (side === 'left') this.leftPressed = pressed; else this.rightPressed = pressed }
  launch(): void {
    if (this.status === 'ready' || this.status === 'gameover') return this.start()
    if (this.status === 'playing' && this.ball && this.ball.position.x > 600 && this.ball.speed < 2) {
      Body.setVelocity(this.ball, { x: -2.2, y: -22 }); this.beep(260, 0.08)
    }
  }
  private spawnBall(): void {
    if (this.ball) Composite.remove(this.engine.world, this.ball)
    this.ball = Bodies.circle(655, 870, 15, { restitution: 0.65, friction: 0.002, frictionAir: 0.008, density: 0.002 }); Composite.add(this.engine.world, this.ball)
  }
  private loseBall(): void {
    if (!this.ball) return
    Composite.remove(this.engine.world, this.ball); this.ball = undefined; this.balls -= 1
    if (this.balls <= 0) {
      this.status = 'gameover'
      if (this.score > this.highScore) { this.highScore = this.score; localStorage.setItem('neon-pinball-high-score', String(this.highScore)) }
      this.options.onPulse('GAME OVER')
    } else { this.options.onPulse(`BALL ${BALLS_PER_GAME - this.balls + 1}`); window.setTimeout(() => this.status === 'playing' && this.spawnBall(), 700) }
    this.emit()
  }
  private hitTarget(target: TaggedBody): void {
    const now = performance.now(); if (target.hitAt && now - target.hitAt < 180) return; target.hitAt = now
    const kind = target.gameType as TargetKind; const points = pointsForTarget(kind, this.multiplier); this.score += points
    if (kind === 'lane') {
      this.litLanes.add(target.label); const updated = nextMultiplier(this.multiplier, this.litLanes.size)
      if (updated !== this.multiplier) { this.multiplier = updated; this.litLanes.clear(); this.options.onPulse(`${updated}× MULTIPLIER`) }
    } else this.options.onPulse(`+${points}`)
    this.beep(kind === 'bumper' ? 520 : 760, 0.045); this.emit()
  }
  private updateFlippers(): void {
    const move = (body: Matter.Body, target: number) => { const delta = target - body.angle; Body.setAngle(body, body.angle + delta * 0.34); Body.setAngularVelocity(body, delta * 0.42) }
    move(this.leftFlipper, this.leftPressed ? -0.5 : 0.2); move(this.rightFlipper, this.rightPressed ? 0.5 : -0.2)
  }
  private beep(frequency: number, duration: number): void {
    if (!this.sound) return
    this.audio ??= new AudioContext(); const osc = this.audio.createOscillator(); const gain = this.audio.createGain()
    osc.frequency.value = frequency; osc.type = 'square'; gain.gain.value = 0.025; osc.connect(gain).connect(this.audio.destination); osc.start(); osc.stop(this.audio.currentTime + duration)
  }
  private emit(): void { this.options.onChange({ score: this.score, highScore: this.highScore, balls: this.balls, multiplier: this.multiplier, status: this.status }) }
  private render = (): void => {
    const ctx = this.ctx; ctx.clearRect(0, 0, WIDTH, HEIGHT)
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT); gradient.addColorStop(0, '#14112c'); gradient.addColorStop(1, '#080714'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 4; ctx.shadowBlur = 16; ctx.shadowColor = '#2dd4bf'; ctx.strokeRect(22, 25, 676, 930); ctx.shadowBlur = 0
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(360, 410, 70 + i * 38, 0, Math.PI * 2); ctx.strokeStyle = `rgba(217,70,239,${0.13 - i * .01})`; ctx.stroke() }
    for (const body of Composite.allBodies(this.engine.world) as TaggedBody[]) {
      if (body === this.ball || body.gameType === 'drain' || (!body.gameType && body !== this.leftFlipper && body !== this.rightFlipper)) continue
      ctx.save(); ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle)
      if (body.gameType === 'lane') {
        ctx.fillStyle = this.litLanes.has(body.label) ? '#fbbf24' : '#334155'; ctx.fillRect(-34, -7, 68, 14); ctx.fillStyle = '#f8fafc'; ctx.font = '700 22px system-ui'; ctx.textAlign = 'center'; ctx.fillText(body.label, 0, -17)
      } else if (body.gameType) {
        const radius = body.circleRadius ?? 30; ctx.shadowBlur = 24; ctx.shadowColor = body.gameType === 'bumper' ? '#f472b6' : '#22d3ee'; ctx.fillStyle = '#17142e'; ctx.strokeStyle = ctx.shadowColor; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(0, 0, radius * .35, 0, Math.PI * 2); ctx.fill()
      } else { ctx.shadowBlur = 18; ctx.shadowColor = '#fbbf24'; ctx.fillStyle = '#fbbf24'; ctx.fillRect(-72, -14, 144, 28) }
      ctx.restore()
    }
    if (this.ball) { const { x, y } = this.ball.position; ctx.shadowBlur = 20; ctx.shadowColor = '#fff'; ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(x, y, 15, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0 }
    ctx.fillStyle = '#94a3b8'; ctx.font = '600 17px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SPACE TO LAUNCH', 654, 920); this.frame = requestAnimationFrame(this.render)
  }
  destroy(): void { cancelAnimationFrame(this.frame); Runner.stop(this.runner); Engine.clear(this.engine); void this.audio?.close() }
}
