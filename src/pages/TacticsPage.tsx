import { useSearch } from '@tanstack/react-router'
import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { ProgressMap } from '../components/ProgressMap'
import { ReviewStrip } from '../components/ReviewStrip'
import { BoardStage } from '../components/BoardStage'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useCurriculum } from '../hooks/useCurriculum'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { BEST_MOVE_THEMES } from '../data/bestMoves'
import { useTacticsQuery } from '../data/queries'
import { useArrowKeys } from '../hooks/useArrowKeys'
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

/** Thời gian máy "suy nghĩ" trước khi đi nước đáp trả trong chuỗi đánh tiếp. */
const REPLY_DELAY = 620

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
  /**
   * Số nửa nước của **lời giải** đã đi xong. Bé đi các nửa nước ở vị trí chẵn
   * (0, 2, 4…), máy tự đi các nửa nước ở vị trí lẻ (nước đáp trả).
   */
  const [lineIndex, setLineIndex] = useState(0)
  const [wrongTries, setWrongTries] = useState(0)
  const [hint, setHint] = useState(false)
  /**
   * Bé vừa bấm một thế cờ trên bản đồ → bàn cờ hiện **thế cờ đó** ở dạng XEM TRƯỚC
   * (không cho kéo quân, không lộ đáp án), rồi bấm “▶ Giải thế này” mới vào làm.
   */
  const [previewing, setPreviewing] = useState(false)
  const [confetti, setConfetti] = useState(false)
  /** Đang phát lại lời giải để bé xem cho nhớ. */
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

  /** Toàn bộ lời giải: nước hay nhất của bé + chuỗi "đánh tiếp" (nếu có). */
  const solutionLine = useMemo(
    () => (active ? [active.bestSan, ...(active.continuation ?? [])] : []),
    [active],
  )
  const hasContinuation = solutionLine.length > 1
  const solved = phase === 'solved'
  /** Đang chờ máy đáp trả (nửa nước lẻ) → tạm khoá bàn cờ. */
  const waitingReply = !solved && !previewing && lineIndex % 2 === 1
  const exampleSans = useRef(solutionLine)
  exampleSans.current = solutionLine

  const resetBoard = board.reset
  const resetRound = useCallback(() => {
    setPhase('solve')
    setLineIndex(0)
    setWrongTries(0)
    setHint(false)
    setPreviewing(false)
    setReplaying(false)
    setResult(null)
    setConfetti(false)
    resetBoard()
  }, [resetBoard])

  /** Nước mà BÉ cần đi tiếp theo (from → to), đọc từ chính thế cờ đang đứng. */
  const currentMove = useMemo(() => {
    if (!active || solved || lineIndex % 2 !== 0) return null
    const san = solutionLine[lineIndex]
    if (!san) return null
    try {
      const probe = new Chess(board.fen)
      const move = probe.move(san)
      return { from: move.from, to: move.to }
    } catch {
      return null
    }
  }, [active, board.fen, solutionLine, lineIndex, solved])

  /** Để phát lại, cần from → to của TỪNG nửa nước trong lời giải. */
  const replayMove = useMemo(() => {
    if (!active) return null
    try {
      const probe = new Chess(active.fen)
      const move = probe.move(active.bestSan)
      return { from: move.from, to: move.to }
    } catch {
      return null
    }
  }, [active])

  /** Chỉ lộ nước cần đi khi bé bấm 💡 (hoặc đi sai một lần). */
  const hintMove = hint && !solved ? currentMove : null
  const arrowMove = hintMove ?? (replaying ? replayMove : null)

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

  const announceSan = hintMove ? (solutionLine[lineIndex] ?? null) : null

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

  /** Bấm một thế trong khung "Ôn tập hôm nay": nhảy tới đúng chủ đề và vào làm luôn. */
  const reviewPuzzle = (completionId: string) => {
    const raw = completionId.replace(/^tactics:/, '')
    const target = (puzzles ?? []).find((item) => item.id === raw)
    if (target) goTo(target.theme, target)
  }

  const startSolving = () => {
    setPreviewing(false)
    resetRound()
  }

  /** Máy tự đi nước đáp trả ở các nửa nước lẻ của lời giải. */
  useEffect(() => {
    if (!active || solved || previewing || replaying) return
    if (lineIndex === 0 || lineIndex >= solutionLine.length) return
    if (lineIndex % 2 === 0) return
    const san = solutionLine[lineIndex]
    const timer = window.setTimeout(() => {
      board.playSan(san)
      setLineIndex((value) => value + 1)
    }, REPLY_DELAY)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex, active, solved, previewing, replaying])

  // Phát lại lời giải: lần lượt đi từng nửa nước (bàn cờ đã được reset trước đó).
  const boardRef = useRef(board)
  boardRef.current = board
  useEffect(() => {
    if (replayToken === 0 || !active || !replaying) return
    const timers: number[] = []
    exampleSans.current.forEach((san, ply) => {
      timers.push(
        window.setTimeout(
          () => boardRef.current.playSan(san),
          360 + ply * REPLY_DELAY,
        ),
      )
    })
    timers.push(
      window.setTimeout(
        () => setReplaying(false),
        360 + exampleSans.current.length * REPLY_DELAY,
      ),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replayToken, active, replaying])

  const replaySolution = () => {
    if (!active || replaying) return
    setReplaying(true)
    setLineIndex(solutionLine.length)
    board.reset()
    setReplayToken((value) => value + 1)
  }

  /** Sang thế cờ kế tiếp (nút ➡️ hoặc phím ▶ / ▲). */
  const nextPuzzle = useCallback(() => {
    const total = curriculum.length
    if (!total) return
    for (let step = 1; step <= total; step += 1) {
      const candidate = (safeIndex + step) % total
      if (curriculum[candidate]?.unlocked) {
        setIndex(candidate)
        resetRound()
        return
      }
    }
  }, [curriculum, safeIndex, resetRound])

  /** Về thế cờ trước đó (nút ◀ hoặc phím ◀ / ▼). */
  const prevPuzzle = useCallback(() => {
    const total = curriculum.length
    if (!total) return
    for (let step = 1; step <= total; step += 1) {
      const candidate = (safeIndex - step + total) % total
      if (curriculum[candidate]?.unlocked) {
        setIndex(candidate)
        resetRound()
        return
      }
    }
  }, [curriculum, safeIndex, resetRound])

  // ◀ ▼ về thế trước, ▶ ▲ sang thế kế tiếp - giống phím tắt ở tab Khai cuộc.
  useArrowKeys({ onPrev: prevPuzzle, onNext: nextPuzzle })

  const finishSolved = () => {
    if (!active) return
    setPhase('solved')
    setConfetti(true)
    if (soundOn) playWin()
    const firstTime = completeActivity(`tactics:${active.id}`, 4)
    setResult({
      emoji: hasContinuation ? '🏁' : '🎯',
      title: hasContinuation ? 'Đánh tiếp tuyệt vời!' : 'Nước hay nhất!',
      message: `${active.explanation} Khẩu quyết: “${active.rhyme}”.`,
      stars: firstTime ? 4 : 2,
    })
  }

  const handleDrop = (from: string, to: string): boolean => {
    if (!active || solved || previewing || replaying || waitingReply) return false
    if (lineIndex % 2 !== 0) return false

    const probe = new Chess(board.fen)
    let move
    try {
      move = probe.move({ from, to, promotion: 'q' })
    } catch {
      if (soundOn) playError()
      return false
    }

    const expected = solutionLine[lineIndex]
    // Nước đầu có thể chấp nhận vài nước "đồng hạng tốt" của engine; các nước trong
    // chuỗi đánh tiếp thì phải đúng nước đã được máy kiểm chứng.
    const accepted =
      move.san === expected || (lineIndex === 0 && active.goodMoves.includes(move.san))

    if (accepted) {
      board.playSan(move.san)
      if (soundOn) playMove()
      setHint(false)
      const next = lineIndex + 1
      setLineIndex(next)
      if (next >= solutionLine.length) finishSolved()
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
  const kidPlies = Math.ceil(solutionLine.length / 2)
  const kidStep = Math.min(Math.floor(lineIndex / 2) + 1, kidPlies)

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
              {hasContinuation && !solved && (
                <span
                  id="kid-tactic-step"
                  className="rounded-full bg-info-100 px-3 py-1 text-xs font-extrabold text-info-700"
                >
                  🏁 Nước {kidStep}/{kidPlies}
                </span>
              )}
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
                !previewing &&
                !waitingReply &&
                board.playerToMove &&
                !board.game.isGameOver() &&
                !solved &&
                !replaying
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
            {waitingReply && !previewing && (
              <p className="animate-pop-in rounded-2xl bg-info-50 px-3 py-2 text-center text-sm font-extrabold text-info-700">
                🤖 Máy đang đáp trả... bé chuẩn bị tìm nước tiếp theo nhé!
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
                disabled={hint || solved || previewing || waitingReply}
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
                  🔁 Xem lại lời giải
                </KidButton>
              )}
              <KidButton
                id="kid-tactic-prev"
                variant="ghost"
                onClick={prevPuzzle}
                title="Về thế cờ trước (hoặc bấm phím ◀ / ▼)"
                aria-keyshortcuts="ArrowLeft ArrowDown"
              >
                ◀ Thế trước
              </KidButton>
              <KidButton
                id="kid-tactic-next"
                variant="primary"
                onClick={nextPuzzle}
                title="Sang thế cờ kế tiếp (hoặc bấm phím ▶ / ▲)"
                aria-keyshortcuts="ArrowRight ArrowUp"
              >
                ➡️ Thế cờ tiếp
              </KidButton>
              <KidButton
                variant="ghost"
                onClick={() => {
                  board.reset()
                  resetRound()
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
                🖐️ Kéo quân của bé vào ô bé muốn · 💡 bí quá thì bấm Gợi ý · ⌨️ ◀ ▶ ▲ ▼ để
                đổi thế cờ
              </p>
            )}
          </>
        }
      />

      {/*
        Cột phải xếp theo đúng thứ tự bé làm việc: chọn CHỦ ĐỀ → chọn THẾ CỜ trên
        bản đồ → đọc lời giải → ôn tập. Bản đồ nằm NGAY dưới khung chọn chủ đề (và
        sát bàn cờ) nên bé luôn thấy mình đang đứng ở ô nào của chủ đề.
      */}
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
        </Panel>

        {/*
          Bản đồ thế cờ và THẾ CỜ ĐANG LÀM nằm chung một khung: ô sáng trên bản đồ
          và nhiệm vụ ngay bên dưới là cùng một thế cờ, bé nhìn một chỗ là hiểu mình
          đang ở đâu. Trước đây hai thứ này bị đẩy cách xa nhau nên khó theo dõi.
        */}
        <Panel id="kid-tactic-map" className="grid gap-2">
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

          {active && (
            <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-xs font-extrabold uppercase text-gold-600">
                  🎯 Nhiệm vụ của bé
                </span>
                {/* Nhắc lại đúng số thế cờ đang làm để bé nối ô sáng trên bản đồ
                    với con số trên thanh tiêu đề bàn cờ (không phải dò lại). */}
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[0.7rem] font-extrabold text-gold-700 ring-1 ring-gold-200">
                  Thế cờ {safeIndex + 1}/{list.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-gold-900">{active.title}</div>
              {hasContinuation && (
                <div className="mt-1 text-xs font-bold text-gold-700">
                  🏁 Thế này phải <b>đánh tiếp {kidPlies - 1}</b> nước nữa mới kết liễu đấy!
                </div>
              )}
              {wrongTries > 0 && (
                <div className="mt-1 text-xs font-bold text-gold-700">💡 {active.hint}</div>
              )}
            </div>
          )}
        </Panel>

        {puzzleAnnotation && !previewing && (hint || solved) ? (
          <ExplanationBanner
            annotation={puzzleAnnotation}
            plyIndex={0}
            notation={notation}
            variant={solved ? 'played' : 'hint'}
          />
        ) : (
          <Panel id="kid-tactic-think">
            <p className="text-sm font-bold text-brand-700">
              🧠 Bé nhìn xem Vua có an toàn không, quân nào đang bị tấn công và mình có thể chiếu hay bắt quân nào nhé.
            </p>
            <p className="mt-1 text-xs font-bold text-brand-500">
              💡 Lời giải chỉ hiện khi bé bấm Gợi ý hoặc giải xong, để bé tự suy nghĩ trước.
            </p>
          </Panel>
        )}

        <ReviewStrip
          items={(puzzles ?? []).map((item) => ({
            id: `tactics:${item.id}`,
            label: item.title,
          }))}
          onPick={reviewPuzzle}
        />
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
