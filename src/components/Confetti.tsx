import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  spin: number
  angle: number
}

const COLORS = ['#f43f5e', '#facc15', '#22c55e', '#0ea5e9', '#a855f7', '#fb923c', '#ffffff']

/**
 * Pháo hoa giấy khen bé giải đúng. Vẽ bằng canvas, tự tắt sau ~2.6 giây.
 */
export function Confetti({ show, onDone }: { show: boolean; onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!show) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: Particle[] = []
    let burstsLeft = 7
    let lastBurst = 0

    const burst = () => {
      const cx = window.innerWidth * (0.15 + Math.random() * 0.7)
      const cy = window.innerHeight * (0.12 + Math.random() * 0.4)
      const count = 46
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
        const speed = 2.4 + Math.random() * 5
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          life: 0,
          maxLife: 60 + Math.random() * 50,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 4 + Math.random() * 6,
          spin: (Math.random() - 0.5) * 0.3,
          angle: Math.random() * Math.PI,
        })
      }
    }

    let start = 0
    const draw = (time: number) => {
      if (!start) start = time
      const elapsed = time - start
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      if (elapsed - lastBurst > 320 && burstsLeft > 0) {
        burst()
        lastBurst = elapsed
        burstsLeft -= 1
      }

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i]
        p.life += 1
        p.vy += 0.11
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        const alpha = Math.max(0, 1 - p.life / p.maxLife)
        if (alpha <= 0) {
          particles.splice(i, 1)
          continue
        }
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      if (particles.length > 0 || burstsLeft > 0) {
        frameRef.current = requestAnimationFrame(draw)
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        onDone?.()
      }
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
  }, [show, onDone])

  if (!show) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}
