import { useNavigate, useSearch } from '@tanstack/react-router'
import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { InfoButton } from '../components/InfoPopover'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useArrowKeys } from '../hooks/useArrowKeys'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { useCountersQuery } from '../data/queries'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  OPPONENT_ARROW_COLOR,
  OPPONENT_FROM_STYLE,
  OPPONENT_TO_STYLE,
  PIECE_GLYPH,
  formatSanLetters,
  pieceFromSan,
} from '../lib/notation'
import { playError, playMove, playWin } from '../lib/sound'
import { useReportLesson } from '../store/lesson'
import { useKidProgress } from '../store/progress'
import type { CounterLesson, MoveAnnotation, Side } from '../types'

/** Đối thủ cầm màu nào - bé tự động cầm màu còn lại. */
const SIDE_OPTIONS: { value: Side; label: string; icon: string }[] = [
  { value: 'white', label: 'Đối thủ cầm Trắng', icon: '⬜' },
  { value: 'black', label: 'Đối thủ cầm Đen', icon: '⬛' },
]

/**
 * Hai cách học tab Đối phó: **xem** máy dẫn từng nước, hoặc **tự kéo quân** đáp trả.
 * Chế độ luyện giữ nguyên bàn cờ, chỉ đổi việc bé được kéo-thả hay chỉ ngồi xem.
 */
type Mode = 'view' | 'practice'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'view', label: 'Xem từng bước', icon: '📖' },
  { value: 'practice', label: 'Luyện tự đáp trả', icon: '🖐️' },
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
  const { notation, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const search = useSearch({ from: '/counters' })
  const navigate = useNavigate()

  /** Màu quân của ĐỐI THỦ; bé cầm màu ngược lại. */
  const [viewSide, setViewSide] = useState<Side>('white')
  const [lessonId, setLessonId] = useState('vs-london')
  const [ply, setPly] = useState(0)
  /** Lọc danh sách theo nước mở đầu của đối thủ (null = xem tất cả). */
  const [moveFilter, setMoveFilter] = useState<string | null>(null)
  /** Chế độ học: xem từng bước (như cũ) hay TỰ kéo quân đáp trả. */
  const [mode, setMode] = useState<Mode>('view')
  /** Có hiện mũi tên + tô sáng quân sắp đi không (chỉ dùng ở chế độ luyện). */
  const [hintVisible, setHintVisible] = useState(true)
  /** Nước bé vừa kéo sai - hiện băng đỏ nhắc thử lại (chỉ ở chế độ luyện). */
  const [wrongInfo, setWrongInfo] = useState<{
    annotation: MoveAnnotation
    plyIndex: number
  } | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
  } | null>(null)
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

  // Đổi bài hoặc đổi chế độ → quay lại từ nước đầu.
  useEffect(() => {
    setPly(0)
    setWrongInfo(null)
    setHintVisible(true)
    awardedRef.current = false
    setResult(null)
    setConfetti(false)
  }, [lesson?.id, mode])

  /**
   * Chế độ LUYỆN: đối thủ tự đi khi tới lượt. Nhờ vậy bé chỉ phải kéo quân của MÌNH,
   * còn đối thủ đáp trả đúng như một ván thật.
   */
  useEffect(() => {
    if (mode !== 'practice' || !lesson || atLeaf) return
    if (isKidPly(ply)) return
    const timer = setTimeout(() => setPly((current) => current + 1), 650)
    return () => clearTimeout(timer)
  }, [mode, lesson, ply, atLeaf, isKidPly])

  /** Bé đi hết cả dòng → ghi nhận đã hiểu bài đối phó này (luyện xong thì mừng lớn). */
  useEffect(() => {
    if (!lesson || ply === 0 || !atLeaf) return
    if (awardedRef.current) return
    awardedRef.current = true
    if (soundOn) playWin()
    if (mode === 'practice') {
      setConfetti(true)
      setResult({
        emoji: lesson.emoji,
        title: 'Bé tự đáp trả trọn vẹn!',
        message: `Bé đã tự tay kéo đúng mọi nước đáp trả ${lesson.opponentOpening}. Cách “${lesson.counterName}” đã vào tay rồi!`,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, ply, atLeaf, mode])

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

  /**
   * Mũi tên báo nước SẮP tới: **vàng đồng** cho nước của bé, **san hô** cho nước
   * của đối thủ - để bé nhìn màu là biết ngay ai sắp đi.
   */
  /** Ở chế độ luyện bé có thể ẩn gợi ý để tự nhớ; chế độ xem thì luôn hiện. */
  const showHint = mode === 'view' || hintVisible

  const arrows = useMemo(
    () =>
      hintMove && showHint
        ? [
            {
              startSquare: hintMove.from,
              endSquare: hintMove.to,
              color: hintMove.mine ? ARROW_COLOR : OPPONENT_ARROW_COLOR,
            },
          ]
        : [],
    [hintMove, showHint],
  )

  /**
   * Tô sáng QUÂN SẮP ĐI và Ô ĐÍCH: vàng cho nước của bé (như tab Khai cuộc), san hô
   * cho nước của đối thủ. Nhờ vậy bé nhìn bàn cờ là thấy ngay quân nào sắp nhúc nhích.
   */
  const nextMoveSquares = useMemo(() => {
    if (!hintMove || !showHint) return undefined
    return hintMove.mine
      ? { [hintMove.from]: HINT_FROM_STYLE, [hintMove.to]: HINT_TO_STYLE }
      : { [hintMove.from]: OPPONENT_FROM_STYLE, [hintMove.to]: OPPONENT_TO_STYLE }
  }, [hintMove, showHint])

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
    if (wrongInfo) return { ...wrongInfo, variant: 'wrong' as const }
    if (ply === 0) {
      const san = moves[0]?.san
      if (!san) return null
      return {
        annotation: {
          san,
          piece: pieceFromSan(san),
          reason: kidSide === 'white'
            ? 'Trắng đi trước. Bé mở màn bằng nước này rồi xem đối thủ đáp lại nhé.'
            : 'Đối thủ sắp mở màn như vậy - bé xem ý đồ rồi đáp lại nhé.',
          rhyme: 'Xem trước rồi đi',
        },
        plyIndex: 0,
        variant: 'hint' as const,
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
  }, [lesson, moves, ply, wrongInfo, kidSide])

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

  // ◀ ▼ lùi, ▶ ▲ tiến - chỉ ở chế độ xem; chế độ luyện bé đi bằng kéo-thả.
  useArrowKeys({ enabled: mode === 'view', onPrev: goBack, onNext: goForward })

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

  if (isLoading || !lesson) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
      </div>
    )
  }

  const kidStep = Math.floor(ply / 2)

  /**
   * Dải “lượt ai sắp đi”: nêu rõ TÊN QUÂN và hai ô đi, để bé vừa đọc vừa dò theo
   * đúng quân đang được tô sáng màu trên bàn cờ.
   */
  const nextMove = atLeaf ? undefined : moves[ply]
  const nextIsKid = hintMove?.mine ?? false
  const nextTurnStrip = nextMove ? (
    <div
      id="kid-counter-turn"
      className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border-2 p-2.5 text-center ${
        nextIsKid ? 'border-gold-300 bg-gold-50' : 'border-coral-200 bg-coral-50'
      }`}
    >
      <span
        className={`text-sm font-extrabold ${nextIsKid ? 'text-gold-900' : 'text-coral-800'}`}
      >
        {nextIsKid ? '👉 Lượt BÉ sắp đi' : '🤖 Lượt ĐỐI THỦ sắp đi'}
      </span>
      {showHint ? (
        <>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-sm font-extrabold ring-2 ${
              nextIsKid ? 'text-gold-900 ring-gold-300' : 'text-coral-800 ring-coral-200'
            }`}
          >
            <span aria-hidden>{PIECE_GLYPH[pieceFromSan(nextMove.san)]}</span>
            {formatSanLetters(nextMove.san)}
            <b className={nextIsKid ? 'text-gold-700' : 'text-coral-700'}>
              {hintMove?.from} → {hintMove?.to}
            </b>
          </span>
          <span className="text-[0.7rem] font-bold text-brand-500">
            {nextIsKid
              ? 'Quân viền VÀNG sắp đi tới ô viền xanh'
              : 'Quân viền SAN HÔ là quân đối thủ sắp di chuyển'}
          </span>
        </>
      ) : (
        <span className="text-[0.7rem] font-bold text-brand-500">
          {nextIsKid
            ? 'Bé tự tìm quân và ô đáp trả nhé - bấm 💡 nếu cần gợi ý'
            : 'Đối thủ sắp đi - bé chuẩn bị đáp trả'}
        </span>
      )}
    </div>
  ) : null

  /** Chỉ chế độ luyện mới cho kéo-thả, và chỉ khi tới lượt bé. */
  const kidTurn = isKidPly(ply) && !atLeaf
  const interactive = mode === 'practice' && kidTurn

  /** Bé kéo quân đáp trả: đúng thì tiến, sai thì hiện băng đỏ nhắc thử lại. */
  const handleDrop = (from: string, to: string): boolean => {
    if (!interactive) return false
    const expected = moves[ply]
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
        reason: 'Nước này chưa đúng rồi. Bé nhìn quân viền vàng và mũi tên rồi thử lại nhé!',
        rhyme: 'Bình tĩnh thử lại',
      }
      setWrongInfo({ annotation, plyIndex: ply })
      return false
    }
    if (soundOn) playMove()
    setWrongInfo(null)
    setPly((current) => current + 1)
    return true
  }

  /** Chơi lại từ nước đầu ở chế độ luyện. */
  const resetPractice = () => {
    setPly(0)
    setHintVisible(true)
    setWrongInfo(null)
    awardedRef.current = false
    setResult(null)
    setConfetti(false)
  }

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
            interactive={interactive}
            heatmap={heatmap}
            arrows={arrows}
            extraSquareStyles={{ ...lastMoveSquares, ...nextMoveSquares }}
            announce={announceSan}
            onDrop={handleDrop}
          />
        }
        under={
          <div className="grid gap-2">
            {atLeaf ? (
              <div className="rounded-2xl border-2 border-leaf-300 bg-leaf-50 p-2.5 text-center text-sm font-extrabold text-leaf-800">
                {mode === 'practice'
                  ? '✅ Bé đã tự đáp trả trọn vẹn dòng này!'
                  : '✅ Bé đã xem trọn dòng đối phó này!'}
              </div>
            ) : null}
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

      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        {/*
          Dải “lượt ai sắp đi” + quân nào đi đâu. Đặt ở CỘT ĐIỀU KHIỂN chứ không
          nằm dưới bàn cờ: khối dưới bàn cờ càng cao thì bàn cờ càng bị thu nhỏ
          (ở cửa sổ thấp, bàn cờ chỉ còn vừa đúng mức tối thiểu), nên nhường chỗ
          ấy cho bàn cờ. Dải này vẫn nằm ngay cạnh bàn cờ, và trên bàn cờ quân cần
          đi đã được tô viền màu sẵn.
        */}
        {nextTurnStrip}

        <Panel className="grid gap-2">
          <Segmented
            options={MODES}
            value={mode}
            onChange={(next) => setMode(next)}
            size="sm"
          />
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'view' ? (
              <>
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
              </>
            ) : (
              <>
                <KidButton
                  variant="sky"
                  size="sm"
                  onClick={() => setHintVisible((value) => !value)}
                  disabled={atLeaf}
                  title={hintVisible ? 'Ẩn mũi tên để tự nhớ' : 'Hiện lại mũi tên gợi ý'}
                >
                  {hintVisible ? '🙈 Ẩn gợi ý' : '💡 Hiện gợi ý'}
                </KidButton>
                <KidButton variant="ghost" size="sm" onClick={resetPractice}>
                  🔄 Chơi lại
                </KidButton>
              </>
            )}
          </div>
          <p className="text-[0.7rem] font-bold text-brand-400">
            {mode === 'practice'
              ? atLeaf
                ? '✅ Bé đã tự đáp trả trọn dòng này!'
                : '🖐️ Kéo quân hoặc bấm quân rồi ô đích - đối thủ sẽ tự đáp lại'
              : atLeaf && ply > 0
                ? '✅ Bé đã xem trọn dòng đối phó này!'
                : `👀 Đang xem nước ${kidStep} · ⌨️ hoặc bấm ◀ ▶ ▲ ▼`}
            <InfoButton topic="board" />
          </p>
        </Panel>

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

      <Confetti show={confetti} onDone={() => setConfetti(false)} />
      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🛡️'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        onClose={() => setResult(null)}
        onRetry={() => {
          setResult(null)
          resetPractice()
        }}
      />
    </div>
  )
}
