import { useNavigate, useSearch } from '@tanstack/react-router'
import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { InfoButton } from '../components/InfoPopover'
import { ReviewStrip } from '../components/ReviewStrip'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useArrowKeys } from '../hooks/useArrowKeys'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { useCountersQuery } from '../data/queries'
import { ARROW_COLOR, BOARD_MARKS, pieceFromSan } from '../lib/notation'
import { playWin } from '../lib/sound'
import { useReportLesson } from '../store/lesson'
import { useKidProgress } from '../store/progress'
import type { CounterLesson, MoveAnnotation, Side } from '../types'

/** Đối thủ cầm màu nào - bé tự động cầm màu còn lại. */
const SIDE_OPTIONS: { value: Side; label: string; icon: string }[] = [
  { value: 'white', label: 'Đối thủ cầm Trắng', icon: '⬜' },
  { value: 'black', label: 'Đối thủ cầm Đen', icon: '⬛' },
]

const sideLabel = (side: Side) => (side === 'white' ? 'Trắng ⬜' : 'Đen ⬛')

/**
 * Nước mở đầu của ĐỐI THỦ trong một bài. Trắng luôn đi trước, nên nếu đối thủ cầm
 * Đen thì nước mở đầu của họ nằm ở ply 1 (sau nước đi đầu tiên của bé).
 */
function opponentFirstMove(lesson: CounterLesson): string | undefined {
  return lesson.opponentSide === 'white' ? lesson.moves[0]?.san : lesson.moves[1]?.san
}

/** Nhãn hiển thị cho nước mở đầu, ví dụ `1.d4` hoặc `1...Nf6`. */
function openingMoveLabel(lesson: CounterLesson): string {
  return `${lesson.opponentSide === 'white' ? '1.' : '1...'}${opponentFirstMove(lesson) ?? ''}`
}

export function CountersPage() {
  const { data: counters, isLoading } = useCountersQuery()
  const { notation, completeActivity, isCompleted, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const search = useSearch({ from: '/counters' })
  const navigate = useNavigate()

  /** Màu quân của ĐỐI THỦ; bé cầm màu ngược lại. */
  const [viewSide, setViewSide] = useState<Side>('white')
  const [lessonId, setLessonId] = useState('vs-london')
  const [ply, setPly] = useState(0)
  /** Lọc danh sách theo nước mở đầu của đối thủ (null = xem tất cả). */
  const [moveFilter, setMoveFilter] = useState<string | null>(null)
  const awardedRef = useRef(false)

  /**
   * Nhảy từ bài Khai cuộc sang: mở sẵn đúng bài đối phó tương ứng qua
   * `/counters?vs=vs-sicilian`. Chỉ chạy khi đường dẫn mang `?vs=…`.
   */
  useEffect(() => {
    if (!search.vs || !counters) return
    const target = counters.find((item) => item.id === search.vs)
    if (!target) return
    setViewSide(target.opponentSide)
    setLessonId(target.id)
    setMoveFilter(null)
  }, [search.vs, counters])

  const list = useMemo(
    () => (counters ?? []).filter((item) => item.opponentSide === viewSide),
    [counters, viewSide],
  )

  /**
   * Bộ lọc “gom theo nước mở đầu”: mỗi nước mở đầu khác nhau của đối thủ trong cột
   * đang xem thành một chip (ví dụ cùng `1.d4`: London / Gambit Hậu / Ấn Độ).
   */
  const moveFilters = useMemo(() => {
    const seen = new Map<string, string>()
    for (const item of list) {
      const move = opponentFirstMove(item)
      if (move && !seen.has(move)) seen.set(move, openingMoveLabel(item))
    }
    return [...seen.entries()].map(([move, label]) => ({ move, label }))
  }, [list])

  /** Danh sách sau khi lọc theo nước mở đầu đang chọn. */
  const visibleList = useMemo(
    () => (moveFilter ? list.filter((item) => opponentFirstMove(item) === moveFilter) : list),
    [list, moveFilter],
  )

  const lesson: CounterLesson | undefined =
    visibleList.find((item) => item.id === lessonId) ?? visibleList[0]

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang học bài đối phó nào.
  useReportLesson(lesson ? `counter:${lesson.id}` : null)

  /** Bé cầm màu ngược với đối thủ. */
  const kidSide: Side = lesson?.opponentSide === 'white' ? 'black' : 'white'
  const moves = useMemo(() => lesson?.moves ?? [], [lesson])
  const totalPlies = moves.length
  const atLeaf = ply >= totalPlies

  const isKidPly = useCallback(
    (index: number) => (lesson ? (kidSide === 'white' ? index % 2 === 0 : index % 2 === 1) : false),
    [lesson, kidSide],
  )

  /** FEN sau mỗi ply: fens[i] = thế cờ khi đã đi i nửa nước. */
  const fens = useMemo(() => {
    const game = new Chess()
    const out = [game.fen()]
    for (let index = 0; index < ply && index < totalPlies; index += 1) {
      try {
        game.move(moves[index].san)
      } catch {
        break
      }
      out.push(game.fen())
    }
    return out
  }, [moves, ply, totalPlies])

  // Đổi bài → quay lại xem từ nước đầu.
  useEffect(() => {
    setPly(0)
    awardedRef.current = false
  }, [lessonId])

  /** Bé xem hết cả dòng → ghi nhận đã hiểu bài đối phó này. */
  useEffect(() => {
    if (!lesson || ply === 0 || !atLeaf) return
    if (awardedRef.current) return
    awardedRef.current = true
    completeActivity(`counter:${lesson.id}`, 3)
    if (soundOn) playWin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, ply, atLeaf])

  /** Nước kế tiếp theo dòng: from → to để vẽ mũi tên gợi ý. */
  const hintMove = useMemo(() => {
    if (atLeaf) return null
    try {
      const probe = new Chess(fens[ply])
      const move = probe.move(moves[ply].san)
      return { from: move.from, to: move.to, mine: isKidPly(ply) }
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atLeaf, moves, ply, fens, isKidPly])

  const arrows = useMemo(
    () =>
      hintMove
        ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
        : [],
    [hintMove],
  )

  const lastMoveSquares = useMemo(() => {
    if (ply === 0) return undefined
    try {
      const probe = new Chess(fens[ply - 1])
      const move = probe.move(moves[ply - 1].san)
      return {
        [move.from]: { boxShadow: BOARD_MARKS.lastMoveFrom },
        [move.to]: { boxShadow: BOARD_MARKS.lastMoveTo },
      }
    } catch {
      return undefined
    }
  }, [ply, moves, fens])

  /** Băng giải thích: nước của bé thì lấy lời bình, nước đối thủ thì nhắc xem. */
  const bannerState = useMemo(() => {
    if (!lesson) return null
    if (ply === 0) {
      const san = moves[0]?.san
      if (!san) return null
      return {
        annotation: {
          san,
          piece: pieceFromSan(san),
          reason: 'Đối thủ mở màn như vậy - bé xem ý đồ rồi đáp lại nhé.',
          rhyme: 'Đối thủ vừa đi',
        },
        plyIndex: 0,
        variant: 'opponent' as const,
      }
    }
    const node = moves[ply - 1]
    if (!node) return null
    if (node.annotation) {
      return { annotation: node.annotation, plyIndex: ply - 1, variant: 'played' as const }
    }
    const annotation: MoveAnnotation = {
      san: node.san,
      piece: pieceFromSan(node.san),
      reason: 'Nước của đối thủ - bé xem rồi đáp lại nhé.',
      rhyme: 'Đối thủ vừa đi',
    }
    return { annotation, plyIndex: ply - 1, variant: 'opponent' as const }
  }, [lesson, moves, ply])

  const announceSan = ply > 0 ? (moves[ply - 1]?.san ?? null) : null

  /** Tiến / Lùi một nửa nước - dùng chung cho nút bấm và phím mũi tên. */
  const goStep = useCallback(
    (delta: number) => {
      setPly((current) => {
        const next = current + delta
        if (next < 0) return 0
        if (next > totalPlies) return totalPlies
        return next
      })
    },
    [totalPlies],
  )
  const goBack = useCallback(() => goStep(-1), [goStep])
  const goForward = useCallback(() => goStep(1), [goStep])

  // ◀ ▼ lùi, ▶ ▲ tiến - y như tab Khai cuộc.
  useArrowKeys({ onPrev: goBack, onNext: goForward })

  const changeSide = (next: Side) => {
    setViewSide(next)
    const first = (counters ?? []).find((item) => item.opponentSide === next)
    if (first) setLessonId(first.id)
    setPly(0)
    setMoveFilter(null)
  }

  const selectLesson = (id: string) => {
    setLessonId(id)
    setPly(0)
  }

  /** Bấm một bài trong khung “Ôn tập hôm nay”: nhảy tới đúng màu + bài đó. */
  const reviewLesson = (completionId: string) => {
    const raw = completionId.replace(/^counter:/, '')
    const target = (counters ?? []).find((item) => item.id === raw)
    if (!target) return
    setViewSide(target.opponentSide)
    setLessonId(target.id)
    setPly(0)
    setMoveFilter(null)
  }

  if (isLoading || !lesson) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
      </div>
    )
  }

  const kidStep = Math.floor(ply / 2)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <BoardStage
        reserve={248}
        top={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-coral-100 px-3 py-1 text-xs font-extrabold text-coral-700">
                🧭 Đối thủ: {lesson.emoji} {lesson.opponentOpening}
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700">
                Bé cầm {sideLabel(kidSide)}
              </span>
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} />
          </>
        }
        board={
          <ChessBoardPanel
            fen={fens[ply]}
            orientation={kidSide}
            playerSide={kidSide}
            interactive={false}
            heatmap={heatmap}
            arrows={arrows}
            extraSquareStyles={lastMoveSquares}
            announce={announceSan}
          />
        }
        under={
          <div className="grid gap-2">
            {bannerState ? (
              <ExplanationBanner
                annotation={bannerState.annotation}
                plyIndex={bannerState.plyIndex}
                notation={notation}
                variant={bannerState.variant}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-2.5 text-center text-sm font-bold text-brand-500">
                Bé bấm Tiến để xem đối thủ đi gì và mình đáp lại thế nào nhé!
              </div>
            )}
          </div>
        }
      />

      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <KidButton
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={ply === 0}
              title="Lùi một nước (hoặc bấm phím ◀ / ▼)"
              aria-keyshortcuts="ArrowLeft ArrowDown"
            >
              ◀ Lùi
            </KidButton>
            <KidButton
              variant="sun"
              size="sm"
              onClick={goForward}
              disabled={atLeaf}
              title="Tiến một nước (hoặc bấm phím ▶ / ▲)"
              aria-keyshortcuts="ArrowRight ArrowUp"
            >
              Tiến ▶
            </KidButton>
            <KidButton
              variant="ghost"
              size="sm"
              onClick={() => setPly(0)}
              disabled={ply === 0}
            >
              🔄 Đầu
            </KidButton>
          </div>
          <p className="text-[0.7rem] font-bold text-brand-400">
            {atLeaf && ply > 0
              ? '✅ Bé đã xem trọn dòng đối phó này!'
              : `👀 Đang xem nước ${kidStep} · ⌨️ hoặc bấm ◀ ▶ ▲ ▼`}
            <InfoButton topic="board" />
          </p>
        </Panel>

        <ReviewStrip
          items={(counters ?? []).map((item) => ({
            id: `counter:${item.id}`,
            label: `Đối phó: ${item.opponentOpening}`,
          }))}
          onPick={reviewLesson}
        />

        <Panel className="grid gap-2">
          <SectionTitle
            icon="🧭"
            title="Đối phó khai cuộc"
            subtitle="Đối thủ chơi gì - bé phá lại thế nào"
            info="counter"
          />
          <Segmented
            options={SIDE_OPTIONS}
            value={viewSide}
            onChange={changeSide}
            size="sm"
          />
          <p className="rounded-2xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
            👆 Bấm một khai cuộc của đối thủ để xem bé đáp lại ra sao - hoặc lọc theo nước mở đầu.
          </p>
          <div id="kid-counter-move-filter" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-move-filter="all"
              aria-pressed={moveFilter === null}
              onClick={() => setMoveFilter(null)}
              className={`rounded-full border-2 px-2.5 py-1 text-[0.7rem] font-extrabold transition-all active:translate-y-[1px] ${
                moveFilter === null
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-brand-100 bg-white text-brand-600 hover:border-brand-300'
              }`}
            >
              Tất cả
            </button>
            {moveFilters.map(({ move, label }) => {
              const active = moveFilter === move
              return (
                <button
                  key={move}
                  type="button"
                  data-move-filter={move}
                  aria-pressed={active}
                  onClick={() => {
                    setMoveFilter(move)
                    const first = list.find((item) => opponentFirstMove(item) === move)
                    if (first) setLessonId(first.id)
                  }}
                  className={`rounded-full border-2 px-2.5 py-1 text-[0.7rem] font-extrabold transition-all active:translate-y-[1px] ${
                    active
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-brand-100 bg-white text-brand-600 hover:border-brand-300'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div id="kid-counter-list" className="grid gap-1.5">
            {visibleList.map((item) => {
              const active = item.id === lesson.id
              const seen = isCompleted(`counter:${item.id}`)
              return (
                <button
                  key={item.id}
                  type="button"
                  data-counter-id={item.id}
                  aria-pressed={active}
                  onClick={() => selectLesson(item.id)}
                  className={`flex items-center gap-2 rounded-2xl border-2 px-2.5 py-2 text-left transition-all active:translate-y-[1px] ${
                    active
                      ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                      : 'border-brand-100 bg-white hover:border-brand-300'
                  }`}
                >
                  <span className="text-lg" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold text-brand-900">
                      {item.opponentOpening}
                    </span>
                    <span className="block truncate text-[0.7rem] font-bold text-brand-500">
                      {item.counterName}
                    </span>
                  </span>
                  {seen && (
                    <span className="shrink-0 text-sm" title="Bé đã xem bài này">
                      ✅
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel className="grid gap-2">
          <div className="text-xs font-extrabold uppercase tracking-wide text-coral-600">
            Đối thủ chơi
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-base font-extrabold text-brand-900">
              {lesson.emoji} {lesson.opponentOpening} ({sideLabel(lesson.opponentSide)})
            </div>
            {lesson.openingId && (
              <KidButton
                id="kid-counter-opening"
                variant="grass"
                size="sm"
                onClick={() =>
                  navigate({ to: '/', search: { opening: lesson.openingId } })
                }
                title="Mở bài khai cuộc gốc ở tab Khai cuộc"
              >
                📖 Mở bài khai cuộc gốc
              </KidButton>
            )}
          </div>
          <p
            id="kid-counter-opponent-plan"
            className="rounded-2xl bg-coral-50 px-3 py-2 text-xs font-bold text-coral-800 ring-1 ring-coral-200"
          >
            🕵️ <b className="text-coral-900">Đối thủ đang định làm gì?</b>{' '}
            {lesson.opponentPlan}
          </p>
          <div
            id="kid-counter-name"
            className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-3 py-2 text-sm font-extrabold text-gold-900"
          >
            🛡️ Cách đối phó của bé: {lesson.counterName}
          </div>
          <p id="kid-counter-idea" className="text-sm font-bold text-brand-700">
            {lesson.idea}
          </p>
          <div className="grid gap-1">
            <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              ✅ Bé cần làm
            </div>
            <ul id="kid-counter-points" className="grid gap-1">
              {lesson.points.map((point) => (
                <li key={point} className="flex gap-1.5 text-xs font-bold text-brand-700">
                  <span aria-hidden className="text-gold-500">
                    ◆
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[0.7rem] font-bold text-brand-400">
            💡 Mục tiêu không phải học thuộc, mà là biết <b>phá thế khai cuộc</b> và <b>chặn
            triển khai quân</b> của đối thủ.
          </p>
        </Panel>
      </div>
    </div>
  )
}
