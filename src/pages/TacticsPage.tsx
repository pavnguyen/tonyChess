import { Chess } from 'chess.js'
import { useMemo, useState } from 'react'
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
import { TACTIC_META } from '../data/tactics'
import { useTacticsQuery } from '../data/queries'
import { useChessGame } from '../hooks/useChessGame'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  pieceFromSan,
} from '../lib/notation'
import { reviewKey } from '../lib/review'
import { playError, playMove, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import { useReview } from '../store/review'
import type { MoveAnnotation, TacticPuzzle, TacticType } from '../types'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const TYPE_OPTIONS: { value: TacticType; label: string; icon: string }[] = [
  { value: 'fork', label: 'Bắt đôi', icon: '🍴' },
  { value: 'pin', label: 'Ghim quân', icon: '📌' },
  { value: 'skewer', label: 'Xiên quân', icon: '🍢' },
  { value: 'discovered', label: 'Đòn mở', icon: '🔓' },
  { value: 'double-check', label: 'Chiếu đôi', icon: '⚡' },
  { value: 'back-rank', label: 'Hàng cuối', icon: '🧱' },
  { value: 'smothered', label: 'Bí ngạt', icon: '🕸️' },
]

const listForType = (puzzles: TacticPuzzle[], type: TacticType) =>
  puzzles.filter((item) => item.type === type)

export function TacticsPage() {
  const { data: puzzles, isLoading } = useTacticsQuery()
  const { notation, completeActivity, isCompleted, soundOn } = useKidProgress()
  const { record } = useReview()
  const { on: heatmap, toggle: toggleHeatmap, checkMode } = useEyeCheck()

  const [type, setType] = useState<TacticType>('fork')
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'solve' | 'solved'>('solve')
  const [wrongTries, setWrongTries] = useState(0)
  const [hint, setHint] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)

  const list = useMemo(() => listForType(puzzles ?? [], type), [puzzles, type])
  const safeIndex = list.length ? Math.min(index, list.length - 1) : 0
  const puzzle = list[safeIndex]

  // Bản đồ leo cấp cho từng loại đòn.
  const curriculum = useCurriculum(list, 'tactics')

  const board = useChessGame(puzzle?.fen ?? START_FEN, 'white')

  // Đổi bài → trả về trạng thái ban đầu. Gọi từ chính sự kiện đổi bài để tránh
  // setState trong effect (React chỉ khuyến khích effect để đồng bộ hệ thống ngoài).
  const resetRound = () => {
    setPhase('solve')
    setWrongTries(0)
    setHint(false)
  }

  const solved = phase === 'solved'

  /**
   * Nước giải của thế cờ - chỉ lộ ra khi bé bấm 💡 Gợi ý (hoặc đi sai một lần),
   * để bài đố vẫn còn là bài đố. `null` = không gợi ý gì.
   */
  const hintMove = useMemo(() => {
    if (!puzzle || solved || !hint) return null
    try {
      const probe = new Chess(puzzle.fen)
      const move = probe.move(puzzle.solution)
      return { from: move.from, to: move.to }
    } catch {
      return null
    }
  }, [puzzle, hint, solved])

  const solutionArrow = useMemo(
    () =>
      hintMove
        ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
        : [],
    [hintMove],
  )

  /**
   * Tô sáng QUÂN CẦN ĐI (viền vàng) và Ô ĐÍCH (viền xanh) - giống hệt tab Khai
   * cuộc, để bé 7 tuổi nhìn là biết phải kéo quân nào đi đâu.
   */
  const hintSquares = useMemo(() => {
    if (!hintMove) return undefined
    return {
      [hintMove.from]: HINT_FROM_STYLE,
      [hintMove.to]: HINT_TO_STYLE,
    }
  }, [hintMove])

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

  /** Vệt nước vừa đi + vệt gợi ý quân cần đi (gợi ý đè lên vệt cũ). */
  const squareStyles = useMemo(
    () => (hintSquares ? { ...lastMoveSquares, ...hintSquares } : lastMoveSquares),
    [lastMoveSquares, hintSquares],
  )

  const puzzleAnnotation: MoveAnnotation | null = useMemo(
    () =>
      puzzle
        ? {
            san: puzzle.solution,
            piece: pieceFromSan(puzzle.solution),
            reason: puzzle.explanation,
            rhyme: puzzle.rhyme,
          }
        : null,
    [puzzle],
  )

  const goTo = (nextType: TacticType, nextPuzzle?: TacticPuzzle) => {
    setType(nextType)
    const nextList = listForType(puzzles ?? [], nextType)
    setIndex(nextPuzzle ? Math.max(0, nextList.findIndex((item) => item.id === nextPuzzle.id)) : 0)
    resetRound()
  }

  /** Sang bài kế tiếp đã được mở khoá (bỏ qua bài còn khoá). */
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
    // Giải xong rồi thì dừng ván - bé bấm ➡️ Bài tiếp để sang câu mới.
    if (!puzzle || phase === 'solved') return false

    const probe = new Chess(board.fen)
    let move
    try {
      move = probe.move({ from, to, promotion: 'q' })
    } catch {
      if (soundOn) playError()
      return false
    }

    if (move.san === puzzle.solution) {
      board.playSan(move.san)
      if (soundOn) playMove()
      setPhase('solved')
      setConfetti(true)
      if (soundOn) playWin()
      record(reviewKey('tactic', puzzle.id), true)
      const firstTime = completeActivity(`tactics:${puzzle.id}`, 4)
      setResult({
        emoji: '🎆',
        title: 'Đòn tuyệt đỉnh!',
        message: `${puzzle.explanation} Khẩu quyết: “${puzzle.rhyme}”.`,
        stars: firstTime ? 4 : 2,
      })
      return true
    }

    if (soundOn) playError()
    record(reviewKey('tactic', puzzle.id), false)
    setWrongTries((value) => value + 1)
    setHint(true)
    return false
  }

  const solvedCount = (puzzles ?? []).filter(
    (item) => item.type === type && isCompleted(`tactics:${item.id}`),
  ).length
  const activeMeta = TACTIC_META[type]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái CHỈ có bàn cờ + nút điều khiển → bàn cờ luôn to hết cỡ. */}
      <BoardStage
        reserve={232}
        top={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700">
                Thế cờ {safeIndex + 1}/{list.length}
              </span>
              {puzzle && isCompleted(`tactics:${puzzle.id}`) && (
                <span className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-extrabold text-leaf-700">
                  🏅 Đã giải
                </span>
              )}
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} checkMode={checkMode} />
          </>
        }
        board={
          isLoading || !puzzle ? (
            <div className="aspect-square w-full animate-pulse rounded-[1.4rem] bg-brand-100" />
          ) : (
            <ChessBoardPanel
              fen={board.fen}
              orientation="white"
              playerSide="white"
              interactive={board.playerToMove && !board.game.isGameOver() && !solved}
              heatmap={heatmap}
              arrows={solutionArrow}
              extraSquareStyles={squareStyles}
              onDrop={handleDrop}
            />
          )
        }
        under={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <KidButton variant="sky" onClick={() => setHint(true)} disabled={hint || solved}>
                💡 Gợi ý
              </KidButton>
              <KidButton variant="primary" onClick={nextPuzzle}>
                ➡️ Bài tiếp
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
                🤔 Chưa trúng rồi! Bé nhìn 👉 quân viền VÀNG đưa sang ô viền XANH rồi thử lại nhé.
              </p>
            )}
            {solved ? (
              <p className="animate-pop-in rounded-2xl bg-leaf-50 px-3 py-2 text-center text-sm font-extrabold text-leaf-700">
                🎉 Giải xong rồi! Bé bấm ➡️ Bài tiếp để sang câu mới nhé.
              </p>
            ) : (
              <p className="text-[0.7rem] font-bold text-brand-400">
                🖐️ Kéo quân của bé vào ô bé muốn · 💡 bí quá thì bấm Gợi ý
              </p>
            )}
          </>
        }
      />

      {/* Cột phải: tab loại đòn, nhiệm vụ, băng giải thích, bản đồ săn quân */}
      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <SectionTitle
            icon="⚔️"
            title="Trung cuộc - Mẹo săn quân"
            subtitle={`Bé đã giải ${solvedCount}/${list.length} bài ${activeMeta.label.toLowerCase()}`}
          />
          <Segmented
            options={TYPE_OPTIONS}
            value={type}
            onChange={(value) => goTo(value)}
            size="sm"
          />
          <p className="rounded-2xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
            {activeMeta.blurb}
          </p>
          {puzzle && (
            <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-3 py-2">
              <div className="text-xs font-extrabold uppercase text-gold-600">
                🎯 Nhiệm vụ của bé
              </div>
              <div className="text-base font-extrabold text-gold-900">{puzzle.title}</div>
              {wrongTries > 0 && (
                <div className="mt-1 text-xs font-bold text-gold-700">💡 {puzzle.hint}</div>
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
              emoji: TACTIC_META[type].emoji,
              subtitle: `Khẩu quyết: “${entry.item.rhyme}”`,
              completed: entry.completed,
              unlocked: entry.unlocked,
            }))}
            activeId={puzzle?.id}
            onSelect={(id) => {
              const target = list.find((item) => item.id === id)
              if (target) goTo(target.type, target)
            }}
            title="Bản đồ săn quân"
            unitLabel="thế cờ"
            allDoneMessage="Bé đã giải hết các thế cờ loại này - sang loại đòn khác thôi! 🏆"
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
        retryLabel="Bài tiếp"
      />
    </div>
  )
}
