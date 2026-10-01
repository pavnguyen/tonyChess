import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { TACTIC_META } from '../data/tactics'
import { useTacticsQuery } from '../data/queries'
import { useChessGame } from '../hooks/useChessGame'
import { pieceFromSan } from '../lib/notation'
import { playError, playMove, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { MoveAnnotation, TacticPuzzle, TacticType } from '../types'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const TYPE_OPTIONS: { value: TacticType; label: string; icon: string }[] = [
  { value: 'fork', label: 'Bắt đôi', icon: '🍴' },
  { value: 'pin', label: 'Ghim quân', icon: '📌' },
  { value: 'skewer', label: 'Xiên quân', icon: '🍢' },
]

const listForType = (puzzles: TacticPuzzle[], type: TacticType) =>
  puzzles.filter((item) => item.type === type)

export function TacticsPage() {
  const { data: puzzles, isLoading } = useTacticsQuery()
  const { notation, completeActivity, isCompleted, soundOn } = useKidProgress()

  const [type, setType] = useState<TacticType>('fork')
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'solve' | 'solved'>('solve')
  const [wrongTries, setWrongTries] = useState(0)
  const [hint, setHint] = useState(false)
  const [heatmap, setHeatmap] = useState(false)
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

  const board = useChessGame(puzzle?.fen ?? START_FEN, 'white')

  // Đổi bài → trả về trạng thái ban đầu.
  useEffect(() => {
    setPhase('solve')
    setWrongTries(0)
    setHint(false)
  }, [puzzle?.id])

  // Sau khi giải xong, cho bé "tung hoành": đối thủ đi ngẫu nhiên.
  useEffect(() => {
    if (phase !== 'solved') return
    if (board.playerToMove) return
    if (board.game.isGameOver()) return
    const timer = setTimeout(() => board.autoReply(), 700)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, board.playerToMove, board.sans.length])

  const solutionArrow = useMemo(() => {
    if (!puzzle || phase === 'solved' || !hint) return []
    try {
      const probe = new Chess(puzzle.fen)
      const move = probe.move(puzzle.solution)
      return [{ startSquare: move.from, endSquare: move.to, color: '#f59e0b' }]
    } catch {
      return []
    }
  }, [puzzle, hint, phase])

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
  }

  const nextPuzzle = () => {
    if (!list.length) return
    setIndex((value) => (value + 1) % list.length)
  }

  const handleDrop = (from: string, to: string): boolean => {
    // Chế độ tự do sau khi đã giải xong.
    if (!puzzle || phase === 'solved') {
      const move = board.playMove(from, to)
      if (!move) return false
      if (soundOn) playMove()
      return true
    }

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
    setWrongTries((value) => value + 1)
    setHint(true)
    return false
  }

  const solved = phase === 'solved'
  const solvedCount = (puzzles ?? []).filter(
    (item) => item.type === type && isCompleted(`tactics:${item.id}`),
  ).length
  const activeMeta = TACTIC_META[type]

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      <div className="grid gap-3">
        <Panel>
          <SectionTitle
            icon="⚔️"
            title="Trung cuộc — Mẹo săn quân"
            subtitle="Nhìn ra đòn hiểm, bắt quân đối thủ thật ngọt!"
          />
          <div className="mt-3">
            <Segmented
              options={TYPE_OPTIONS}
              value={type}
              onChange={(value) => goTo(value)}
              size="sm"
            />
          </div>
        </Panel>

        <Panel className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-extrabold text-violet-700">
                Thế cờ {safeIndex + 1}/{list.length}
              </span>
              {puzzle && isCompleted(`tactics:${puzzle.id}`) && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-700">
                  🏅 Đã giải
                </span>
              )}
            </div>
            <EyeToggle on={heatmap} onToggle={() => setHeatmap((value) => !value)} />
          </div>

          {isLoading || !puzzle ? (
            <div className="aspect-square w-full animate-pulse rounded-[1.4rem] bg-violet-100" />
          ) : (
            <ChessBoardPanel
              fen={board.fen}
              orientation="white"
              playerSide="white"
              interactive={board.playerToMove && !board.game.isGameOver()}
              heatmap={heatmap}
              arrows={solutionArrow}
              extraSquareStyles={
                board.lastMove
                  ? {
                      [board.lastMove.from]: {
                        boxShadow: 'inset 0 0 0 3px rgba(250, 204, 21, 0.95)',
                      },
                      [board.lastMove.to]: {
                        boxShadow: 'inset 0 0 0 4px rgba(250, 204, 21, 0.95)',
                      },
                    }
                  : undefined
              }
              onDrop={handleDrop}
            />
          )}

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
            <p className="animate-pop-in rounded-2xl bg-rose-50 px-3 py-2 text-center text-sm font-extrabold text-rose-600">
              🤔 Chưa trúng rồi! Bé nhìn mũi tên vàng rồi thử nước khác nhé.
            </p>
          )}
          {solved && (
            <p className="animate-pop-in rounded-2xl bg-emerald-50 px-3 py-2 text-center text-sm font-extrabold text-emerald-700">
              🎉 Giải xong rồi! Giờ bé thử bắt thêm quân cho vui — đối thủ sẽ tự đi.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-3">
        <Panel>
          <SectionTitle
            icon={activeMeta.emoji}
            title={activeMeta.label}
            subtitle={`Bé đã giải ${solvedCount}/${list.length} bài`}
          />
          <p className="mt-3 rounded-2xl bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700">
            {activeMeta.blurb}
          </p>
          {puzzle && (
            <div className="mt-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-2">
              <div className="text-xs font-extrabold uppercase text-amber-600">
                🎯 Nhiệm vụ của bé
              </div>
              <div className="text-base font-extrabold text-amber-900">{puzzle.title}</div>
              {wrongTries > 0 && (
                <div className="mt-1 text-xs font-bold text-amber-700">💡 {puzzle.hint}</div>
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
          <SectionTitle
            icon="📚"
            title="Thư viện đòn hiểm"
            subtitle="Bé sưu tầm đủ 3 loại đòn nhé!"
          />
          <div className="mt-3 grid gap-2">
            {(puzzles ?? []).map((item) => {
              const itemSolved = isCompleted(`tactics:${item.id}`)
              const active = puzzle?.id === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.type, item)}
                  className={`flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left transition-all active:translate-y-[2px] ${
                    active
                      ? 'border-violet-400 bg-violet-50'
                      : 'border-violet-100 bg-white hover:border-violet-200'
                  }`}
                >
                  <span className="text-lg">{TACTIC_META[item.type].emoji}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-violet-900">
                    {item.title}
                  </span>
                  <span className="text-lg">{itemSolved ? '🏅' : '⬜'}</span>
                </button>
              )
            })}
          </div>
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
