import { useNavigate, useSearch } from '@tanstack/react-router'
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
import { InfoButton } from '../components/InfoPopover'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { BoardStage } from '../components/BoardStage'
import { useArrowKeys } from '../hooks/useArrowKeys'
import { useCurriculum } from '../hooks/useCurriculum'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { useOpeningsQuery } from '../data/queries'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  GOAL_ARROW_COLOR,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  PLAN_FOCUS_STYLE,
  pieceFromSan,
} from '../lib/notation'
import { buildLivePlan } from '../lib/livePlan'
import { isSideMoveLegal, parsePlanFocus } from '../lib/planFocus'
import type { LivePlan, LivePlanItem } from '../lib/livePlan'
import { playError, playMove, playWin } from '../lib/sound'
import { speakOpening } from '../lib/speech'
import { useReportLesson } from '../store/lesson'
import { useKidProgress } from '../store/progress'
import type { CSSProperties } from 'react'
import type { MoveAnnotation, Opening, Side } from '../types'

type Mode = 'learn' | 'memorize'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'learn', label: 'Học từng bước', icon: '📖' },
  { value: 'memorize', label: 'Luyện thuộc lòng', icon: '🧠' },
]

/** Hai cột khai cuộc: bé cầm Trắng hay cầm Đen. */
const SIDE_OPTIONS: { value: Side; label: string; icon: string }[] = [
  { value: 'white', label: 'Bé cầm Trắng', icon: '⬜' },
  { value: 'black', label: 'Bé cầm Đen', icon: '⬛' },
]

/** Sau chừng này ply (≈ 5 nước) là hết khai cuộc - tới lúc dùng kế hoạch trung cuộc. */
const PLAN_PLY = 10

/** Màu cho từng loại việc trong “Kế hoạch theo thế cờ hiện tại”. */
const LIVE_PLAN_STYLE: Record<LivePlanItem['kind'], string> = {
  danger: 'bg-coral-50 text-coral-700',
  chance: 'bg-gold-50 text-gold-900',
  goal: 'bg-info-50 text-info-700',
  engine: 'bg-brand-50 text-brand-700',
  note: 'bg-sand-100 text-brand-600',
}

const NO_OPENINGS: Opening[] = []

export function OpeningsPage() {
  const { data: openings, isLoading } = useOpeningsQuery()
  const { notation, completeActivity, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()

  const [openingId, setOpeningId] = useState('london')
  const [mode, setMode] = useState<Mode>('learn')
  /** Cột khai cuộc đang xem: quân Trắng hay quân Đen. */
  const [side, setSide] = useState<Side>('white')
  /** Bộ lọc theo nước mở đầu của bé (null = xem tất cả). */
  const [moveFilter, setMoveFilter] = useState<string | null>(null)
  /** Số nửa nước (ply) bé đã đi. Mỗi khai cuộc chỉ có MỘT dòng chính. */
  const [ply, setPly] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const [confetti, setConfetti] = useState(false)
  const [wrongInfo, setWrongInfo] = useState<{
    annotation: MoveAnnotation
    plyIndex: number
  } | null>(null)
  const [finished, setFinished] = useState(false)
  /** Câu kế hoạch trung cuộc bé vừa bấm để soi ô cờ trên bàn (null = không soi). */
  const [planFocusIdx, setPlanFocusIdx] = useState<number | null>(null)
  /**
   * Bé bấm “🎯 Bé muốn gì?” → bàn cờ tô tím đúng những ô mục tiêu của khai cuộc
   * (đọc từ chính câu `goal`), để bé thấy mình đang nhắm tới đâu thay vì chỉ đọc chữ.
   */
  const [goalFocus, setGoalFocus] = useState(false)
  /**
   * Bé vừa bấm một khai cuộc trên bản đồ → bàn cờ hiện **thế cờ mẫu hình cuối dòng
   * chính** của khai cuộc đó để nhìn trước, rồi bấm “▶ Bắt đầu học” mới vào bài.
   */
  const [openingPreview, setOpeningPreview] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)
  /** Modal “Ôn mẫu hình cuối khai cuộc”: xem thế cờ cuối của BẤT KỲ khai cuộc nào. */
  const [patternOpen, setPatternOpen] = useState(false)
  const [patternSide, setPatternSide] = useState<Side>('white')
  const [patternId, setPatternId] = useState('london')
  const awardedRef = useRef(false)
  const replyAfterDropRef = useRef(false)

  const openingList = openings ?? NO_OPENINGS
  const opening: Opening | undefined = useMemo(
    () => openingList.find((item) => item.id === openingId) ?? openingList[0],
    [openingList, openingId],
  )

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang học khai cuộc nào.
  useReportLesson(opening ? `opening:${opening.id}` : null)

  /** Chỉ những khai cuộc của phe đang xem - chia rõ Trắng / Đen cho dễ chọn. */
  const sideOpenings = useMemo(
    () => openingList.filter((item) => item.side === side),
    [openingList, side],
  )

  /**
   * Nhảy từ tab Đối phó về: mở sẵn đúng khai cuộc (và đúng phe) bé vừa xem bên đó.
   * Chỉ chạy khi đường dẫn mang `?opening=…` - bé bấm chọn bài khác trên bản đồ thì
   * không bị kéo ngược lại.
   */
  useEffect(() => {
    if (!search.opening) return
    const target = openingList.find((item) => item.id === search.opening)
    if (!target) return
    setSide(target.side)
    setOpeningId(target.id)
    setMoveFilter(null)
  }, [search.opening, openingList])

  // Bản đồ leo cấp: mỗi phe có chuỗi mở khoá riêng, bài sau mở khi thuộc bài trước.
  /**
   * Nước mở đầu của BÉ trong một khai cuộc. Trắng luôn đi trước, nên nếu bé cầm Đen
   * thì nước mở đầu của bé nằm ở ply 1 (sau nước đi đầu của đối thủ).
   */
  const kidFirstMove = useCallback(
    (item: Opening) => (item.side === 'white' ? item.moves[0]?.san : item.moves[1]?.san),
    [],
  )

  /** Các nước mở đầu khác nhau của bé trong cột đang xem - để làm bộ lọc. */
  const openMoveFilters = useMemo(() => {
    const seen = new Map<string, string>()
    for (const item of sideOpenings) {
      const move = kidFirstMove(item)
      if (move && !seen.has(move)) {
        seen.set(move, `${item.side === 'white' ? '1.' : '1...'}${move}`)
      }
    }
    return [...seen.entries()].map(([move, label]) => ({ move, label }))
  }, [sideOpenings, kidFirstMove])

  const curriculum = useCurriculum(sideOpenings, 'openings', ':memorize')

  /** Đổi phe: nhảy luôn sang bài đầu tiên của phe đó. */
  const changeSide = (next: Side) => {
    setSide(next)
    setOpeningPreview(false)
    setGoalFocus(false)
    setMoveFilter(null)
    const first = openingList.find((item) => item.side === next)
    if (first) setOpeningId(first.id)
  }

  /**
   * Bấm một khai cuộc trên bản đồ: chọn bài đó VÀ cho bàn cờ hiện ngay thế cờ mẫu
   * hình (cuối dòng chính) để bé/ba mẹ nhìn trước - chưa tính là đã học. Kèm đọc
   * to TÊN khai cuộc bằng giọng Mỹ để bé quen tên quốc tế.
   */
  const selectOpening = useCallback(
    (id: string) => {
      const target = openingList.find((item) => item.id === id)
      setOpeningId(id)
      setOpeningPreview(true)
      setGoalFocus(false)
      if (target) speakOpening(target.englishName, target.gm)
    },
    [openingList],
  )

  /** Rời chế độ xem trước để bắt đầu bài từ nước đầu. */
  const startLearning = useCallback(() => {
    setOpeningPreview(false)
    setGoalFocus(false)
    setPly(0)
    setHintVisible(true)
    setWrongInfo(null)
    setFinished(false)
  }, [])

  /**
   * Bật/tắt “soi mục tiêu khai cuộc”: bàn cờ tô tím đúng những ô câu `goal` nhắc tới.
   * Tắt luôn chế độ xem trước/soi kế hoạch để bàn cờ quay về đúng thế cờ đang học.
   */
  const toggleGoalFocus = useCallback(() => {
    setPlanFocusIdx(null)
    setOpeningPreview(false)
    setGoalFocus((value) => !value)
  }, [])

  const moves = useMemo(() => opening?.moves ?? [], [opening])
  const totalPlies = moves.length
  const atLeaf = ply >= totalPlies

  const isKidPly = useCallback(
    (index: number) => (opening ? (opening.side === 'white' ? index % 2 === 0 : index % 2 === 1) : false),
    [opening],
  )

  const totalKidMoves = moves.filter((_, index) => isKidPly(index)).length

  /** FEN sau mỗi ply: fens[i] = thế cờ khi đã đi i nửa nước. */
  const fens = useMemo(() => {
    const game = new Chess()
    const list = [game.fen()]
    for (let index = 0; index < ply && index < totalPlies; index += 1) {
      try {
        game.move(moves[index].san)
      } catch {
        break
      }
      list.push(game.fen())
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves, ply, totalPlies])

  // Đổi bài hoặc đổi chế độ → chơi lại từ đầu.
  useEffect(() => {
    setPly(0)
    setHintVisible(mode === 'learn')
    setWrongInfo(null)
    setFinished(false)
    setAutoPlay(false)
    setPlanFocusIdx(null)
    setGoalFocus(false)
    awardedRef.current = false
    replyAfterDropRef.current = false
  }, [openingId, mode])

  // Đi tới/lui nước nào thì tự thoát chế độ soi kế hoạch, để bé quay về đúng bài.
  useEffect(() => {
    setPlanFocusIdx(null)
  }, [ply])

  /**
   * Đối thủ tự đi trong 2 chế độ luyện. Ở chế độ "Học từng bước" đối thủ chỉ đáp
   * trả sau khi bé vừa kéo quân của mình, còn lúc bé bấm ◀ ▶ thì vẫn đi từng nước
   * để bé kịp nhìn.
   */
  useEffect(() => {
    if (!opening || openingPreview || autoPlay || atLeaf) return
    if (isKidPly(ply)) return
    if (mode === 'learn' && !replyAfterDropRef.current) return
    const timer = setTimeout(() => {
      replyAfterDropRef.current = false
      setPly((current) => current + 1)
    }, 600)
    return () => clearTimeout(timer)
  }, [mode, autoPlay, ply, opening, atLeaf, isKidPly, openingPreview])

  // Tự động chạy trong chế độ học.
  useEffect(() => {
    if (mode !== 'learn' || !autoPlay || !opening) return
    if (atLeaf) {
      setAutoPlay(false)
      return
    }
    const timer = setTimeout(() => setPly((current) => current + 1), 1300)
    return () => clearTimeout(timer)
  }, [mode, autoPlay, ply, opening, atLeaf])

  /** Bé đi đúng hết bài → tặng Cúp Vàng. */
  useEffect(() => {
    if (mode === 'learn' || !opening || finished || ply === 0) return
    if (!atLeaf) return
    setFinished(true)
    setAutoPlay(false)
    if (awardedRef.current) return
    awardedRef.current = true
    const stars = 6
    completeActivity(`openings:${opening.id}:memorize`, stars)
    if (soundOn) playWin()
    setConfetti(true)
    setResult({
      emoji: '🏆',
      title: 'Cúp Vàng thuộc về bé!',
      message: `Bé đã thuộc trọn vẹn ${opening.name} của ${opening.gm}!`,
      stars,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, mode, opening, finished, atLeaf])

  /**
   * Nước đi kế tiếp theo dòng chính. `mine` = nước này thuộc về bé (bé cầm quân đi
   * được), dùng để tô sáng quân cần đi cho bé dễ kéo.
   */
  const hintMove = useMemo(() => {
    if (atLeaf) return null
    if (mode !== 'learn' && !isKidPly(ply)) return null
    try {
      const probe = new Chess(fens[ply])
      const move = probe.move(moves[ply].san)
      return { from: move.from, to: move.to, mine: isKidPly(ply) }
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atLeaf, moves, ply, mode, fens, isKidPly])

  /**
   * Thế cờ CUỐI dòng chính - đúng chỗ "kế hoạch trung cuộc" bắt đầu có nghĩa.
   * Tính sẵn từ dòng chính nên không phụ thuộc bé đang đứng ở nước thứ mấy.
   */
  const finalFen = useMemo(() => {
    const game = new Chess()
    for (const move of moves) {
      try {
        game.move(move.san)
      } catch {
        break
      }
    }
    return game.fen()
  }, [moves])

  /** Khai cuộc đang chọn trong modal ôn mẫu hình (độc lập với bài đang học). */
  const patternOpening = useMemo(
    () => openingList.find((item) => item.id === patternId) ?? openingList[0],
    [openingList, patternId],
  )

  /** Thế cờ CUỐI của một dòng chính bất kỳ - dùng cho modal ôn mẫu hình. */
  const fenAfterMoves = useCallback((list: readonly { san: string }[]) => {
    const game = new Chess()
    for (const move of list) {
      try {
        game.move(move.san)
      } catch {
        break
      }
    }
    return game.fen()
  }, [])

  const patternFen = useMemo(
    () => (patternOpening ? fenAfterMoves(patternOpening.moves) : null),
    [patternOpening, fenAfterMoves],
  )

  const openPatterns = () => {
    setPatternSide(side)
    setPatternId(opening?.id ?? sideOpenings[0]?.id ?? 'london')
    setPatternOpen(true)
  }

  // Đóng modal bằng phím Esc cho tiện (ba mẹ không phải với tay bấm ✕).
  useEffect(() => {
    if (!patternOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPatternOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [patternOpen])

  /**
   * Ô cờ + mũi tên của từng câu kế hoạch - đọc thẳng từ chính câu viết tay nên
   * không có dữ liệu trùng lặp nào phải bảo trì thêm.
   */
  const planFocusList = useMemo(
    () => (opening?.plan.points ?? []).map((point) => parsePlanFocus(point)),
    [opening],
  )

  /**
   * Bé đang **soi một câu kế hoạch**: bàn cờ tạm chuyển sang thế cờ cuối khai cuộc
   * để câu kế hoạch nói về đúng thế cờ bé đang nhìn (không phải thế cờ ban đầu).
   */
  const planPreview = planFocusIdx !== null ? (planFocusList[planFocusIdx] ?? null) : null
  /** Đang xem thế cờ CUỐI khai cuộc: hoặc do soi câu kế hoạch, hoặc do vừa bấm khai cuộc. */
  const previewing = planPreview !== null || openingPreview
  const boardFen = previewing ? finalFen : fens[ply]

  /** Bôi tím những ô mà câu kế hoạch đang chọn nhắc tới. */
  const planSquareStyles = useMemo(() => {
    if (!planPreview || planPreview.squares.length === 0) return undefined
    const styles: Record<string, CSSProperties> = {}
    for (const square of planPreview.squares) styles[square] = PLAN_FOCUS_STYLE
    return styles
  }, [planPreview])

  /**
   * Mũi tên "từ ô này sang ô kia" của câu kế hoạch. Chỉ vẽ khi nước đó **đi được
   * thật** trên thế cờ cuối, nên dữ liệu sai cũng không thể vẽ ra mũi tên bịa.
   */
  const planArrow = useMemo(() => {
    const arrow = planPreview?.arrow
    if (!arrow || !opening) return null
    return isSideMoveLegal(finalFen, opening.side, arrow.from, arrow.to) ? arrow : null
  }, [planPreview, finalFen, opening])

  /**
   * Mục tiêu của cả khai cuộc (`opening.goal`) đọc ra ô cờ + mũi tên. Dùng lại
   * `parsePlanFocus` nên KHÔNG cần thêm dữ liệu: câu viết tay đã nhắc ô nào thì
   * bàn cờ tô ô đó.
   */
  const goalFocusInfo = useMemo(() => parsePlanFocus(opening?.goal ?? ''), [opening])

  /** Bôi tím những ô mà mục tiêu khai cuộc nhắc tới - soi trên THẾ CỜ ĐANG ĐỨNG. */
  const goalSquareStyles = useMemo(() => {
    if (!goalFocus || previewing || goalFocusInfo.squares.length === 0) return undefined
    const styles: Record<string, CSSProperties> = {}
    for (const square of goalFocusInfo.squares) styles[square] = PLAN_FOCUS_STYLE
    return styles
  }, [goalFocus, previewing, goalFocusInfo])

  /** Mũi tên mục tiêu - chỉ vẽ khi nước ấy đi được thật trên thế cờ đang đứng. */
  const goalArrow = useMemo(() => {
    if (!goalFocus || previewing || !opening) return null
    const aim = goalFocusInfo.arrow
    if (!aim) return null
    return isSideMoveLegal(fens[ply], opening.side, aim.from, aim.to) ? aim : null
  }, [goalFocus, previewing, opening, goalFocusInfo, fens, ply])

  const arrow = useMemo(() => {
    // Đang soi kế hoạch: bàn cờ đang ở thế cờ KHÁC, nên mũi tên gợi ý của bài phải
    // nhường chỗ cho mũi tên của câu kế hoạch.
    if (previewing) {
      return planArrow
        ? [{ startSquare: planArrow.from, endSquare: planArrow.to, color: ARROW_COLOR }]
        : []
    }
    // Đang soi MỤC TIÊU khai cuộc: mũi tên tím chỉ tới ô bé muốn nhắm, để bé không
    // bị lẫn với mũi tên vàng của nước đang học.
    if (goalFocus) {
      return goalArrow
        ? [{ startSquare: goalArrow.from, endSquare: goalArrow.to, color: GOAL_ARROW_COLOR }]
        : []
    }
    return hintVisible && hintMove
      ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
      : []
  }, [previewing, planArrow, goalFocus, goalArrow, hintVisible, hintMove])

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

  /**
   * Nước đi VỪA HIỆN trên bàn, để **bàn cờ đọc to**: `Ne3` → "Knight E 3".
   * Đọc MỌI nước khi dòng khai cuộc tiến lên (nước của bé lẫn nước đối thủ tự đi),
   * để bé quen tai với cách đọc cờ quốc tế. Khi đang soi kế hoạch thì bàn cờ ở thế
   * cờ khác nên không đọc.
   */
  const announceSan = !previewing && ply > 0 ? (moves[ply - 1]?.san ?? null) : null

  /** Vệt vàng của nước vừa đi + vệt gợi ý quân cần đi, hoặc vệt tím của câu kế hoạch. */
  const squareStyles = useMemo(() => {
    if (previewing) return planSquareStyles ?? {}
    // Soi mục tiêu thì chỉ hiện ô mục tiêu, tạm ẩn vệt gợi ý nước đi cho đỡ rối mắt.
    if (goalFocus) return goalSquareStyles ?? {}
    return { ...lastMoveSquares, ...hintSquares }
  }, [previewing, planSquareStyles, goalFocus, goalSquareStyles, lastMoveSquares, hintSquares])

  const bannerState = useMemo(() => {
    if (!opening || atLeaf) {
      if (wrongInfo) return { ...wrongInfo, variant: 'wrong' as const }
      if (ply === 0 || !opening) return null
      const node = moves[ply - 1]
      return {
        annotation: node.annotation ?? {
          san: node.san,
          piece: pieceFromSan(node.san),
          reason: 'Nước của đối thủ - bé xem rồi đi tiếp nhé.',
          rhyme: 'Đối thủ vừa đi',
        },
        plyIndex: ply - 1,
        variant: 'opponent' as const,
      }
    }
    if (wrongInfo) {
      return { ...wrongInfo, variant: 'wrong' as const }
    }
    if (mode === 'learn') {
      const node = moves[ply]
      return {
        annotation: node.annotation ?? {
          san: node.san,
          piece: pieceFromSan(node.san),
          reason: 'Nước của đối thủ - bé xem rồi đi tiếp nhé.',
          rhyme: 'Đối thủ vừa đi',
        },
        plyIndex: ply,
        variant: 'hint' as const,
      }
    }
    if (ply === 0) return null
    const node = moves[ply - 1]
    return {
      annotation: node.annotation ?? {
        san: node.san,
        piece: pieceFromSan(node.san),
        reason: 'Nước của đối thủ - bé xem rồi đi tiếp nhé.',
        rhyme: 'Đối thủ vừa đi',
      },
      plyIndex: ply - 1,
      variant: node.annotation ? ('played' as const) : ('opponent' as const),
    }
  }, [opening, wrongInfo, mode, ply, moves, atLeaf])

  /** Tiến / Lùi một nước - dùng chung cho nút bấm và phím mũi tên. */
  const goStep = useCallback(
    (delta: number) => {
      setAutoPlay(false)
      setOpeningPreview(false)
      replyAfterDropRef.current = false
      setWrongInfo(null)
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

  // ◀ ▼ lùi, ▶ ▲ tiến - chỉ trong chế độ “Học từng bước”.
  useArrowKeys({ enabled: mode === 'learn', onPrev: goBack, onNext: goForward })

  /** Hết phần khai cuộc (≈ 5 nước) là tới lúc dùng kế hoạch trung cuộc. */
  const playing = ply >= PLAN_PLY

  /**
   * Kế hoạch SINH TỰ ĐỘNG cho đúng thế cờ đang đứng (§4.4 mức 3).
   *
   * Hết phần khai cuộc mới hiện, vì lúc đó mới có việc để bàn. Việc tính được đẩy ra
   * khỏi đường render (hẹn giờ 0ms) để một phép tìm kiếm của engine không làm khựng
   * hiệu ứng quân cờ; đổi nước là huỷ kết quả cũ ngay.
   */
  const [livePlan, setLivePlan] = useState<LivePlan | null>(null)
  const [livePlanBusy, setLivePlanBusy] = useState(false)
  useEffect(() => {
    if (!opening || !playing) {
      setLivePlan(null)
      setLivePlanBusy(false)
      return
    }
    let cancelled = false
    setLivePlanBusy(true)
    const timer = setTimeout(() => {
      if (cancelled) return
      setLivePlan(buildLivePlan(fens[ply], opening.side))
      setLivePlanBusy(false)
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [opening, playing, fens, ply])

  if (isLoading || !opening) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
      </div>
    )
  }

  // Tới lượt bé thì bé kéo-thả quân của mình. Học từng bước cũng cho kéo-thả
  // như chế độ Luyện thuộc lòng.
  const kidTurn = isKidPly(ply) && !atLeaf
  // Đang soi kế hoạch thì bàn cờ chỉ để XEM - bé kéo quân lúc này là lạc đường.
  const interactive = kidTurn && !previewing

  const handleDrop = (from: string, to: string): boolean => {
    if (!interactive || !opening) return false
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
        reason: `Nước này chưa đúng rồi. Bé nhìn mũi tên vàng rồi thử lại nhé!`,
        rhyme: 'Bình tĩnh thử lại',
      }
      setWrongInfo({ annotation, plyIndex: ply })
      return false
    }
    // Đi đúng!
    if (soundOn) playMove()
    setWrongInfo(null)
    if (mode === 'learn') {
      replyAfterDropRef.current = true
    } else {
      setHintVisible(false)
    }
    setPly((current) => current + 1)
    return true
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái CHỈ có bàn cờ + băng giải thích → bàn cờ luôn to hết cỡ. */}
      <BoardStage
        reserve={268}
        board={
          <ChessBoardPanel
            fen={boardFen}
            orientation={opening.side}
            playerSide={opening.side}
            interactive={interactive}
            heatmap={heatmap}
            arrows={arrow}
            extraSquareStyles={squareStyles}
            announce={announceSan}
            onDrop={handleDrop}
          />
        }
        under={
          <div className="grid gap-2">
            {/* Banner Giải Thích Siêu Ngắn luôn nằm NGAY DƯỚI bàn cờ. */}
            {planPreview ? (
              <div
                id="kid-plan-preview-note"
                className="rounded-2xl border-2 border-dashed border-[#6d5bc7] bg-[rgba(126,106,209,0.10)] p-2.5 text-center text-sm font-bold text-brand-800"
              >
                📍 Bé đang xem thế cờ CUỐI khai cuộc — ô tím là việc của câu vừa bấm
              </div>
            ) : openingPreview ? (
              <div
                id="kid-opening-preview"
                className="grid gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-2.5 text-center"
              >
                <p className="text-sm font-extrabold text-brand-800">
                  {opening.emoji} {opening.name} · thế cờ mẫu hình của {opening.gm}
                </p>
                <p className="text-[0.7rem] font-bold text-brand-500">
                  Đây là thế cờ cuối dòng chính — bé nhìn cho quen rồi bắt đầu học từ nước đầu nhé.
                </p>
                <div className="flex justify-center">
                  <KidButton
                    id="kid-opening-preview-start"
                    variant="primary"
                    size="sm"
                    onClick={startLearning}
                  >
                    ▶ Bắt đầu học từ đầu
                  </KidButton>
                </div>
              </div>
            ) : bannerState ? (
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
            )}
          </div>
        }
      />

      {/* Cột phải: tab chế độ, bản đồ leo cấp, điều khiển, mục tiêu… (tự cuộn) */}
      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          {/*
            `min-w-0` là BẮT BUỘC: đây là một ô của lưới Panel, mà ô lưới mặc định
            có min-width:auto nên sẽ nở rộng bằng cả câu `nowrap` của tiêu đề làm cả
            trang tràn ngang.
          */}
          <div className="relative flex min-w-0 flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
            <div className="min-w-0 flex-1">
              <SectionTitle
                icon="🛡️"
                title="Khai cuộc Grand Master"
                subtitle={`Đang học: ${opening.name} · ${opening.gm}`}
                info={`opening:${opening.id}`}
              />
            </div>
            <EyeToggle
              className="shrink-0"
              on={heatmap}
              onToggle={toggleHeatmap}
            />
          </div>
          <Segmented
            options={MODES.map((m) => ({
              value: m.value,
              label: m.value === 'memorize' ? `Luyện ${totalKidMoves} bước` : m.label,
              icon: m.icon,
            }))}
            value={mode}
            onChange={(next) => {
              setOpeningPreview(false)
              setMode(next)
            }}
            size="sm"
          />
        </Panel>

        {/*
          “Bé muốn gì?” - ý niệm bao trùm của cả khai cuộc. Đặt ngay dưới phần chọn
          chế độ để bé đọc trước khi học từng nước, và bấm được để soi ô mục tiêu.
        */}
        <Panel id="kid-opening-goal" className="grid gap-2">
          <SectionTitle
            icon="🎯"
            title="Bé muốn gì với khai cuộc này?"
            subtitle={
              goalFocus && !previewing
                ? 'Ô tím trên bàn cờ là những gì bé đang nhắm tới'
                : 'Câu trả lời gọn cho “mình ra quân kiểu này để làm gì?”'
            }
            info="goal"
          />
          <button
            type="button"
            data-opening-goal
            aria-pressed={goalFocus && !previewing}
            onClick={toggleGoalFocus}
            className={`grid gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-left transition-all active:translate-y-[1px] ${
              goalFocus && !previewing
                ? 'border-[#6d5bc7] bg-[rgba(126,106,209,0.14)]'
                : 'border-gold-300 bg-gold-50 hover:border-gold-400'
            }`}
          >
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-lg" aria-hidden>
                {opening.emoji}
              </span>
              <span className="text-sm font-extrabold text-brand-900">{opening.goal}</span>
            </span>
            <span className="text-[0.7rem] font-bold text-brand-500">
              {goalFocusInfo.squares.length > 0
                ? goalFocus && !previewing
                  ? '👆 Bấm để tắt - quay về nước đang học'
                  : '👆 Bấm để tô sáng các ô bé muốn nhắm trên bàn cờ'
                : '💡 Đọc câu này trước khi học từng nước nhé'}
            </span>
          </button>
        </Panel>

        <Panel className="grid gap-2">
          <Segmented
            options={SIDE_OPTIONS}
            value={side}
            onChange={changeSide}
            size="sm"
          />
          <div id="kid-opening-move-filter" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-opening-move-filter="all"
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
            {openMoveFilters.map(({ move, label }) => {
              const active = moveFilter === move
              return (
                <button
                  key={move}
                  type="button"
                  data-opening-move-filter={move}
                  aria-pressed={active}
                  onClick={() => {
                    setMoveFilter(move)
                    setOpeningPreview(false)
                    const first = sideOpenings.find((item) => kidFirstMove(item) === move)
                    if (first) setOpeningId(first.id)
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
          <ProgressMap
            nodes={curriculum
              .filter((entry) => !moveFilter || kidFirstMove(entry.item) === moveFilter)
              .map((entry) => ({
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
            onSelect={selectOpening}
            allowLockedPreview
            title={side === 'white' ? 'Khai cuộc quân Trắng' : 'Khai cuộc quân Đen'}
            unitLabel="bài"
            allDoneMessage={
              side === 'white'
                ? 'Bé đã phá đảo toàn bộ khai cuộc Trắng! 🏆'
                : 'Bé đã phá đảo toàn bộ khai cuộc Đen! 🏆'
            }
            info="cup"
          />
          <div className="flex flex-wrap gap-1.5">
            <KidButton
              id="kid-openings-patterns"
              variant="sky"
              size="sm"
              onClick={openPatterns}
            >
              🧩 Ôn mẫu hình cuối khai cuộc
            </KidButton>
            <KidButton
              id="kid-opening-vs"
              variant="grass"
              size="sm"
              onClick={() =>
                navigate({ to: '/counters', search: { vs: `vs-${opening.id}` } })
              }
              title="Xem đối thủ chơi khai cuộc này thì mình đáp lại thế nào"
            >
              🧭 Bạn chơi khai cuộc này thì sao?
            </KidButton>
          </div>
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
                  disabled={atLeaf}
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
                  onClick={() => {
                    setGoalFocus(false)
                    setHintVisible(true)
                  }}
                  disabled={(hintVisible && !goalFocus) || atLeaf}
                >
                  💡 Gợi ý
                </KidButton>
                <KidButton
                  variant="ghost"
                  onClick={() => {
                    replyAfterDropRef.current = false
                    setPly(0)
                    setHintVisible(false)
                    setWrongInfo(null)
                    setFinished(false)
                    awardedRef.current = false
                  }}
                >
                  🔄 Chơi lại
                </KidButton>
              </>
            )}
          </div>

          {mode === 'learn' && (
            <div className="flex items-center gap-1.5 text-[0.7rem] font-bold text-brand-400">
              🖐️ Kéo quân viền vàng sang viền xanh · ⌨️ hoặc bấm ◀ ▶ ▲ ▼
              <InfoButton topic="board" />
            </div>
          )}
        </Panel>

        {/* Kế hoạch tiếp theo: việc bé cần làm sau khi hết phần khai cuộc đã học. */}
        {opening.plan.points.length > 0 && (
          <Panel id="kid-opening-plan" className="grid gap-2">
            <SectionTitle
              icon="🧭"
              title={opening.plan.title}
              subtitle={
                previewing
                  ? 'Đang xem thế cờ CUỐI khai cuộc'
                  : playing
                    ? 'Đã tới lúc áp dụng!'
                    : 'Bấm một việc để xem thế cờ cuối khai cuộc'
              }
              info="plan"
            />
            <ul className="grid gap-1">
              {opening.plan.points.map((point, index) => {
                const focus = planFocusList[index]
                const active = planFocusIdx === index
                // Câu không nhắc ô nào thì để nguyên dạng chữ, không bấm được.
                if (!focus || focus.squares.length === 0) {
                  return (
                    <li key={point} className="flex gap-1.5 text-xs font-bold text-brand-700">
                      <span aria-hidden className="text-gold-500">
                        ◆
                      </span>
                      <span>{point}</span>
                    </li>
                  )
                }
                return (
                  <li key={point}>
                    <button
                      type="button"
                      data-plan-point={index}
                      aria-pressed={active}
                      onClick={() => {
                        setGoalFocus(false)
                        setPlanFocusIdx(active ? null : index)
                      }}
                      title="Bấm để xem thế cờ cuối khai cuộc và soi ô của việc này"
                      className={`flex w-full items-start gap-1.5 rounded-xl px-2 py-1 text-left text-xs font-bold transition-all active:translate-y-[1px] ${
                        active
                          ? 'border-2 border-[#6d5bc7] bg-[rgba(126,106,209,0.14)] text-brand-900'
                          : 'border-2 border-transparent text-brand-700 hover:bg-brand-50'
                      }`}
                    >
                      {/* Số thứ tự việc: bé nhớ “việc 1, việc 2…” dễ hơn nhớ cả câu. */}
                      <span
                        aria-hidden
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-extrabold ${
                          active ? 'bg-[#6d5bc7] text-white' : 'bg-brand-100 text-brand-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        {point}
                        {/* Nước “từ ô này sang ô kia” - chỉ hiện khi nước đó đi được thật. */}
                        {active && planArrow && (
                          <b className="ml-1 inline-block rounded-md bg-[rgba(126,106,209,0.18)] px-1 py-0.5 text-[0.65rem] font-extrabold text-brand-700">
                            {planArrow.from} → {planArrow.to}
                          </b>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {planFocusList.some((focus) => focus.squares.length > 0) && (
              <p className="flex flex-wrap items-center gap-1.5 text-[0.7rem] font-bold text-brand-400">
                {previewing
                  ? '📍 Bàn cờ đang xem thế cờ cuối khai cuộc - ô tím là việc của câu này'
                  : '👆 Bấm một việc để xem thế cờ cuối khai cuộc và soi ô trên bàn'}
                {previewing && (
                  <button
                    type="button"
                    id="kid-plan-preview-off"
                    onClick={() => setPlanFocusIdx(null)}
                    className="rounded-full border-2 border-brand-100 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-brand-500 hover:border-brand-300"
                  >
                    Quay lại bài học
                  </button>
                )}
              </p>
            )}
          </Panel>
        )}

        {/*
          Kế hoạch SINH TỰ ĐỘNG theo đúng thế cờ đang đứng (§4.4 mức 3): engine đọc
          thế cờ rồi nói ra việc cần làm ngay - khác hẳn 3 câu viết tay ở trên.
        */}
        {playing && (
          <Panel id="kid-live-plan" className="grid gap-2">
            <SectionTitle
              icon="🔎"
              title="Kế hoạch theo thế cờ hiện tại"
              subtitle={
                livePlan ? `Máy đọc thế cờ: ${livePlan.evalText}` : 'Máy đang đọc thế cờ…'
              }
              info="plan"
            />
            {livePlanBusy && !livePlan && (
              <p className="rounded-xl bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-500">
                ⏳ Máy đang tính nước tốt nhất cho thế cờ này…
              </p>
            )}
            {livePlan && (
              <ul id="kid-live-plan-items" className="grid gap-1">
                {livePlan.items.map((item) => (
                  <li
                    key={item.text}
                    data-kind={item.kind}
                    className={`flex gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold ${LIVE_PLAN_STYLE[item.kind]}`}
                  >
                    <span aria-hidden>{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
            {livePlan?.engineSan && (
              <p className="text-[0.7rem] font-bold text-brand-400">
                🤖 Nước máy đề xuất:{' '}
                <b className="text-brand-700">{livePlan.engineSan}</b> ·{' '}
                {livePlan.mood === 'better'
                  ? 'bé đang hơn'
                  : livePlan.mood === 'worse'
                    ? 'bé đang kém'
                    : 'thế cân bằng'}
              </p>
            )}
          </Panel>
        )}

        <HangingWarnings
          fen={fens[ply]}
          viewpoint={opening.side}
          enabled={heatmap}
        />

        {/*
          Một khối duy nhất cho “bài đang học + các nước cần thuộc”: trước đây là
          hai Panel, mỗi Panel một SectionTitle 44px - gộp lại là hết cuộn.
        */}
        <Panel className="grid gap-2">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <SectionTitle
              icon={opening.emoji}
              title={`${opening.name} · ${opening.englishName}`}
              subtitle={`${opening.gm} - ${opening.tagline}`}
            />
            <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[0.7rem] font-extrabold text-brand-600 ring-1 ring-sand-200">
              🎯 thuộc {totalKidMoves} nước
            </span>
          </div>

          {opening.side === 'black' && (
            <p className="rounded-xl bg-info-50 px-2.5 py-1.5 text-center text-[0.7rem] font-extrabold text-info-700">
              🔄 Bàn cờ đã tự xoay 180° vì bé đang cầm quân Đen - hàng 7, 8 nằm sát bé rồi!
            </p>
          )}

          <MoveStrip
            moves={moves}
            side={opening.side}
            ply={ply}
            notation={notation}
            onJump={
              mode === 'learn'
                ? (index) => {
                    if (index >= ply) return
                    replyAfterDropRef.current = false
                    setAutoPlay(false)
                    setWrongInfo(null)
                    setPly(index)
                  }
                : undefined
            }
          />

          <div className="flex flex-wrap gap-1.5">
            {moves
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

          <p className="text-[0.7rem] font-bold text-brand-400">
            {mode === 'learn'
              ? '🎯 Bấm Tiến để xem từng nước kèm khẩu quyết vè.'
              : '🎯 Bé kéo thả đúng từng nước để nhận Cúp Vàng 🏆.'}
          </p>
        </Panel>
      </div>

      {/*
        Modal “Ôn mẫu hình”: xem thế cờ CUỐI của từng khai cuộc mà KHÔNG phải đi lại
        từng nước - bé mở ra liếc một cái là nhớ lại mẫu hình quân đứng ở đâu.
      */}
      {patternOpen && patternOpening && patternFen && (
        <div
          id="kid-patterns-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Ôn mẫu hình cuối khai cuộc"
          className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-brand-950/55 p-3 backdrop-blur-sm"
          onClick={() => setPatternOpen(false)}
        >
          <div
            className="animate-pop-in my-auto grid w-full max-w-3xl gap-3 rounded-[1.6rem] border-[5px] border-white bg-white p-3 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="min-w-0 text-base font-extrabold text-brand-900 sm:text-xl">
                🧩 Mẫu hình cuối khai cuộc
              </h3>
              <KidButton
                id="kid-patterns-close"
                variant="ghost"
                size="sm"
                onClick={() => setPatternOpen(false)}
              >
                ✕ Đóng
              </KidButton>
            </div>

            <p className="text-xs font-bold text-brand-500">
              👆 Bấm một khai cuộc để xem thế cờ CUỐI của nó - ôn lại mẫu hình mà không
              phải đi lại từng nước.
            </p>

            <Segmented
              options={SIDE_OPTIONS}
              value={patternSide}
              onChange={(next) => {
                setPatternSide(next)
                const first = openingList.find((item) => item.side === next)
                if (first) setPatternId(first.id)
              }}
              size="sm"
            />

            <div id="kid-patterns-list" className="flex flex-wrap gap-1.5">
              {openingList
                .filter((item) => item.side === patternSide)
                .map((item) => {
                  const active = item.id === patternId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-pattern-id={item.id}
                      aria-pressed={active}
                      onClick={() => setPatternId(item.id)}
                      className={`flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-[0.7rem] font-extrabold transition-all active:translate-y-[2px] ${
                        active
                          ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                          : 'border-brand-100 bg-white text-brand-600 hover:border-brand-300'
                      }`}
                    >
                      <span aria-hidden>{item.emoji}</span>
                      <span className="max-w-[11rem] truncate">{item.name}</span>
                    </button>
                  )
                })}
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
              <div className="mx-auto w-full max-w-[24rem]">
                <ChessBoardPanel
                  fen={patternFen}
                  orientation={patternOpening.side}
                  playerSide={patternOpening.side}
                  interactive={false}
                  boardId="kid-board-pattern"
                />
              </div>

              <div className="grid gap-2">
                <div className="text-sm font-extrabold text-brand-900">
                  {patternOpening.emoji} {patternOpening.name}
                </div>
                <div className="text-xs font-bold text-brand-500">
                  {patternOpening.gm}
                  {patternOpening.side === 'white' ? ' · ⬜ Bé cầm Trắng' : ' · ⬛ Bé cầm Đen'}
                </div>
                <div
                  id="kid-pattern-line"
                  className="rounded-2xl bg-brand-50 px-2.5 py-1.5 font-mono text-[0.7rem] font-bold leading-relaxed text-brand-700"
                >
                  {patternOpening.moves.map((move) => move.san).join(' ')}
                </div>
                <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs font-bold text-gold-900">
                  🎯 Bé muốn gì: {patternOpening.goal}
                </div>
                <div className="rounded-2xl border-2 border-dashed border-brand-100 px-2.5 py-1.5 text-xs font-bold text-brand-600">
                  <b className="text-brand-800">{patternOpening.plan.title}</b>
                  <ul className="mt-1 grid gap-0.5">
                    {patternOpening.plan.points.map((point) => (
                      <li key={point} className="flex gap-1.5 text-[0.7rem]">
                        <span aria-hidden className="text-gold-500">
                          ◆
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          awardedRef.current = false
        }}
      />
    </div>
  )
}
