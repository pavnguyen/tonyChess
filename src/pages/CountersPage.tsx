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
import { MoveText } from '../components/MoveText'
import { FoldPanel, KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { useArrowKeys } from '../hooks/useArrowKeys'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { OPENINGS } from '../data/openings'
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
  /** Bài mặc định cùng thứ tự ưu tiên với tab Khai cuộc (Ván cờ Ý đứng đầu). */
  const [lessonId, setLessonId] = useState('vs-italian')
  const [ply, setPly] = useState(0)
  /** Lọc danh sách theo nước mở đầu của đối thủ (null = xem tất cả). */
  const [moveFilter, setMoveFilter] = useState<string | null>(null)
  /**
   * Ô bé vừa bấm trong nội dung bài (ví dụ bấm “♗ Tượng c5”) → tô sáng đúng ô đó
   * trên bàn cờ. Bé không phải tự dò toạ độ: bấm vào chữ là thấy quân ấy đứng đâu.
   * Bấm lại đúng ô đó thì bỏ tô.
   */
  const [pickedSquare, setPickedSquare] = useState<string | null>(null)
  /**
   * Mở khung “Tham khảo thêm” (các bài ít gặp). MẶC ĐỊNH ĐÓNG, giống tab Khai cuộc:
   * chỉ bày 3 bài thông dụng nhất cho gọn, cần bài khác thì bấm mở.
   */
  const [showExtras, setShowExtras] = useState(false)
  /**
   * Bé đang XEM LẠI một nước cũ (bấm ◀/▶ ở chế độ luyện). Trong lúc xem lại thì tạm
   * dừng việc đối thủ tự đi, nếu không bé vừa lùi một bước là máy lại tiến tiếp ngay.
   * Kéo đúng một nước là tự bỏ chế độ xem lại.
   */
  const [reviewing, setReviewing] = useState(false)
  /** Chế độ học: xem từng bước hay TỰ kéo quân đáp trả. Mặc định TỰ ĐI để bé vào là thực hành ngay. */
  const [mode, setMode] = useState<Mode>('practice')
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

  /**
   * Thứ tự ưu tiên học = thứ tự trong `OPENINGS` (gặp nhiều + dễ triển khai quân
   * trước). Bài đối phó gắn `openingId` đi theo đúng thứ tự đó; bài chỉ bàn về một
   * nước mở đầu phổ biến (1.e4, ...d5…) xếp sau cùng.
   */
  const openingRank = useMemo(
    () => new Map(OPENINGS.map((opening, index) => [opening.id, index])),
    [],
  )
  const list = useMemo(
    () =>
      (counters ?? [])
        .filter((item) => item.opponentSide === viewSide)
        .sort((a, b) => {
          const rankA = a.openingId ? (openingRank.get(a.openingId) ?? 99) : 100
          const rankB = b.openingId ? (openingRank.get(b.openingId) ?? 99) : 100
          return rankA - rankB
        }),
    [counters, viewSide, openingRank],
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
  /** 3 bài thông dụng nhất bày sẵn; phần còn lại gom vào “Tham khảo thêm”. */
  const mainList = visibleList.slice(0, 3)
  const extraList = visibleList.slice(3)
  /** Đang học bài nằm trong phần tham khảo → tự mở khung, không để bài bị ẩn. */
  const extrasOpen = showExtras || extraList.some((item) => item.id === lessonId)

  const lesson: CounterLesson | undefined =
    visibleList.find((item) => item.id === lessonId) ?? visibleList[0]

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang học bài đối phó nào.

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
    setReviewing(false)
    awardedRef.current = false
    setResult(null)
    setConfetti(false)
  }, [lesson?.id, mode])

  /**
   * Chế độ LUYỆN: đối thủ tự đi khi tới lượt. Nhờ vậy bé chỉ phải kéo quân của MÌNH,
   * còn đối thủ đáp trả đúng như một ván thật.
   */
  useEffect(() => {
    if (mode !== 'practice' || reviewing || !lesson || atLeaf) return
    if (isKidPly(ply)) return
    const timer = setTimeout(() => setPly((current) => current + 1), 650)
    return () => clearTimeout(timer)
  }, [mode, reviewing, lesson, ply, atLeaf, isKidPly])

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

  /** Ô của cụm “quân + ô” bé vừa bấm trong bài (tím, cùng gam ô cần nhìn). */
  const pickedSquares = useMemo(
    () =>
      pickedSquare
        ? {
            [pickedSquare]: {
              backgroundColor: BOARD_MARKS.focusFill,
              boxShadow: BOARD_MARKS.focusRing,
            },
          }
        : undefined,
    [pickedSquare],
  )

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
  /**
   * Ở chế độ luyện, bấm Lùi/Tiến là **xem lại** nước vừa đi: tạm dừng việc đối thủ
   * tự đi, để bé ngắm lại thế cờ thay vì bị máy kéo đi tiếp ngay.
   */
  const goBack = useCallback(() => {
    setReviewing(true)
    goStep(-1)
  }, [goStep])
  const goForward = useCallback(() => {
    setReviewing(true)
    goStep(1)
  }, [goStep])

  // ◀ ▼ lùi, ▶ ▲ tiến - chỉ ở chế độ xem; chế độ luyện bé đi bằng kéo-thả.
  useArrowKeys({ enabled: mode === 'view', onPrev: goBack, onNext: goForward })

  /**
   * Bấm một cụm “quân + ô” trong bài: tô sáng ô đó trên bàn cờ, bấm lại thì bỏ tô.
   */
  const pickSquare = useCallback(
    (square: string) => setPickedSquare((current) => (current === square ? null : square)),
    [],
  )

  // Đổi bài hoặc đi tới nước khác thì bỏ tô cũ: ô đó có thể không còn quân ấy nữa.
  useEffect(() => {
    setPickedSquare(null)
  }, [lessonId, ply])

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

  /** Một dòng bài đối phó: tên khai cuộc ↔ cách bé đáp ↔ nước mở đầu. */
  const LessonRow = ({
    item,
    compact = false,
  }: {
    item: CounterLesson
    compact?: boolean
  }) => {
    const active = item.id === lesson?.id
    return (
      <button
        type="button"
        data-counter-id={item.id}
        data-counter-extra={compact ? '1' : undefined}
        aria-pressed={active}
        onClick={() => selectLesson(item.id)}
        className={`flex min-w-0 items-center gap-2 rounded-2xl border-2 px-2.5 py-2 text-left transition-all active:translate-y-[1px] ${
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
            {item.englishName}
          </span>
          <span className="block truncate text-xs font-bold text-brand-500">
            {item.opponentOpening} · <MoveText text={item.counterName} />
          </span>
          {/* Ý đồ ngắn để tra cứu nhanh: đọc một dòng là hiểu vì sao đáp như vậy. */}
          {/* Ý đồ gói trong 2 dòng ngắn: đọc hết câu, không bị cắt giữa chừng. */}
          {!compact && (
            <span className="mt-0.5 line-clamp-2 block text-xs font-bold leading-snug text-ink-600">
              <MoveText text={item.idea} />
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-lg bg-brand-100 px-1.5 py-0.5 text-xs font-extrabold text-brand-700">
          {openingMoveLabel(item)}
        </span>
      </button>
    )
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
          <span className="text-xs font-bold text-brand-500">
            {nextIsKid
              ? 'Quân viền VÀNG sắp đi tới ô viền xanh'
              : 'Quân viền SAN HÔ là quân đối thủ sắp di chuyển'}
          </span>
        </>
      ) : (
        <span className="text-xs font-bold text-brand-500">
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
    setReviewing(false)
    setPly((current) => current + 1)
    return true
  }

  /** Chơi lại từ nước đầu ở chế độ luyện. */
  const resetPractice = () => {
    setReviewing(false)
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
        reserve={244}
        top={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-coral-100 px-3 py-1 text-xs font-extrabold text-coral-700">
                🧭 Đối thủ: {lesson.emoji} {lesson.englishName}
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
            extraSquareStyles={{ ...lastMoveSquares, ...nextMoveSquares, ...pickedSquares }}
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
        {/*
          “ĐANG ĐỐI PHỐ KHAI CUỘC NÀO” - thẻ nhận diện đặt LÊN ĐẦU cột, TRƯỚC cả
          dải lượt đi và khối mind-set. Trước đây khối mind-set hiện ra trước mà
          không nêu tên khai cuộc, nên bé/ba mẹ phải cuộn xuống danh sách mới biết
          mình đang đối phó với kiểu chơi nào. Thẻ này gộp đủ ngữ cảnh trong một
          dòng: tên quốc tế, tên Việt, nước đối thủ đi trước, bé cầm màu nào - và
          nút nhảy xuống danh sách để đổi bài.
        */}
        <div
          id="kid-counter-topic"
          className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border-2 border-brand-200 bg-white px-2.5 py-2"
        >
          <span className="text-xl leading-none" aria-hidden>
            {lesson.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-brand-900">
              🧭 Đang đối phó: {lesson.englishName}
            </span>
            <span className="block truncate text-xs font-bold text-brand-500">
              {lesson.opponentOpening} · đối thủ đi {openingMoveLabel(lesson)} · bé cầm{' '}
              {sideLabel(kidSide)}
            </span>
          </span>
          <button
            type="button"
            id="kid-counter-switch"
            onClick={() =>
              document
                .getElementById('kid-counter-list')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            title="Nhảy xuống danh sách để chọn khai cuộc khác"
            className="shrink-0 rounded-full border-2 border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-700 transition-all hover:border-brand-400 active:translate-y-[1px]"
          >
            🔁 Đổi khai cuộc
          </button>
        </div>

        {nextTurnStrip}

        {/*
          MIND-SET ĐỐI PHÓ đặt ngay dưới thẻ nhận diện và dải “lượt ai sắp đi”,
          TRÊN cả danh sách bài và nút điều khiển: bé cần hiểu “đối thủ muốn gì -
          mình làm gì” trước khi nhớ nước nào đi trước. Mở sẵn trên điện thoại.
          Tiêu đề ghi luôn TÊN khai cuộc đối thủ để khung này không còn “vô danh”.
        */}
        <FoldPanel
          id="kid-counter-detail"
          icon="🧠"
          title={`Đối phó ${lesson.englishName}`}
          defaultOpen
        >
          {/* Tiêu đề + nút ⓘ chỉ hiện trên máy tính: điện thoại đã có dòng “Mindset”. */}
          <div className="hidden stage:block">
            <SectionTitle
              icon="🧭"
              title="Đối phó khai cuộc"
              subtitle="Đối thủ chơi gì - bé phá lại thế nào"
              info="counter"
            />
          </div>
          <p
            id="kid-counter-opponent-plan"
            className="rounded-2xl bg-coral-50 px-2.5 py-1.5 text-xs font-bold leading-snug text-coral-800 ring-1 ring-coral-200"
          >
            🚩 <b className="text-coral-900">Đối thủ muốn:</b>{' '}
            <MoveText
              text={lesson.opponentPlan}
              onPickSquare={pickSquare}
              pickedSquare={pickedSquare}
            />
          </p>
          <div
            id="kid-counter-name"
            className="rounded-2xl border-2 border-info-600 bg-info-100 px-2.5 py-1.5 text-sm font-extrabold text-brand-900"
          >
            🛡️ Cách của bé:{' '}
            <MoveText
              text={lesson.counterName}
              onPickSquare={pickSquare}
              pickedSquare={pickedSquare}
            />
          </div>
          <p id="kid-counter-idea" className="text-sm font-bold text-brand-700">
            <MoveText text={lesson.idea} onPickSquare={pickSquare} pickedSquare={pickedSquare} />
          </p>
          <div className="grid gap-1">
            <div className="text-xs font-extrabold uppercase tracking-wide text-brand-500">
              ✅ Ba việc cần nhớ
            </div>
            <ul id="kid-counter-points" className="grid gap-1">
              {lesson.points.map((point, index) => (
                <li key={point} className="flex gap-1.5 text-xs font-bold text-brand-700">
                  <span
                    aria-hidden
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-extrabold text-brand-600"
                  >
                    {index + 1}
                  </span>
                  <span>
                    <MoveText
                      text={point}
                      onPickSquare={pickSquare}
                      pickedSquare={pickedSquare}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs font-bold text-ink-600">
            👆 Bấm vào “♗ Tượng c5” trong bài để bàn cờ tô sáng ô đó.
          </p>
          {lesson.openingId && (
            <KidButton
              id="kid-counter-opening"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/', search: { opening: lesson.openingId } })}
              title="Mở bài khai cuộc gốc ở tab Khai cuộc"
            >
              📖 Mở bài khai cuộc gốc
            </KidButton>
          )}
        </FoldPanel>

        {/*
          Chọn khai cuộc của đối thủ: mỗi dòng là TÊN khai cuộc + cách bé đáp lại +
          nước mở đầu, để bé dò nhanh các kiểu khai cuộc mà không phải mở từng bài.
        */}
        <Panel className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
          {/* Nhãn khung: nói rõ đây là chỗ CHỌN khai cuộc của đối thủ (trước đây
              khung mở bằng hai nút Trắng/Đen nên khó hiểu đang chọn cái gì). */}
          <p className="flex min-w-0 items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-brand-500">
            🗂️ Chọn khai cuộc của đối thủ
            <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-xs font-extrabold normal-case tracking-normal text-brand-600">
              {list.length} bài
            </span>
          </p>
          <Segmented
            options={SIDE_OPTIONS}
            value={viewSide}
            onChange={changeSide}
            size="sm"
          />
          <div id="kid-counter-move-filter" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-move-filter="all"
              aria-pressed={moveFilter === null}
              onClick={() => setMoveFilter(null)}
              className={`rounded-full border-2 px-2.5 py-1 text-xs font-extrabold transition-all active:translate-y-[1px] ${
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
                  className={`rounded-full border-2 px-2.5 py-1 text-xs font-extrabold transition-all active:translate-y-[1px] ${
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
          <div id="kid-counter-list" className="grid min-w-0 gap-1.5">
            {mainList.map((item) => (
              <LessonRow key={item.id} item={item} />
            ))}
          </div>
          {extraList.length > 0 && (
            <div className="grid gap-1.5">
              <button
                type="button"
                id="kid-counter-extras"
                aria-expanded={extrasOpen}
                onClick={() => setShowExtras((open) => !open)}
                className="flex items-center justify-between gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-white px-2.5 py-1.5 text-left text-xs font-extrabold text-brand-600 transition-all active:translate-y-[1px] hover:border-brand-400"
              >
                <span>📚 Tham khảo thêm {extraList.length} bài khác</span>
                <span aria-hidden>{extrasOpen ? '▲' : '▼'}</span>
              </button>
              {/* Vẫn giữ trong DOM khi đóng (chỉ ẩn CSS) để điều hướng và bài kiểm vẫn thấy đủ. */}
              <div className={extrasOpen ? 'grid gap-1.5' : 'hidden'}>
                {extraList.map((item) => (
                  <LessonRow key={item.id} item={item} compact />
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
          <Segmented
            options={MODES}
            value={mode}
            onChange={(next) => setMode(next)}
            size="sm"
          />
          {/*
            Lùi / Tiến có mặt ở CẢ HAI chế độ: đang ở chế độ luyện mà muốn ngắm lại
            nước vừa đi thì bấm luôn, không phải đổi sang chế độ Xem rồi quay lại.
          */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <KidButton
              id="kid-counter-back"
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={ply === 0}
              title="Lùi một nước để xem lại"
              aria-keyshortcuts="ArrowLeft ArrowDown"
            >
              ◀ Lùi
            </KidButton>
            <KidButton
              id="kid-counter-forward"
              variant={mode === 'view' ? 'sun' : 'ghost'}
              size="sm"
              onClick={goForward}
              disabled={atLeaf}
              title="Tiến một nước"
              aria-keyshortcuts="ArrowRight ArrowUp"
            >
              Tiến ▶
            </KidButton>
            {mode === 'view' ? (
              <KidButton
                variant="ghost"
                size="sm"
                onClick={() => setPly(0)}
                disabled={ply === 0}
              >
                🔄 Đầu
              </KidButton>
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
          <p className="text-xs font-bold text-ink-600">
            {mode === 'practice'
              ? atLeaf
                ? '✅ Bé đã tự đáp trả trọn dòng này!'
                : reviewing
                  ? '👀 Đang xem lại nước vừa đi · ▶ để tiến, hoặc kéo quân đúng để đi tiếp'
                  : '🖐️ Kéo quân hoặc bấm quân rồi ô đích - đối thủ sẽ tự đáp lại'
              : atLeaf && ply > 0
                ? '✅ Bé đã xem trọn dòng đối phó này!'
                : `👀 Đang xem nước ${kidStep} · ⌨️ hoặc bấm ◀ ▶ ▲ ▼`}
            <InfoButton topic="board" />
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
