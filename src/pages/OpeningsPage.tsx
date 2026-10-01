import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { MoveStrip } from '../components/MoveStrip'
import { HangingWarnings } from '../components/HangingWarnings'
import { ProgressMap } from '../components/ProgressMap'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { BoardStage } from '../components/BoardStage'
import { useArrowKeys } from '../hooks/useArrowKeys'
import { useCurriculum } from '../hooks/useCurriculum'
import { useOpeningsQuery } from '../data/queries'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  opponentAnnotation,
  pieceFromSan,
} from '../lib/notation'
import { playError, playMove, playTick, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { CSSProperties } from 'react'
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
  const { notation, completeActivity, soundOn } = useKidProgress()

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
    replyAfterDropRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, mode])

  /** Bé vừa kéo đúng ở chế độ học → cho đối thủ đáp trả ngay một nước. */
  const replyAfterDropRef = useRef(false)

  // Đối thủ tự đi trong 2 chế độ luyện. Ở chế độ "Học từng bước" đối thủ chỉ
  // đáp trả sau khi bé vừa kéo quân của mình, còn lúc bé bấm ◀ ▶ thì vẫn đi
  // từng nước để bé kịp nhìn.
  useEffect(() => {
    if (!opening || autoPlay) return
    if (ply >= opening.moves.length || isKidPly(ply)) return
    if (mode === 'learn' && !replyAfterDropRef.current) return
    const timer = setTimeout(() => {
      replyAfterDropRef.current = false
      setPly((value) => value + 1)
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoPlay, ply, opening])

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

  /**
   * Nước đi kế tiếp. `mine` = nước này thuộc về bé (bé cầm quân đi được), dùng
   * để tô sáng quân cần đi cho bé dễ kéo.
   */
  const hintMove = useMemo(() => {
    if (!opening || ply >= opening.moves.length) return null
    if (mode !== 'learn' && !isKidPly(ply)) return null
    try {
      const probe = new Chess(fens[ply])
      const move = probe.move(opening.moves[ply].san)
      return { from: move.from, to: move.to, mine: isKidPly(ply) }
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening, ply, mode, fens])

  const arrow = useMemo(
    () =>
      hintVisible && hintMove
        ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
        : [],
    [hintVisible, hintMove],
  )

  const lastMoveSquares = useMemo(() => {
    if (!opening || ply === 0) return undefined
    try {
      const probe = new Chess(fens[ply - 1])
      const move = probe.move(opening.moves[ply - 1].san)
      return {
        [move.from]: { boxShadow: BOARD_MARKS.lastMoveFrom },
        [move.to]: { boxShadow: BOARD_MARKS.lastMoveTo },
      }
    } catch {
      return undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening, ply, fens])

  /**
   * Tô sáng quân bé cần đi (viền vàng) và ô đích (viền xanh) - chỉ khi tới lượt
   * bé, để bé biết ngay phải kéo quân nào đi đâu.
   */
  const hintSquares = useMemo(() => {
    if (!hintVisible || !hintMove?.mine) return undefined
    return {
      [hintMove.from]: HINT_FROM_STYLE,
      [hintMove.to]: HINT_TO_STYLE,
    } satisfies Record<string, CSSProperties>
  }, [hintVisible, hintMove])

  /** Vệt vàng của nước vừa đi + vệt gợi ý quân cần đi. */
  const squareStyles = useMemo(
    () => (hintSquares ? { ...lastMoveSquares, ...hintSquares } : lastMoveSquares),
    [lastMoveSquares, hintSquares],
  )

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

  /** Tiến / Lùi một nước - dùng chung cho nút bấm và phím mũi tên. */
  const goStep = useCallback(
    (delta: number) => {
      if (!opening) return
      // Bé tự bấm tức là bé muốn tự điều khiển → dừng chế độ tự chạy.
      setAutoPlay(false)
      replyAfterDropRef.current = false
      // Đi lại từ đầu bằng nút ◀ ▶ thì bỏ luôn lời nhắc "nước chưa đúng".
      setWrongInfo(null)
      setPly((value) => Math.min(Math.max(0, value + delta), opening.moves.length))
    },
    [opening],
  )

  const goBack = useCallback(() => goStep(-1), [goStep])
  const goForward = useCallback(() => goStep(1), [goStep])

  // ◀ ▼ lùi, ▶ ▲ tiến - chỉ trong chế độ “Học từng bước”.
  useArrowKeys({ enabled: mode === 'learn', onPrev: goBack, onNext: goForward })

  if (isLoading || !opening) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
      </div>
    )
  }

  // Tới lượt bé thì bé kéo-thả quân của mình (chế độ thi đua chỉ tính khi
  // đồng hồ đang chạy). Học từng bước cũng cho kéo-thả như hai chế độ kia.
  const kidTurn = isKidPly(ply) && ply < opening.moves.length
  const interactive =
    mode === 'memorize' || mode === 'learn'
      ? kidTurn
      : mode === 'speed'
        ? running && kidTurn
        : false

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
    // Chế độ học luôn giữ gợi ý sáng để bé đi tiếp nước sau.
    if (mode === 'learn') {
      replyAfterDropRef.current = true
    } else {
      setHintVisible(false)
    }
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
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái CHỈ có bàn cờ + băng giải thích → bàn cờ luôn to hết cỡ. */}
      <BoardStage
        reserve={268}
        board={
          <ChessBoardPanel
            fen={fens[ply]}
            orientation={opening.side}
            playerSide={opening.side}
            interactive={interactive}
            heatmap={heatmap}
            arrows={arrow}
            extraSquareStyles={squareStyles}
            onDrop={handleDrop}
          />
        }
        under={
          /* Banner Giải Thích Siêu Ngắn luôn nằm NGAY DƯỚI bàn cờ. */
          bannerState ? (
            <ExplanationBanner
              annotation={bannerState.annotation}
              plyIndex={bannerState.plyIndex}
              notation={notation}
              variant={bannerState.variant}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-2.5 text-center text-sm font-bold text-brand-500">
              🐣 Bé hãy kéo quân để bắt đầu bài học nhé!
            </div>
          )
        }
      />

      {/* Cột phải: tab chế độ, bản đồ leo cấp, điều khiển, mục tiêu… (tự cuộn) */}
      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <SectionTitle
            icon="🛡️"
            title="Khai cuộc Đại Kiện Tướng"
            subtitle={`Đang học: ${opening.name} · ${opening.gm}`}
          />
          <Segmented
            options={MODES.map((m) => ({
              value: m.value,
              label: m.value === 'memorize' ? `Luyện ${totalKidMoves} bước` : m.label,
              icon: m.icon,
            }))}
            value={mode}
            onChange={setMode}
            size="sm"
          />
          <div className="relative">
            <EyeToggle on={heatmap} onToggle={() => setHeatmap((value) => !value)} />
          </div>
        </Panel>

        <Panel>
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
        </Panel>

        <Panel className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'learn' ? (
              <>
                <KidButton
                  variant="ghost"
                  onClick={goBack}
                  disabled={ply === 0}
                  title="Lùi một nước (hoặc bấm phím ◀ / ▼)"
                  aria-keyshortcuts="ArrowLeft ArrowDown"
                >
                  ◀ Lùi
                </KidButton>
                <KidButton
                  variant="sun"
                  onClick={goForward}
                  disabled={ply >= opening.moves.length}
                  title="Tiến một nước (hoặc bấm phím ▶ / ▲)"
                  aria-keyshortcuts="ArrowRight ArrowUp"
                >
                  Tiến ▶
                </KidButton>
                <KidButton
                  variant={autoPlay ? 'rose' : 'grass'}
                  onClick={() => setAutoPlay((value) => !value)}
                >
                  {autoPlay ? '⏸ Dừng' : '▶️ Tự chạy'}
                </KidButton>
                <KidButton
                  variant="ghost"
                  onClick={() => {
                    replyAfterDropRef.current = false
                    setAutoPlay(false)
                    setPly(0)
                  }}
                >
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
                <KidButton variant="ghost" onClick={() => { replyAfterDropRef.current = false; setPly(0); setHintVisible(false); setWrongInfo(null); setFinished(false); setRunning(false); setSecondsLeft(SPEED_SECONDS); setSpeedScore(0); awardedRef.current = false }}>
                  🔄 Chơi lại
                </KidButton>
              </>
            )}
          </div>

          {mode === 'learn' && (
            <p className="text-[0.7rem] font-bold text-brand-400">
              🖐️ Kéo quân viền vàng sang viền xanh · ⌨️ hoặc bấm ◀ ▶ ▲ ▼
            </p>
          )}

          {mode === 'speed' && (
            <div className="rounded-2xl bg-brand-50 p-2.5">
              <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-brand-700">
                <span>⏱️ Còn {secondsLeft.toFixed(1)}s</span>
                <span>
                  ✅ {speedScore}/{totalKidMoves} nước
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full transition-all duration-100 ${
                    countdownRatio < 0.3
                      ? 'bg-gradient-to-r from-coral-500 to-coral-400'
                      : 'bg-gradient-to-r from-leaf-400 to-info-400'
                  }`}
                  style={{ width: `${Math.max(0, countdownRatio) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Panel>

        <HangingWarnings fen={fens[ply]} viewpoint={opening.side} enabled={heatmap} />

        <Panel className="grid gap-2">
          <SectionTitle
            icon={opening.emoji}
            title={`${opening.name} · ${opening.englishName}`}
            subtitle={`${opening.gm} - ${opening.tagline}`}
          />

          {opening.side === 'black' && (
            <p className="rounded-xl bg-info-50 px-2.5 py-1.5 text-center text-[0.7rem] font-extrabold text-info-700">
              🔄 Bàn cờ đã tự xoay 180° vì bé đang cầm quân Đen - hàng 7, 8 nằm sát bé rồi!
            </p>
          )}

          <MoveStrip
            opening={opening}
            ply={ply}
            notation={notation}
            onJump={mode === 'learn' ? (index) => setPly(index) : undefined}
          />
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {opening.moves
              .map((move, index) => ({ move, index }))
              .filter(({ index }) => isKidPly(index))
              .map(({ move, index }, order) => {
                const done = ply > index
                return (
                  <span
                    key={index}
                    title={move.annotation?.reason ?? move.san}
                    className={`inline-flex items-center gap-1 rounded-xl border-2 px-2 py-1 text-[0.7rem] font-extrabold transition-all ${
                      done
                        ? 'border-leaf-300 bg-leaf-50 text-leaf-700'
                        : 'border-brand-200 bg-white text-brand-700'
                    }`}
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded-full text-[0.55rem] ${
                        done ? 'bg-leaf-500 text-white' : 'bg-brand-100 text-brand-600'
                      }`}
                    >
                      {done ? '✓' : order + 1}
                    </span>
                    {move.annotation?.rhyme ?? move.san}
                  </span>
                )
              })}
          </div>
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
          replyAfterDropRef.current = false
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
