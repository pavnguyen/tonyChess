import { useSearch } from '@tanstack/react-router'
import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { BoardStage } from '../components/BoardStage'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { BEST_MOVE_THEMES } from '../data/bestMoves'
import { useTacticsQuery } from '../data/queries'
import {
  duePuzzleIds,
  freshPuzzleIds,
  loadRecords,
  recordResult,
  saveRecords,
} from '../lib/tacticsProgress'
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
  const { notation, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const search = useSearch({ from: '/tactics' })

  const [theme, setTheme] = useState<BestMoveTheme>(() =>
    isBestMoveTheme(search.theme) ? search.theme : 'win-material',
  )
  const [index, setIndex] = useState(0)
  /**
   * Lịch ôn từng thế (localStorage). Nhờ nó 50 thế không “giải xong là hết”: thế
   * đã giải đúng sẽ quay lại sau 3 / 7 / 21 ngày, thế đi sai thì hẹn mai.
   */
  const [records, setRecords] = useState(() => loadRecords())
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
  } | null>(null)

  const list = useMemo(
    () => (puzzles ?? []).filter((item) => item.theme === theme),
    [puzzles, theme],
  )
  const safeIndex = list.length ? Math.min(index, list.length - 1) : 0
  const active: BestMovePuzzle | undefined = list[safeIndex]

  /** Toàn bộ thế theo đúng thứ tự trong dữ liệu (mỗi chủ đề đã xếp dễ → khó). */
  const orderedIds = useMemo(() => (puzzles ?? []).map((item) => item.id), [puzzles])
  const dueIds = useMemo(() => duePuzzleIds(records, orderedIds), [records, orderedIds])
  /**
   * Việc hôm nay: ưu tiên thế tới hạn ôn, thiếu thì lấy thế mới (dễ trước) cho đủ 8.
   * Giới hạn 8 để một phiên luyện không kéo dài quá sức bé 7 tuổi.
   */
  const todayIds = useMemo(() => {
    const due = dueIds.slice(0, 8)
    if (due.length >= 3) return due
    const fresh = freshPuzzleIds(records, orderedIds).slice(0, 8 - due.length)
    return [...due, ...fresh]
  }, [dueIds, records, orderedIds])

  const board = useChessGame(active?.fen ?? '8/8/8/8/8/8/8/K6k w - - 0 1', active?.side ?? 'white')

  /** Toàn bộ lời giải: nước hay nhất của bé + chuỗi "đánh tiếp" (nếu có). */
  const solutionLine = useMemo(
    () => (active ? [active.bestSan, ...(active.continuation ?? [])] : []),
    [active],
  )
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
    const total = list.length
    if (!total) return
    setIndex((safeIndex + 1) % total)
    resetRound()
  }, [list.length, safeIndex, resetRound])

  /** Về thế cờ trước đó (nút ◀ hoặc phím ◀ / ▼). */
  const prevPuzzle = useCallback(() => {
    const total = list.length
    if (!total) return
    setIndex((safeIndex - 1 + total) % total)
    resetRound()
  }, [list.length, safeIndex, resetRound])

  // ◀ ▼ về thế trước, ▶ ▲ sang thế kế tiếp - giống phím tắt ở tab Khai cuộc.
  useArrowKeys({ onPrev: prevPuzzle, onNext: nextPuzzle })

  const finishSolved = () => {
    if (!active) return
    // Giải sạch (không gợi ý, không đi sai) mới được coi là “thuộc”: hẹn xa hơn.
    const outcome = hint || wrongTries > 0 ? 'solved-with-help' : 'solved-clean'
    setRecords((current) => {
      const next = recordResult(current, active.id, outcome)
      saveRecords(next)
      return next
    })
    setPhase('solved')
    setConfetti(true)
    if (soundOn) playWin()
    setResult({
      emoji: '🏁',
      title: 'Đánh tiếp tuyệt vời!',
      message: `${active.explanation} Khẩu quyết: “${active.rhyme}”.`,
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
              {!solved && (
                <span
                  id="kid-tactic-step"
                  className="rounded-full bg-info-100 px-3 py-1 text-xs font-extrabold text-info-700"
                >
                  🏁 Nước {kidStep}/{kidPlies}
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
            {/*
              Một hàng nút GỌN dưới bàn cờ: cỡ `sm` + xuống hàng khi hẹp, nên 4 nút
              nằm chung một dòng trên máy tính và hai dòng đều tăm tắp trên điện
              thoại (trước đây để cỡ `md` nên nút to gần gấp rưỡi và tràn khỏi khung).
            */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {previewing && (
                <KidButton
                  id="kid-tactic-start"
                  variant="primary"
                  size="sm"
                  onClick={startSolving}
                >
                  ▶ Giải thế này
                </KidButton>
              )}
              <KidButton
                variant="sky"
                size="sm"
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
                size="sm"
                onClick={prevPuzzle}
                title="Về thế cờ trước (hoặc bấm phím ◀ / ▼)"
                aria-keyshortcuts="ArrowLeft ArrowDown"
              >
                ◀ Thế trước
              </KidButton>
              <KidButton
                id="kid-tactic-next"
                variant="primary"
                size="sm"
                onClick={nextPuzzle}
                title="Sang thế cờ kế tiếp (hoặc bấm phím ▶ / ▲)"
                aria-keyshortcuts="ArrowRight ArrowUp"
              >
                ➡️ Thế cờ tiếp
              </KidButton>
              <KidButton
                variant="ghost"
                size="sm"
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
              /* Dòng nhắc gộp còn hai vế ngắn, chữ nhỏ và sát nhau - đủ nhắc mà
                 không chiếm thêm một khối chữ dưới bàn cờ. */
              <p className="text-center text-xs font-bold leading-snug text-ink-600">
                🖐️ Kéo quân vào ô bé muốn · 💡 bí thì bấm Gợi ý · ⌨️ ◀ ▶ ▲ ▼ đổi thế cờ
              </p>
            )}
          </>
        }
      />

      {/*
        Cột phải xếp theo đúng thứ tự bé làm việc: chọn CHỦ ĐỀ → chọn THẾ CỜ →
        xem mẹo → đọc lời giải → ôn tập. Hai ô chọn nằm sát trên cùng nên đổi
        chủ đề/thế không phải cuộn qua phần giới thiệu.
      */}
      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <SectionTitle
            icon="⚔️"
            title="Trung cuộc - Tìm nước hay nhất"
            subtitle="Chọn chủ đề rồi tìm nước hay nhất cho mỗi thế cờ"
            info={`theme:${theme}`}
          />
          {/*
            Hàng chủ đề đứng TRƯỚC combo: bé chọn nhóm (trừng phạt quân treo, đồn
            hiểm ăn Hậu…) rồi mới chọn thế cờ trong nhóm đó - đúng thứ tự suy nghĩ,
            và cả hai ô chọn vẫn nằm sát trên cùng nên không phải cuộn.
          */}
          <Segmented
            options={TYPE_OPTIONS}
            value={theme}
            onChange={(value) => goTo(value)}
            size="sm"
          />
          {/*
            CHỌN THẾ BẰNG COMBO (cùng kiểu tab Đối phó / Tàn cuộc): bản đồ 10 ô
            trước đây chiếm 2 hàng ô vuông mà không cho biết ô nào là thế nào; combo
            cao đúng một dòng, mở ra là đọc được tên cả 10 thế theo thứ tự dễ → khó.
          */}
          <label
            htmlFor="kid-tactic-select"
            className="flex min-w-0 items-center gap-1.5 rounded-xl border-2 border-brand-200 bg-white px-2 py-1"
          >
            <span className="shrink-0 text-xs font-extrabold uppercase tracking-wide text-brand-500">
              Thế cờ
            </span>
            <select
              id="kid-tactic-select"
              value={active?.id ?? ''}
              onChange={(event) => selectPuzzle(event.target.value)}
              aria-label="Chọn thế cờ"
              className="min-w-0 flex-1 appearance-none truncate bg-transparent text-sm font-extrabold text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              {list.map((item, position) => (
                <option key={item.id} value={item.id} data-level-id={item.id}>
                  {position + 1}. {item.title}
                </option>
              ))}
            </select>
            <span aria-hidden className="shrink-0 text-brand-500">
              ▾
            </span>
          </label>
          <p className="rounded-2xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
            {activeMeta.blurb}
          </p>
          <p
            id="kid-tactic-when"
            className="rounded-2xl border-2 border-dashed border-brand-100 px-3 py-2 text-xs font-bold text-brand-600"
          >
            <b className="text-brand-800">🧭 Khi nào dùng?</b> {activeMeta.when}
          </p>
        </Panel>

        {/*
          Nhiệm vụ của thế đang làm: bé vừa chọn thế ở combo phía trên nên khung
          này chỉ cần nói ĐÚNG việc phải làm với thế đó.
        */}
        <Panel id="kid-tactic-map" className="grid gap-2">
          {active && (
            <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="text-xs font-extrabold uppercase text-gold-600">
                  🎯 Nhiệm vụ của bé
                </span>
                {/* Nhắc lại đúng số thế cờ đang làm để bé nối ô sáng trên bản đồ
                    với con số trên thanh tiêu đề bàn cờ (không phải dò lại). */}
                <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-extrabold text-gold-700 ring-1 ring-gold-200">
                  Thế cờ {safeIndex + 1}/{list.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-gold-900">{active.title}</div>
              <div className="mt-1 text-xs font-bold text-gold-700">
                🏁 Cả thế này là chuỗi <b>{kidPlies} nước</b>: bé đi, máy đáp, rồi bé đi
                tiếp mới thắng.
              </div>
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

        {/*
          Dải “Hôm nay”: thế đã tới hạn ôn (theo lịch 3/7/21 ngày) và thế mới, gộp
          trong một dòng. Bé không cần chọn chủ đề trước - bấm “Ôn ngay” là app tự
          mở đúng thế đang tới hạn. Đặt ở CUỐI cột: việc chính vẫn là chọn thế và
          giải, còn ôn tập là bước gợi ý nhẹ sau cùng.
        */}
        <div
          id="kid-tactic-today"
          className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-2.5 py-1.5"
        >
          <span className="min-w-0 flex-1 text-xs font-extrabold leading-tight text-gold-800">
            🎯 Hôm nay: {todayIds.length} thế{' '}
            {dueIds.length > 0
              ? `· ${dueIds.length} thế đã tới hạn ôn`
              : '· thế mới cho bé làm quen'}
          </span>
          <button
            type="button"
            id="kid-tactic-today-go"
            disabled={todayIds.length === 0}
            onClick={() => {
              const target = (puzzles ?? []).find((item) => item.id === todayIds[0])
              if (!target) return
              goTo(target.theme, target)
              setPreviewing(false)
            }}
            className="shrink-0 rounded-full border-2 border-gold-500 bg-white px-2 py-0.5 text-xs font-extrabold text-gold-800 transition-all hover:bg-gold-100 active:translate-y-[1px] disabled:opacity-50"
          >
            ▶ Ôn ngay
          </button>
        </div>
      </div>

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🎉'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
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
