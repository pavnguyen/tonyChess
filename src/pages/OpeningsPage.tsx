import { Chess } from 'chess.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { MoveStrip } from '../components/MoveStrip'
import { ProgressMap } from '../components/ProgressMap'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useCurriculum } from '../hooks/useCurriculum'
import { useOpeningsQuery } from '../data/queries'
import { opponentAnnotation, pieceFromSan } from '../lib/notation'
import { playError, playMove, playTick, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { MoveAnnotation, Opening } from '../types'

type Mode = 'learn' | 'memorize' | 'speed'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'learn', label: 'Học từng bước', icon: '📖' },
  { value: 'memorize', label: 'Luyện thuộc lòng', icon: '🧠' },
  { value: 'speed', label: 'Đua tốc độ 30s', icon: '⚡' },
]

const SPEED_SECONDS = 30

const NO_OPENINGS: Opening[] = []

export function OpeningsPage() {
  const { data: openings, isLoading } = useOpeningsQuery()
  const { notation, completeActivity, isCompleted, soundOn } = useKidProgress()

  const [openingId, setOpeningId] = useState('london')
  const [mode, setMode] = useState<Mode>('learn')
  const [ply, setPly] = useState(0)
  const [heatmap, setHeatmap] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const [confetti, setConfetti] = useState(false)
  const [wrongInfo, setWrongInfo] = useState<{
    annotation: MoveAnnotation
    plyIndex: number
  } | null>(null)
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(SPEED_SECONDS)
  const [running, setRunning] = useState(false)
  const [speedScore, setSpeedScore] = useState(0)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)
  const awardedRef = useRef(false)

  const openingList = openings ?? NO_OPENINGS
  const opening: Opening | undefined = useMemo(
    () => openingList.find((item) => item.id === openingId) ?? openingList[0],
    [openingList, openingId],
  )

  // Bản đồ leo cấp: bài sau mở khi bé đã thuộc bài trước.
  const curriculum = useCurriculum(openingList, 'openings', ':memorize')

  /** FEN sau mỗi ply: fens[i] = thế cờ khi đã đi i nửa nước. */
  const fens = useMemo(() => {
    const game = new Chess()
    const list = [game.fen()]
    if (opening) {
      for (const move of opening.moves) {
        game.move(move.san)
        list.push(game.fen())
      }
    }
    return list
  }, [opening])

  const isKidPly = (index: number) =>
    opening ? (opening.side === 'white' ? index % 2 === 0 : index % 2 === 1) : false

  const totalKidMoves = opening
    ? opening.moves.filter((_, index) => isKidPly(index)).length
    : 0

  // Đổi bài hoặc đổi chế độ → chơi lại từ đầu.
  useEffect(() => {
    setPly(0)
    setHintVisible(mode === 'learn')
    setWrongInfo(null)
    setFinished(false)
    setAutoPlay(false)
    setRunning(false)
    setSecondsLeft(SPEED_SECONDS)
    setSpeedScore(0)
    awardedRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, mode])

  // Đối thủ tự đi trong 2 chế độ luyện.
  useEffect(() => {
    if (mode === 'learn' || !opening) return
    if (ply >= opening.moves.length || isKidPly(ply)) return
    const timer = setTimeout(() => setPly((value) => value + 1), 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, ply, opening])

  // Tự động chạy trong chế độ học.
  useEffect(() => {
    if (mode !== 'learn' || !autoPlay || !opening) return
    if (ply >= opening.moves.length) {
      setAutoPlay(false)
      return
    }
    const timer = setTimeout(() => setPly((value) => value + 1), 1300)
    return () => clearTimeout(timer)
  }, [mode, autoPlay, ply, opening])

  // Đồng hồ đua tốc độ.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft((value) => Math.max(0, Math.round((value - 0.1) * 10) / 10))
    }, 100)
    return () => clearInterval(id)
  }, [running])

  // Tích tắc cảnh báo 5 giây cuối (đặt ngoài updater để không lặp âm thanh).
  const wholeSecond = Math.ceil(secondsLeft)
  useEffect(() => {
    if (!running || wholeSecond <= 0 || wholeSecond > 5) return
    if (soundOn) playTick()
  }, [wholeSecond, running, soundOn])

  useEffect(() => {
    if (!running || secondsLeft > 0) return
    setRunning(false)
    const stars = Math.max(2, speedScore * 2)
    completeActivity(`openings:${opening?.id}:speed`, stars)
    if (soundOn) playTick()
    setResult({
      emoji: '⏰',
      title: 'Hết giờ rồi!',
      message: `Bé xếp được ${speedScore}/${totalKidMoves} nước đúng trong 30 giây. Giỏi lắm!`,
      stars,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft])

  /** Bé đi đúng hết bài → tặng Cúp Vàng. */
  useEffect(() => {
    if (mode === 'learn' || !opening || finished) return
    if (ply !== opening.moves.length) return
    setFinished(true)
    setRunning(false)
    setAutoPlay(false)
    if (awardedRef.current) return
    awardedRef.current = true
    const stars = mode === 'speed' ? 10 + speedScore : 6
    completeActivity(
      mode === 'speed' ? `openings:${opening.id}:speed` : `openings:${opening.id}:memorize`,
      stars,
    )
    if (soundOn) playWin()
    setConfetti(true)
    setResult({
      emoji: '🏆',
      title: mode === 'speed' ? 'Vô địch đua tốc độ!' : 'Cúp Vàng thuộc về bé!',
      message: `Bé đã thuộc trọn vẹn ${opening.name} của ${opening.gm}!`,
      stars,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, mode, opening, finished, speedScore])

  const arrow = useMemo(() => {
    if (!opening || !hintVisible) return []
    if (ply >= opening.moves.length) return []
    if (mode !== 'learn' && !isKidPly(ply)) return []
    try {
      const probe = new Chess(fens[ply])
      const move = probe.move(opening.moves[ply].san)
      return [{ startSquare: move.from, endSquare: move.to, color: '#f59e0b' }]
    } catch {
      return []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening, ply, hintVisible, mode, fens])

  const lastMoveSquares = useMemo(() => {
    if (!opening || ply === 0) return undefined
    try {
      const probe = new Chess(fens[ply - 1])
      const move = probe.move(opening.moves[ply - 1].san)
      return {
        [move.from]: { boxShadow: 'inset 0 0 0 3px rgba(250, 204, 21, 0.95)' },
        [move.to]: { boxShadow: 'inset 0 0 0 4px rgba(250, 204, 21, 0.95)' },
      }
    } catch {
      return undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening, ply, fens])

  const bannerState = useMemo(() => {
    if (!opening) return null
    if (wrongInfo) {
      return { ...wrongInfo, variant: 'wrong' as const }
    }
    if (mode === 'learn') {
      const index = Math.min(ply, opening.moves.length - 1)
      const move = opening.moves[index]
      return {
        annotation: move.annotation ?? opponentAnnotation(move.san, notation),
        plyIndex: index,
        variant: 'hint' as const,
      }
    }
    if (ply === 0) return null
    const index = ply - 1
    const move = opening.moves[index]
    return {
      annotation: move.annotation ?? opponentAnnotation(move.san, notation),
      plyIndex: index,
      variant: move.annotation ? ('played' as const) : ('opponent' as const),
    }
  }, [opening, wrongInfo, mode, ply, notation])

  if (isLoading || !opening) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-pop h-40 animate-pulse bg-violet-100" />
        <div className="card-pop h-40 animate-pulse bg-violet-100" />
      </div>
    )
  }

  const interactive =
    mode === 'memorize' ? isKidPly(ply) && ply < opening.moves.length : mode === 'speed' ? running && isKidPly(ply) : false

  const handleDrop = (from: string, to: string): boolean => {
    if (!interactive || !opening) return false
    const expected = opening.moves[ply]
    const probe = new Chess(fens[ply])
    let move
    try {
      move = probe.move({ from, to, promotion: 'q' })
    } catch {
      if (soundOn) playError()
      return false
    }
    if (move.san !== expected.san) {
      if (soundOn) playError()
      setHintVisible(true)
      const annotation: MoveAnnotation = {
        san: expected.san,
        piece: expected.annotation?.piece ?? pieceFromSan(expected.san),
        reason: `Nước này chưa đúng rồi. Bé nhìn mũi tên vàng rồi thử lại nhé!`,
        rhyme: 'Bình tĩnh thử lại',
      }
      setWrongInfo({ annotation, plyIndex: ply })
      return false
    }
    // Đi đúng!
    if (soundOn) playMove()
    if (mode === 'speed') setSpeedScore((value) => value + 1)
    setWrongInfo(null)
    setHintVisible(false)
    setPly((value) => value + 1)
    return true
  }

  const startSpeedRun = () => {
    setPly(0)
    setSpeedScore(0)
    setSecondsLeft(SPEED_SECONDS)
    setRunning(true)
    setFinished(false)
    setWrongInfo(null)
    setHintVisible(false)
    awardedRef.current = false
  }

  const countdownRatio = secondsLeft / SPEED_SECONDS

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-5">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái: chọn bài + bàn cờ */}
      <div className="grid gap-3">
        <Panel>
          <SectionTitle
            icon="🛡️"
            title="Khai cuộc Đại Kiện Tướng"
            subtitle="Chọn bài học rồi cùng bé chinh phục từng nước!"
          />
          <div className="mt-3">
            <ProgressMap
              nodes={curriculum.map((entry) => ({
                id: entry.item.id,
                level: entry.level,
                title: entry.item.name,
                emoji: entry.item.emoji,
                subtitle: `${
                  entry.item.side === 'white' ? '⬜ Bé cầm Trắng' : '⬛ Bé cầm Đen'
                } · ${entry.item.gm}`,
                completed: entry.completed,
                unlocked: entry.unlocked,
              }))}
              activeId={opening.id}
              onSelect={setOpeningId}
              title="Bản đồ chinh phục khai cuộc"
              unitLabel="bài"
              allDoneMessage="Bé đã phá đảo toàn bộ khai cuộc Đại Kiện Tướng! 🏆"
            />
          </div>
        </Panel>

        <Panel className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              options={MODES.map((m) => ({
                value: m.value,
                label:
                  m.value === 'memorize' ? `Luyện ${totalKidMoves} bước` : m.label,
                icon: m.icon,
              }))}
              value={mode}
              onChange={setMode}
              size="sm"
            />
            <div className="relative">
              <EyeToggle on={heatmap} onToggle={() => setHeatmap((value) => !value)} />
            </div>
          </div>

          <ChessBoardPanel
            fen={fens[ply]}
            orientation={opening.side}
            playerSide={opening.side}
            interactive={interactive}
            heatmap={heatmap}
            arrows={arrow}
            extraSquareStyles={lastMoveSquares}
            onDrop={handleDrop}
          />

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'learn' ? (
              <>
                <KidButton
                  variant="ghost"
                  onClick={() => setPly((value) => Math.max(0, value - 1))}
                  disabled={ply === 0}
                >
                  ◀ Lùi
                </KidButton>
                <KidButton
                  variant="sun"
                  onClick={() => setPly((value) => Math.min(opening.moves.length, value + 1))}
                  disabled={ply >= opening.moves.length}
                >
                  Tiến ▶
                </KidButton>
                <KidButton
                  variant={autoPlay ? 'rose' : 'grass'}
                  onClick={() => setAutoPlay((value) => !value)}
                >
                  {autoPlay ? '⏸ Dừng' : '▶️ Tự chạy'}
                </KidButton>
                <KidButton variant="ghost" onClick={() => setPly(0)}>
                  🔄 Đầu
                </KidButton>
              </>
            ) : (
              <>
                <KidButton
                  variant="sky"
                  onClick={() => setHintVisible(true)}
                  disabled={hintVisible || ply >= opening.moves.length}
                >
                  💡 Gợi ý
                </KidButton>
                {mode === 'speed' && (
                  <KidButton variant="grass" onClick={startSpeedRun}>
                    {running ? '🔁 Đua lại' : '🚀 Bắt đầu 30s'}
                  </KidButton>
                )}
                <KidButton variant="ghost" onClick={() => { setPly(0); setHintVisible(false); setWrongInfo(null); setFinished(false); setRunning(false); setSecondsLeft(SPEED_SECONDS); setSpeedScore(0); awardedRef.current = false }}>
                  🔄 Chơi lại
                </KidButton>
              </>
            )}
          </div>

          {mode === 'speed' && (
            <div className="rounded-2xl bg-violet-50 p-2.5">
              <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-violet-700">
                <span>⏱️ Còn {secondsLeft.toFixed(1)}s</span>
                <span>
                  ✅ {speedScore}/{totalKidMoves} nước
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    countdownRatio < 0.3
                      ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                      : 'bg-gradient-to-r from-emerald-400 to-sky-400'
                  }`}
                  style={{ width: `${Math.max(0, countdownRatio) * 100}%` }}
                />
              </div>
            </div>
          )}

          {opening.side === 'black' && (
            <p className="rounded-2xl bg-sky-50 px-3 py-2 text-center text-xs font-extrabold text-sky-700">
              🔄 Bàn cờ đã tự xoay 180° vì bé đang cầm quân Đen — hàng 7, 8 nằm sát bé rồi!
            </p>
          )}

          <MoveStrip
            opening={opening}
            ply={ply}
            notation={notation}
            onJump={mode === 'learn' ? (index) => setPly(index) : undefined}
          />
        </Panel>
      </div>

      {/* Cột phải: giải thích + tiến độ */}
      <div className="grid gap-3">
        <Panel>
          <SectionTitle
            icon={opening.emoji}
            title={`${opening.name} · ${opening.englishName}`}
            subtitle={`${opening.gm} — ${opening.tagline}`}
          />
          <div className="mt-3">
            {bannerState ? (
              <ExplanationBanner
                annotation={bannerState.annotation}
                plyIndex={bannerState.plyIndex}
                notation={notation}
                variant={bannerState.variant}
              />
            ) : (
              <div className="rounded-2xl border-[3px] border-dashed border-violet-200 bg-violet-50 p-4 text-center text-sm font-bold text-violet-500">
                🐣 Bé hãy kéo quân để bắt đầu bài học nhé!
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            icon="🎯"
            title={`Mục tiêu: thuộc ${totalKidMoves} nước`}
            subtitle={
              mode === 'learn'
                ? 'Bấm Tiến để xem từng nước kèm khẩu quyết vè.'
                : mode === 'speed'
                  ? 'Xếp đúng càng nhiều nước càng tốt trong 30 giây!'
                  : 'Bé kéo thả đúng từng nước để nhận Cúp Vàng 🏆.'
            }
          />
          <div className="mt-3 grid gap-2">
            {opening.moves
              .map((move, index) => ({ move, index }))
              .filter(({ index }) => isKidPly(index))
              .map(({ move, index }, order) => {
                const done = ply > index
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 transition-all ${
                      done
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-violet-100 bg-white'
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                        done ? 'bg-emerald-500 text-white' : 'bg-violet-100 text-violet-600'
                      }`}
                    >
                      {done ? '✓' : order + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-violet-900">
                        {move.annotation?.rhyme ?? move.san}
                      </div>
                      <div className="truncate text-[0.7rem] font-bold text-violet-500">
                        {move.annotation?.reason ?? ''}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
          <p className="mt-3 text-center text-xs font-bold text-violet-400">
            ⭐ Mỗi bài thuộc lòng mang về Cúp Vàng + 6 sao, đua tốc độ thắng tới +10 sao!
          </p>
        </Panel>
      </div>

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🏆'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        stars={result?.stars ?? 0}
        onClose={() => setResult(null)}
        onRetry={() => {
          setResult(null)
          setPly(0)
          setFinished(false)
          setHintVisible(mode === 'learn')
          setWrongInfo(null)
          setAutoPlay(false)
          setRunning(false)
          setSecondsLeft(SPEED_SECONDS)
          setSpeedScore(0)
          awardedRef.current = false
        }}
      />
    </div>
  )
}
