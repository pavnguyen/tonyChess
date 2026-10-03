import { useSearch } from '@tanstack/react-router'
import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { ProgressMap } from '../components/ProgressMap'
import { BoardStage } from '../components/BoardStage'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useCurriculum } from '../hooks/useCurriculum'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { BEST_MOVE_THEMES } from '../data/bestMoves'
import { useTacticsQuery } from '../data/queries'
import { useChessGame } from '../hooks/useChessGame'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  pieceFromSan,
} from '../lib/notation'
import { playError, playMove, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { BestMoveTheme, BestMovePuzzle, MoveAnnotation } from '../types'

const TYPE_OPTIONS: { value: BestMoveTheme; label: string; icon: string }[] = (
  Object.keys(BEST_MOVE_THEMES) as BestMoveTheme[]
).map((theme) => ({
  value: theme,
  label: BEST_MOVE_THEMES[theme].label,
  icon: BEST_MOVE_THEMES[theme].emoji,
}))

/** Mở sẵn đúng chủ đề qua đường dẫn `/tactics?theme=...`. */
const isBestMoveTheme = (value: unknown): value is BestMoveTheme =>
  typeof value === 'string' && TYPE_OPTIONS.some((option) => option.value === value)

export function TacticsPage() {
  const { data: puzzles, isLoading } = useTacticsQuery()
  const { notation, completeActivity, isCompleted, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const search = useSearch({ from: '/tactics' })

  const [theme, setTheme] = useState<BestMoveTheme>(() =>
    isBestMoveTheme(search.theme) ? search.theme : 'attack',
  )
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'solve' | 'solved'>('solve')
  const [wrongTries, setWrongTries] = useState(0)
  const [hint, setHint] = useState(false)
  /**
   * Bé vừa bấm một thế cờ trên bản đồ → bàn cờ hiện **thế cờ đó** ở dạng XEM TRƯỚC
   * (không cho kéo quân, không lộ đáp án), rồi bấm “▶ Giải thế này” mới vào làm.
   */
  const [previewing, setPreviewing] = useState(false)
  const [confetti, setConfetti] = useState(false)
  /** Đang phát lại nước hay nhất để bé xem cho nhớ. */
  const [replaying, setReplaying] = useState(false)
  const [replayToken, setReplayToken] = useState(0)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)

  const list = useMemo(
    () => (puzzles ?? []).filter((item) => item.theme === theme),
    [puzzles, theme],
  )
  const safeIndex = list.length ? Math.min(index, list.length - 1) : 0
  const active: BestMovePuzzle | undefined = list[safeIndex]

  const curriculum = useCurriculum(list, 'tactics')
  const board = useChessGame(active?.fen ?? '8/8/8/8/8/8/8/K6k w - - 0 1', active?.side ?? 'white')

  const resetRound = () => {
    setPhase('solve')
    setWrongTries(0)
    setHint(false)
  }

  const solved = phase === 'solved'

  /** Nước hay nhất (from → to), đọc từ chính FEN nên luôn chính xác. */
  const solutionMove = useMemo(() => {
    if (!active) return null
    try {
      const probe = new Chess(active.fen)
      const move = probe.move(active.bestSan)
      return { from: move.from, to: move.to }
    } catch {
      return null
    }
  }, [active])

  /** Chỉ lộ nước hay nhất khi bé bấm 💡 (hoặc đi sai một lần). */
  const hintMove = useMemo(
    () => (solutionMove && !solved && hint ? solutionMove : null),
    [solutionMove, solved, hint],
  )

  const replaySolution = () => {
    if (!active || replaying) return
    setReplaying(true)
    board.reset()
    setReplayToken((value) => value + 1)
  }

  // Phải đợi qua một effect mới đi được nước (bàn cờ của lần render hiện tại đã giải rồi).
  useEffect(() => {
    if (replayToken === 0 || !active) return
    const timers: number[] = []
    timers.push(
      window.setTimeout(() => {
        board.playSan(active.bestSan)
        timers.push(window.setTimeout(() => setReplaying(false), 900))
      }, 380),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayToken])

  const arrowMove = hintMove ?? (replaying ? solutionMove : null)
  const solutionArrow = useMemo(
    () =>
      arrowMove
        ? [{ startSquare: arrowMove.from, endSquare: arrowMove.to, color: ARROW_COLOR }]
        : [],
    [arrowMove],
  )

  const hintSquares = useMemo(() => {
    if (!arrowMove) return undefined
    return {
      [arrowMove.from]: HINT_FROM_STYLE,
      [arrowMove.to]: HINT_TO_STYLE,
    }
  }, [arrowMove])

  const lastMoveSquares = useMemo(
    () =>
      board.lastMove
        ? {
            [board.lastMove.from]: { boxShadow: BOARD_MARKS.lastMoveFrom },
            [board.lastMove.to]: { boxShadow: BOARD_MARKS.lastMoveTo },
          }
        : undefined,
    [board.lastMove],
  )

  const squareStyles = useMemo(
    () => (hintSquares ? { ...lastMoveSquares, ...hintSquares } : lastMoveSquares),
    [lastMoveSquares, hintSquares],
  )

  const announceSan = hintMove ? (active?.bestSan ?? null) : null

  const puzzleAnnotation: MoveAnnotation | null = useMemo(
    () =>
      active
        ? {
            san: active.bestSan,
            piece: pieceFromSan(active.bestSan),
            reason: active.explanation,
            rhyme: active.rhyme,
          }
        : null,
    [active],
  )

  const goTo = (nextTheme: BestMoveTheme, nextPuzzle?: BestMovePuzzle) => {
    setTheme(nextTheme)
    setPreviewing(false)
    const nextList = (puzzles ?? []).filter((item) => item.theme === nextTheme)
    setIndex(
      nextPuzzle ? Math.max(0, nextList.findIndex((item) => item.id === nextPuzzle.id)) : 0,
    )
    resetRound()
  }

  /**
   * Bấm một thế trên bản đồ: chọn thế đó và cho bàn cờ hiện **thế cờ ấy** để nhìn
   * trước. KHÔNG lộ nước hay nhất - đáp án chỉ hiện khi bé bấm “▶ Giải thế này”
   * rồi tự tìm (hoặc bấm 💡 Gợi ý).
   */
  const selectPuzzle = (id: string) => {
    const target = list.find((item) => item.id === id)
    if (!target) return
    goTo(target.theme, target)
    setPreviewing(true)
  }

  /** Vào làm thế đang xem trước. */
  const startSolving = () => {
    setPreviewing(false)
    resetRound()
  }

  const nextPuzzle = () => {
    if (!curriculum.length) return
    for (let step = 1; step <= curriculum.length; step += 1) {
      const candidate = (safeIndex + step) % curriculum.length
      if (curriculum[candidate]?.unlocked) {
        setIndex(candidate)
        resetRound()
        return
      }
    }
  }

  const handleDrop = (from: string, to: string): boolean => {
    if (!active || phase === 'solved' || previewing) return false

    const probe = new Chess(board.fen)
    let move
    try {
      move = probe.move({ from, to, promotion: 'q' })
    } catch {
      if (soundOn) playError()
      return false
    }

    // Máy đã chấm sẵn danh sách nước giữ nguyên lợi thế → bé vào đúng "vùng tốt" là thắng.
    if (active.goodMoves.includes(move.san)) {
      board.playSan(move.san)
      if (soundOn) playMove()
      setPhase('solved')
      setConfetti(true)
      if (soundOn) playWin()
      const firstTime = completeActivity(`tactics:${active.id}`, 4)
      setResult({
        emoji: '🎯',
        title: 'Nước hay nhất!',
        message: `${active.explanation} Khẩu quyết: “${active.rhyme}”.`,
        stars: firstTime ? 4 : 2,
      })
      return true
    }

    if (soundOn) playError()
    setWrongTries((value) => value + 1)
    setHint(true)
    return false
  }

  const solvedCount = (puzzles ?? []).filter(
    (item) => item.theme === theme && isCompleted(`tactics:${item.id}`),
  ).length
  const activeMeta = BEST_MOVE_THEMES[theme]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      <BoardStage
        reserve={232}
        top={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700">
                Thế cờ {safeIndex + 1}/{list.length}
              </span>
              {active && isCompleted(`tactics:${active.id}`) && (
                <span className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-extrabold text-leaf-700">
                  🏅 Đã giải
                </span>
              )}
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} />
          </>
        }
        board={
          isLoading || !active ? (
            <div className="aspect-square w-full animate-pulse rounded-[1.4rem] bg-brand-100" />
          ) : (
            <ChessBoardPanel
              fen={board.fen}
              orientation={active.side}
              playerSide={active.side}
              interactive={
                !previewing && board.playerToMove && !board.game.isGameOver() && !solved && !replaying
              }
              heatmap={heatmap}
              arrows={previewing ? [] : solutionArrow}
              extraSquareStyles={previewing ? undefined : squareStyles}
              announce={announceSan}
              onDrop={handleDrop}
            />
          )
        }
        under={
          <>
            {previewing && active && (
              <p
                id="kid-tactic-preview-note"
                className="animate-pop-in rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-center text-sm font-extrabold text-brand-800"
              >
                👀 Bé đang xem thế cờ “{active.title}” — bấm “▶ Giải thế này” để tự tìm nước hay nhất nhé!
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {previewing && (
                <KidButton id="kid-tactic-start" variant="primary" onClick={startSolving}>
                  ▶ Giải thế này
                </KidButton>
              )}
              <KidButton
                variant="sky"
                onClick={() => setHint(true)}
                disabled={hint || solved || previewing}
              >
                💡 Gợi ý
              </KidButton>
              {solved && (
                <KidButton
                  id="kid-tactic-replay"
                  variant="sky"
                  size="sm"
                  onClick={replaySolution}
                  disabled={replaying}
                >
                  🔁 Xem lại nước hay nhất
                </KidButton>
              )}
              <KidButton variant="primary" onClick={nextPuzzle}>
                ➡️ Thế cờ tiếp
              </KidButton>
              <KidButton
                variant="ghost"
                onClick={() => {
                  board.reset()
                  setPhase('solve')
                  setWrongTries(0)
                  setHint(false)
                }}
              >
                🔄 Làm lại
              </KidButton>
            </div>

            {wrongTries > 0 && !solved && (
              <p className="animate-pop-in rounded-2xl bg-coral-50 px-3 py-2 text-center text-sm font-extrabold text-coral-600">
                🤔 Chưa phải nước mạnh nhất rồi! Bé nhìn 👉 quân viền VÀNG đưa sang ô viền XANH
                rồi thử lại nhé.
              </p>
            )}
            {solved ? (
              <p className="animate-pop-in rounded-2xl bg-leaf-50 px-3 py-2 text-center text-sm font-extrabold text-leaf-700">
                🎉 Chuẩn rồi! Bé bấm ➡️ Thế cờ tiếp để sang thế mới nhé.
              </p>
            ) : (
              <p className="text-[0.7rem] font-bold text-brand-400">
                🖐️ Kéo quân của bé vào ô bé muốn · 💡 bí quá thì bấm Gợi ý
              </p>
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <SectionTitle
            icon="⚔️"
            title="Trung cuộc - Tìm nước hay nhất"
            subtitle={`Bé đã tìm đúng ${solvedCount}/${list.length} thế ${activeMeta.label.toLowerCase()}`}
            info={`theme:${theme}`}
          />
          <Segmented
            options={TYPE_OPTIONS}
            value={theme}
            onChange={(value) => goTo(value)}
            size="sm"
          />
          <p className="rounded-2xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
            {activeMeta.blurb}
          </p>
          <p
            id="kid-tactic-when"
            className="rounded-2xl border-2 border-dashed border-brand-100 px-3 py-2 text-xs font-bold text-brand-600"
          >
            <b className="text-brand-800">🧭 Khi nào dùng?</b> {activeMeta.when}
          </p>
          <p className="rounded-2xl bg-leaf-50 px-3 py-2 text-[0.7rem] font-bold text-leaf-700">
            🤖 Nước tốt nhất của mỗi thế đều do <b>máy chấm sẵn</b> (đối chiếu engine) - bé cứ tìm
            nước giữ được lợi thế là đúng.
          </p>
          {active && (
            <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-3 py-2">
              <div className="text-xs font-extrabold uppercase text-gold-600">
                🎯 Nhiệm vụ của bé
              </div>
              <div className="text-base font-extrabold text-gold-900">{active.title}</div>
              {wrongTries > 0 && (
                <div className="mt-1 text-xs font-bold text-gold-700">💡 {active.hint}</div>
              )}
            </div>
          )}
        </Panel>

        {puzzleAnnotation && (
          <ExplanationBanner
            annotation={puzzleAnnotation}
            plyIndex={0}
            notation={notation}
            variant={solved ? 'played' : 'hint'}
          />
        )}

        <Panel>
          <ProgressMap
            nodes={curriculum.map((entry) => ({
              id: entry.item.id,
              level: entry.level,
              title: entry.item.title,
              emoji: activeMeta.emoji,
              subtitle: `Khẩu quyết: “${entry.item.rhyme}”`,
              completed: entry.completed,
              unlocked: entry.unlocked,
            }))}
            activeId={active?.id}
            onSelect={selectPuzzle}
            allowLockedPreview
            title="Bản đồ thế cờ"
            unitLabel="thế cờ"
            allDoneMessage="Bé đã tìm đúng hết các thế của chủ đề này - sang chủ đề khác thôi! 🏆"
          />
        </Panel>
      </div>

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🎉'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        stars={result?.stars ?? 0}
        onClose={() => setResult(null)}
        onRetry={() => {
          setResult(null)
          nextPuzzle()
        }}
        retryLabel="Thế cờ tiếp"
      />
    </div>
  )
}
