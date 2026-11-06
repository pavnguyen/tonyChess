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
import { FoldPanel, KidButton, KidPicker, LessonLabel, Panel, Segmented } from '../components/ui'
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
  /**
   * Ô bé vừa bấm trong nội dung bài (ví dụ bấm “♗ Tượng c5”) → tô sáng đúng ô đó
   * trên bàn cờ. Bé không phải tự dò toạ độ: bấm vào chữ là thấy quân ấy đứng đâu.
   * Bấm lại đúng ô đó thì bỏ tô.
   */
  const [pickedSquare, setPickedSquare] = useState<string | null>(null)
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
   * Bài đang học. Chỉ có 5 bài mỗi phe nên KHÔNG lọc theo nước mở đầu nữa: combo
   * chọn bài đã liệt kê đủ 5, thêm hàng chip lọc chỉ làm rối mắt.
   */
  const lesson: CounterLesson | undefined =
    list.find((item) => item.id === lessonId) ?? list[0]


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
        // Nước mở màn của ĐỐI THỦ (bé cầm Đen) không phải “nhắc tuồng” của bé.
        variant: isKidPly(0) ? ('hint' as const) : ('opponent' as const),
      }
    }
    const node = moves[ply - 1]
    if (!node) return null
    if (node.annotation) {
      return {
        annotation: node.annotation,
        plyIndex: ply - 1,
        // Lời bình của nước ĐỐI THỦ vẫn là “đối thủ đi”, không phải “bé vừa đi”.
        variant: isKidPly(ply - 1) ? ('played' as const) : ('opponent' as const),
      }
    }
    const annotation: MoveAnnotation = {
      san: node.san,
      piece: pieceFromSan(node.san),
      reason: 'Nước của đối thủ - bé xem rồi đáp lại nhé.',
      rhyme: 'Đối thủ vừa đi',
    }
    return { annotation, plyIndex: ply - 1, variant: 'opponent' as const }
  }, [lesson, moves, ply, wrongInfo, kidSide, isKidPly])

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

  /**
   * Dải “lượt ai sắp đi”: nêu rõ TÊN QUÂN và hai ô đi, để bé vừa đọc vừa dò theo
   * đúng quân đang được tô sáng màu trên bàn cờ.
   */
  const nextMove = atLeaf ? undefined : moves[ply]
  const nextIsKid = hintMove?.mine ?? false
  /**
   * “Lượt ai sắp đi” nay là một VIÊN NHỎ nằm cùng dòng với nhãn “Cách phá …” trong
   * khung mind-set: một dòng nói cả hai điều bé cần - đang phá bài nào, và ai sắp đi.
   * Trước đây nó là khung riêng cao 36px, cộng thêm khoảng cách, khiến cột phải trên
   * máy tính phải cuộn 123px mới thấy hết nút điều khiển.
   */
  const nextTurnStrip = nextMove ? (
    <span
      id="kid-counter-turn"
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border-2 px-2 py-0.5 font-extrabold ${
        nextIsKid ? 'border-gold-300 bg-gold-50 text-gold-900' : 'border-coral-200 bg-coral-50 text-coral-800'
      }`}
    >
      <span className="shrink-0 text-xs">
        {nextIsKid ? '👉 Lượt BÉ sắp đi' : '🤖 Lượt ĐỐI THỦ sắp đi'}
      </span>
      {showHint ? (
        <span
          className={`inline-flex min-w-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs ring-2 ${
            nextIsKid ? 'text-gold-900 ring-gold-300' : 'text-coral-800 ring-coral-200'
          }`}
        >
          <span aria-hidden>{PIECE_GLYPH[pieceFromSan(nextMove.san)]}</span>
          {formatSanLetters(nextMove.san)}
          <b className={nextIsKid ? 'text-gold-700' : 'text-coral-700'}>
            {hintMove?.from} → {hintMove?.to}
          </b>
        </span>
      ) : null}
    </span>
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
            mathGate
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

      {/* `stage:gap-1.5`: trên máy tính hai khung sát nhau hơn 2px, đủ để cửa sổ
          thấp 980×720 không còn phải cuộn nội bộ. */}
      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:gap-1.5 stage:overflow-y-auto stage:pr-1">
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
        {/*
          KHÔNG còn thẻ “đang đối phó khai cuộc nào” riêng: nó tốn 60px mà thông tin
          ấy đã có trên chip cạnh bàn cờ. Phần tên + nước đối thủ đi + màu bé cầm
          được gộp vào ĐẦU khung chọn bài bên dưới, một dòng, đúng chỗ bé chọn.
        */}

        {/*
          MIND-SET ĐỐI PHÓ đặt ngay dưới thẻ nhận diện và dải “lượt ai sắp đi”,
          TRÊN cả danh sách bài và nút điều khiển: bé cần hiểu “đối thủ muốn gì -
          mình làm gì” trước khi nhớ nước nào đi trước. Mở sẵn trên điện thoại.
          Tiêu đề ghi luôn TÊN khai cuộc đối thủ để khung này không còn “vô danh”.
        */}
        <FoldPanel
          id="kid-counter-detail"
          className="stage:px-2 stage:py-1"
          icon="🧠"
          title={`Đối phó ${lesson.englishName}`}
          defaultOpen
        >
          {/*
            Chỉ còn MỘT dòng có nút ⓘ (bỏ tiêu đề to + dòng phụ): tên bài đã nằm
            trong thanh tiêu đề của khung này, thêm nữa chỉ tốn 44px chiều cao.
          */}
          {/*
            Dòng đầu của khung phải NÓI RÕ đang phá khai cuộc nào: trên máy tính
            thanh tiêu đề của FoldPanel bị ẩn, nên nếu không có dòng này bé chỉ thấy
            “Đối thủ muốn…” mà không biết của bài nào.
          */}
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            <span className="flex min-w-0 flex-1 items-center gap-1 text-xs font-extrabold text-brand-500">
              {/*
                Cùng bộ icon với tab Khai cuộc (🧠 cho khung mind-set) và icon to
                hơn chữ một bậc: emoji cỡ 12px đứng cạnh nhãn in hoa bị chìm, nhìn
                như dấu chấm mờ chứ không ra biểu tượng.
              */}
              <span aria-hidden className="text-sm leading-none">
                🧠
              </span>
              <span className="min-w-0 truncate">
                Cách phá{' '}
                <b className="text-base text-brand-900">{lesson.englishName}</b>{' '}
                <span className="text-brand-500">· {lesson.opponentOpening}</span>
              </span>
            </span>
            {nextTurnStrip}
            <InfoButton topic="counter" />
          </div>
          {/* Bốn khối dưới xếp sát hơn (4px thay 8px): cùng là “một bài đọc ngắn”,
              không cần khoảng thở bằng nhau giữa các thẻ. */}
          <div className="grid gap-0.5">
          {/* Ý đồ đối thủ là khối PHỤ: nhãn dán ngay đầu câu (không chiếm một dòng
              riêng), chữ thường - bé hiểu trước rồi mới tới việc của mình. */}
          <div
            id="kid-counter-opponent-plan"
            className="rounded-xl bg-coral-50 px-2 py-1 ring-1 ring-coral-200"
          >
            <p className="font-medium leading-snug text-coral-900">
              <LessonLabel icon="🚩" title="Đối thủ muốn" tone="coral" size="sm" className="mr-1" />
              <MoveText
                text={lesson.opponentPlan}
                onPickSquare={pickSquare}
                pickedSquare={pickedSquare}
              />
            </p>
          </div>
          {/* Cách của bé là khối CHÍNH: tên cách đối phó đậm + câu giải thích ngay dưới,
              gộp hai khối rời cũ (tên và “idea”) vốn nói cùng một ý. */}
          <div className="rounded-2xl border-2 border-info-600 bg-info-50 px-2 py-1">
            <div id="kid-counter-name" className="font-extrabold leading-snug text-brand-900">
              <LessonLabel icon="🛡️" title="Cách của bé" tone="info" size="sm" className="mr-1" />
              <MoveText
                text={lesson.counterName}
                onPickSquare={pickSquare}
                pickedSquare={pickedSquare}
              />
            </div>
            <p id="kid-counter-idea" className="font-medium leading-snug text-brand-700">
              <MoveText text={lesson.idea} onPickSquare={pickSquare} pickedSquare={pickedSquare} />
            </p>
          </div>
          {/*
            Bỏ nhãn “✅ Ba việc cần nhớ”: danh sách đã đánh số 1-2-3, tự hiểu, và mỗi
            nhãn thừa là một dòng chiều cao trong cột phải.
          */}
          {/* Ba việc: mỗi việc một hàng nền navy nhạt + số tròn, để bé quét mắt
              từng việc thay vì đọc một khối chữ liền. */}
          <LessonLabel icon="🎯" title="Ba việc cần làm" size="sm" />
          <ul id="kid-counter-points" className="grid gap-0.5">
            {lesson.points.map((point, index) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-xl bg-brand-50 px-2 py-0.5 font-semibold leading-snug text-brand-800"
              >
                <span
                  aria-hidden
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-[11px] font-extrabold text-white"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
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

        </FoldPanel>        {/*
          CHỌN BÀI bằng combo thay cho lưới thẻ: lưới cũ cao gần 180px mà nội dung
          lặp lại đúng khung “Cách phá …” ngay trên (tên quốc tế + cách đáp), lại
          thêm hàng lọc nước mở đầu và nút “bài khác” nằm rời - rất rối. Combo nói
          rõ ĐANG học bài nào, chỉ mở ra khi bé muốn đổi, và trên điện thoại dùng
          luôn bảng chọn quen thuộc của máy.
        */}
        {/*
          `gap-1` (4px) thay 6px: ở cửa sổ thấp 980×720 cột phải chỉ thiếu đúng 5px
          mới hết cuộn - bóp khoảng cách giữa 4 hàng là đủ, không phải cắt chữ nào.
        */}
        {/*
          `stage:mt-auto`: trên máy tính, khung điều khiển bám ĐÁY cột. Trước đây hai
          khung dồn hết lên trên nên ở 1440×900 còn 309px trống dưới đáy (1920×1080 là
          489px) - cột phải lơ lửng, không cùng đường đáy với khối bàn cờ. Bám đáy thì
          khung điều khiển kết thúc đúng hàng với bàn cờ, khoảng trống dư dồn vào một
          nhịp nghỉ giữa phần đọc và phần điều khiển. Cửa sổ thấp thì `mt-auto` không
          có tác dụng (không còn chỗ dư) nên cột vẫn cuộn như cũ.
        */}
        <Panel className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1 stage:mt-auto stage:p-2">
          <Segmented options={SIDE_OPTIONS} value={viewSide} onChange={changeSide} size="sm" />

          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {/*
              Bảng chọn của APP, không dùng `<select>` của máy: đây là tab cuối
              còn sót combo native - trên iOS nó mở bánh xe xám, cắt mất tên bài
              và không có icon. Bản `sr-only` bên trong vẫn giữ id
              `kid-counter-select` cho bài kiểm cũ gán value + phát `change`.
            */}
            <KidPicker
              id="kid-counter-select"
              label="Bài đối phó"
              value={lesson.id}
              onChange={selectLesson}
              groups={[
                {
                  items: list.map((item) => ({
                    id: item.id,
                    label: `${item.englishName} · ${item.counterName}`,
                    icon: item.emoji,
                    data: { 'data-counter-id': item.id },
                  })),
                },
              ]}
              className="min-w-0 flex-1"
            />
            {lesson.openingId && (
              <button
                type="button"
                id="kid-counter-opening"
                onClick={() => navigate({ to: '/', search: { opening: lesson.openingId } })}
                title="Mở bài khai cuộc gốc ở tab Khai cuộc"
                className="shrink-0 rounded-full border-2 border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-700 transition-all hover:border-brand-400 active:translate-y-[1px]"
              >
                📖 Mở bài khai cuộc gốc
              </button>
            )}
          </div>

          {/*
            Điều khiển nằm CHUNG khung với danh sách (một đường kẻ thay vì một khung
            nữa): tiết kiệm padding + khoảng cách, và bé thấy “chọn bài → đi nước”
            liền một mạch.
          */}
          <div className="grid gap-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <Segmented
              options={MODES}
              value={mode}
              onChange={(next) => setMode(next)}
              size="sm"
            />
            <InfoButton topic="board" />
          </div>
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
          </div>
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
