import { useNavigate, useSearch } from '@tanstack/react-router'
import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { HangingWarnings } from '../components/HangingWarnings'
import { ProgressMap } from '../components/ProgressMap'
import { InfoButton } from '../components/InfoPopover'
import { MoveText } from '../components/MoveText'
import { KidButton, Panel, Segmented } from '../components/ui'
import { BoardStage } from '../components/BoardStage'
import { useArrowKeys } from '../hooks/useArrowKeys'
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
import { isSideMoveLegal, parsePlanFocus } from '../lib/planFocus'
import { playError, playMove, playWin } from '../lib/sound'
import { speakOpening } from '../lib/speech'
import { useKidProgress } from '../store/progress'
import type { CSSProperties } from 'react'
import type { MoveAnnotation, Opening, Side } from '../types'

/** Hai cột khai cuộc: bé cầm Trắng hay cầm Đen. */
const SIDE_OPTIONS: { value: Side; label: string; icon: string }[] = [
  { value: 'white', label: 'Bé cầm Trắng', icon: '⬜' },
  { value: 'black', label: 'Bé cầm Đen', icon: '⬛' },
]

const NO_OPENINGS: Opening[] = []

export function OpeningsPage() {
  const { data: openings, isLoading } = useOpeningsQuery()
  const { notation, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()

  /** Bài mặc định = bài đứng ĐẦU danh sách ưu tiên (xem `src/data/openings.ts`). */
  const [openingId, setOpeningId] = useState('italian')
  /** App chỉ còn MỘT cách học: đi từng bước kèm gợi ý (đã bỏ chế độ thuộc lòng). */
  const mode = 'learn' as const
  /** Cột khai cuộc đang xem: quân Trắng hay quân Đen. */
  const [side, setSide] = useState<Side>('white')
  /** Bộ lọc theo nước mở đầu của bé (null = xem tất cả). */
  const [moveFilter, setMoveFilter] = useState<string | null>(null)
  /**
   * Mở khung “Tham khảo thêm” (các khai cuộc ít gặp hơn). MẶC ĐỊNH ĐÓNG: bản đồ chỉ
   * bày 3 kiểu thông dụng nhất cho gọn, bé cần kiểu khác thì bấm mở - tránh loạn.
   */
  const [showExtras, setShowExtras] = useState(false)
  /** Số nửa nước (ply) bé đã đi. Mỗi khai cuộc chỉ có MỘT dòng chính. */
  const [ply, setPly] = useState(0)
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
   * MẶC ĐỊNH BẬT: mở tab Khai cuộc là các ô tím hiện sẵn để bé tra cứu nhanh, không
   * phải bấm gì; bé vẫn tắt được bằng nút “🎯 Bé muốn gì?”.
   */
  const [goalFocus, setGoalFocus] = useState(true)
  /**
   * Bé vừa bấm một khai cuộc trên bản đồ → bàn cờ hiện **thế cờ mẫu hình cuối dòng
   * chính** của khai cuộc đó để nhìn trước, rồi bấm “▶ Bắt đầu học” mới vào bài.
   *
   * MẶC ĐỊNH BẬT khi mở tab bằng đường dẫn thường: bài đã được chọn sẵn trên bản đồ
   * mà bàn cờ lại để thế ban đầu thì bé phải bấm lại đúng thẻ đó mới thấy mẫu hình -
   * nên giờ mở tab là thấy luôn thế cờ cuối của bài đang chọn. Riêng đường dẫn mang
   * `?opening=…` (nhảy từ tab Đối phó) thì vào thẳng bài, không chen mẫu hình.
   */
  const [openingPreview, setOpeningPreview] = useState(() => !search.opening)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
  } | null>(null)
  /** Modal “Ôn mẫu hình cuối khai cuộc”: xem thế cờ cuối của BẤT KỲ khai cuộc nào. */
  const [patternOpen, setPatternOpen] = useState(false)
  const [patternSide, setPatternSide] = useState<Side>('white')
  const [patternId, setPatternId] = useState('london')
  const awardedRef = useRef(false)
  const replyAfterDropRef = useRef(false)
  /**
   * Bé cầm Đen thì **Trắng đi trước** - nước mở đầu đó do app tự đi hộ bé, đúng
   * như cách Đen tự đáp khi bé cầm Trắng. Cờ này bật lúc VÀO BÀI để đối thủ chỉ tự
   * đi một lần duy nhất: bé bấm “◀ Lùi” về thế ban đầu để xem thì bàn cờ đứng yên,
   * không bị đẩy tới.
   */
  const openingReplyRef = useRef(false)

  const openingList = openings ?? NO_OPENINGS
  const opening: Opening | undefined = useMemo(
    () => openingList.find((item) => item.id === openingId) ?? openingList[0],
    [openingList, openingId],
  )

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang học khai cuộc nào.

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

  /**
   * Bản đồ chỉ bày **3 kiểu thông dụng nhất** của phe đang xem (thứ tự trong
   * `OPENINGS` đã xếp sẵn: gặp nhiều + dễ triển khai quân trước). Các kiểu còn lại
   * gom vào khung “Tham khảo thêm” mặc định đóng - bày hết 5 thẻ cùng lúc làm bé
   * rối, nhất là trên điện thoại.
   */
  const visibleOpenings = useMemo(
    () =>
      sideOpenings.filter((item) => !moveFilter || kidFirstMove(item) === moveFilter),
    [sideOpenings, moveFilter, kidFirstMove],
  )
  const mainOpenings = visibleOpenings.slice(0, 3)
  const extraOpenings = visibleOpenings.slice(3)
  /** Đang học một bài trong phần tham khảo → tự mở khung, không để bài bị ẩn. */
  const extrasOpen = showExtras || extraOpenings.some((item) => item.id === opening?.id)

  /** Đổi phe: nhảy luôn sang bài đầu tiên của phe đó. */
  const changeSide = (next: Side) => {
    setSide(next)
    // Đổi phe = chọn bài đầu của phe đó → hiện luôn mẫu hình, giống lúc bấm thẻ.
    setOpeningPreview(true)
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
      setPlanFocusIdx(null)
      if (target) speakOpening(target.englishName, target.gm)
    },
    [openingList],
  )

  /**
   * Rời chế độ xem trước để bắt đầu bài từ nước đầu.
   */
  const startLearning = useCallback(() => {
    setOpeningPreview(false)
    setPly(0)
    openingReplyRef.current = true
    setHintVisible(true)
    setWrongInfo(null)
    setFinished(false)
  }, [])

  /**
   * Bấm **Enter** ở tab Khai cuộc = bấm “▶ Bắt đầu học” - bé/ba mẹ đang xem mẫu
   * hình hay đang lướt bản đồ rồi gõ Enter là vào bài luôn, không phải với chuột
   * xuống đúng nút nhỏ.
   *
   * Bỏ qua khi con trỏ đang nằm trong nút/ô nhập (lúc đó Enter đã là “bấm” của
   * chính nó - bấm hai lần sẽ nhảy cóc), và khi đang mở khung mẫu hình hoặc bảng
   * chúc mừng (Enter lúc đó thuộc về khung đang mở).
   */
  useEffect(() => {
    if (patternOpen || result) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('button, a, input, textarea, select, [contenteditable="true"]')
      ) {
        return
      }
      event.preventDefault()
      startLearning()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [patternOpen, result, startLearning])

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

  // Đổi bài hoặc đổi chế độ → chơi lại từ đầu. Ô tím mục tiêu giữ nguyên trạng
  // thái bé đang chọn (mặc định bật) để đổi bài vẫn tra cứu nhanh được.
  useEffect(() => {
    setPly(0)
    setHintVisible(mode === 'learn')
    setWrongInfo(null)
    setFinished(false)
    setPlanFocusIdx(null)
    awardedRef.current = false
    replyAfterDropRef.current = false
    // Vào bài mới: nếu bé cầm Đen thì Trắng được đi nước mở đầu trước (xem effect
    // “đối thủ tự đi” bên dưới).
    openingReplyRef.current = true
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
    if (!opening || openingPreview || atLeaf) return
    if (isKidPly(ply)) return
    // Nước mở đầu của Trắng khi bé cầm Đen: bé chưa kéo quân nào nên không có
    // `replyAfterDropRef` - trước đây vì thế mà bàn cờ đứng im, Trắng không đi.
    const openingMove = ply === 0 && openingReplyRef.current
    if (mode === 'learn' && !replyAfterDropRef.current && !openingMove) return
    const timer = setTimeout(() => {
      replyAfterDropRef.current = false
      openingReplyRef.current = false
      setPly((current) => current + 1)
    }, 600)
    return () => clearTimeout(timer)
  }, [mode, ply, opening, atLeaf, isKidPly, openingPreview])

  /** Bé đi đúng hết bài → tặng Cúp Vàng. */
  useEffect(() => {
    if (mode === 'learn' || !opening || finished || ply === 0) return
    if (!atLeaf) return
    setFinished(true)
    if (awardedRef.current) return
    awardedRef.current = true
    if (soundOn) playWin()
    setConfetti(true)
    setResult({
      emoji: '🏆',
      title: 'Cúp Vàng thuộc về bé!',
      message: `Bé đã thuộc trọn vẹn ${opening.englishName} của ${opening.gm}!`,
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

  /** Rê chuột lên bàn cờ → hiện thế cờ CUỐI của khai cuộc đang chọn. */
  const openPatternPreview = () => {
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

  /**
   * Bôi tím những ô mà mục tiêu khai cuộc nhắc tới - soi trên THẾ CỜ ĐANG ĐỨNG,
   * và cả trên thế cờ mẫu hình khi bé vừa bấm một khai cuộc để tra cứu nhanh.
   */
  const goalSquareStyles = useMemo(() => {
    if (!goalFocus || planPreview || goalFocusInfo.squares.length === 0) return undefined
    const styles: Record<string, CSSProperties> = {}
    for (const square of goalFocusInfo.squares) styles[square] = PLAN_FOCUS_STYLE
    return styles
  }, [goalFocus, planPreview, goalFocusInfo])

  /** Mũi tên mục tiêu - chỉ vẽ khi nước ấy đi được thật trên thế cờ đang hiện. */
  const goalArrow = useMemo(() => {
    if (!goalFocus || planPreview || !opening) return null
    const aim = goalFocusInfo.arrow
    if (!aim) return null
    return isSideMoveLegal(boardFen, opening.side, aim.from, aim.to) ? aim : null
  }, [goalFocus, planPreview, opening, goalFocusInfo, boardFen])

  const arrow = useMemo(() => {
    // Đang soi kế hoạch: bàn cờ đang ở thế cờ KHÁC, nên mũi tên gợi ý của bài phải
    // nhường chỗ cho mũi tên của câu kế hoạch.
    if (planPreview) {
      return planArrow
        ? [{ startSquare: planArrow.from, endSquare: planArrow.to, color: ARROW_COLOR }]
        : []
    }
    // Đang xem thế cờ mẫu hình cuối khai cuộc: bàn cờ không còn ở thế cờ đang học
    // nên chỉ vẽ mũi tên mục tiêu (tím), không vẽ mũi tên vàng của nước đi.
    if (openingPreview) {
      return goalArrow
        ? [{ startSquare: goalArrow.from, endSquare: goalArrow.to, color: GOAL_ARROW_COLOR }]
        : []
    }
    // Ô mục tiêu vẫn tô tím, NHƯNG mũi tên vàng của nước đang học được ưu tiên -
    // bé cần biết phải đi quân nào trước đã. Mũi tên tím chỉ hiện khi không có gợi ý.
    if (hintVisible && hintMove) {
      return [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
    }
    return goalFocus && goalArrow
      ? [{ startSquare: goalArrow.from, endSquare: goalArrow.to, color: GOAL_ARROW_COLOR }]
      : []
  }, [planPreview, openingPreview, planArrow, goalFocus, goalArrow, hintVisible, hintMove])

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
    if (planPreview) return planSquareStyles ?? {}
    // Đang xem thế cờ mẫu hình: không có vệt nước đi (bàn cờ khác thế), chỉ tô tím
    // ô mục tiêu để bé tra cứu nhanh khai cuộc.
    if (previewing) return goalSquareStyles ?? {}
    // Ô mục tiêu tô tím, vẫn giữ vệt gợi ý nước đang học trên ô của nước đó.
    if (goalFocus) return { ...lastMoveSquares, ...goalSquareStyles, ...hintSquares }
    return { ...lastMoveSquares, ...hintSquares }
  }, [previewing, planPreview, planSquareStyles, goalFocus, goalSquareStyles, lastMoveSquares, hintSquares])

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

  if (isLoading || !opening) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
        <div className="card-pop h-40 animate-pulse bg-brand-100" />
      </div>
    )
  }

  // Tới lượt bé thì bé kéo-thả quân của mình. Học từng bước cũng cho kéo-thả
  // như cách bé vẫn kéo quân trong bài học.
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

  const patternOverlay = patternOpen && patternOpening && patternFen ? (
      <div
        id="kid-patterns-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Ôn mẫu hình cuối khai cuộc"
        className="pointer-events-none absolute inset-1 z-30 grid place-items-start overflow-y-auto rounded-[1.4rem] border-[5px] border-white bg-white/97 p-1.5 shadow-2xl"
        onClick={() => setPatternOpen(false)}
      >
        <div
          className="animate-pop-in pointer-events-auto grid w-full gap-1.5 rounded-2xl bg-white p-2"
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
                    className={`flex items-center gap-1 rounded-full border-2 px-2.5 py-1 text-xs font-extrabold transition-all active:translate-y-[2px] ${
                      active
                        ? 'border-brand-600 bg-brand-50 text-brand-800 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                        : 'border-brand-100 bg-white text-brand-600 hover:border-brand-300'
                    }`}
                  >
                    <span aria-hidden>{item.emoji}</span>
                    <span className="max-w-[11rem] truncate">{item.englishName}</span>
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
                {patternOpening.emoji} {patternOpening.englishName}
              </div>
              <div className="text-xs font-bold text-brand-600">{patternOpening.name}</div>
              <div className="text-xs font-bold text-brand-500">
                {patternOpening.gm}
                {patternOpening.side === 'white' ? ' · ⬜ Bé cầm Trắng' : ' · ⬛ Bé cầm Đen'}
              </div>
              <div
                id="kid-pattern-line"
                className="rounded-2xl bg-brand-50 px-2.5 py-1.5 font-mono text-xs font-bold leading-relaxed text-brand-700"
              >
                {patternOpening.moves.map((move) => move.san).join(' ')}
              </div>
              <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs font-bold text-gold-900">
                🎯 Bé muốn gì: <MoveText text={patternOpening.goal} />
              </div>
              <div className="rounded-2xl border-2 border-dashed border-brand-100 px-2.5 py-1.5 text-xs font-bold text-brand-600">
                <b className="text-brand-800">{patternOpening.plan.title}</b>
                <ul className="mt-1 grid gap-0.5">
                  {patternOpening.plan.points.map((point) => (
                    <li key={point} className="flex gap-1.5 text-xs">
                      <span aria-hidden className="text-gold-500">
                        ◆
                      </span>
                      <span>
                        <MoveText text={point} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
  ) : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái CHỈ có bàn cờ + băng giải thích → bàn cờ luôn to hết cỡ. */}
      <BoardStage
        reserve={268}
        board={
          // Không tự bung gì khi rê chuột: trước đây chỉ cần đưa chuột ngang bàn cờ là
          // khung mẫu hình bật lên, dễ bấm nhầm và che mất thế cờ bé đang học. Giờ bé
          // chủ động bấm nút 🧩 nhỏ ở hàng tên khai cuộc khi thật sự muốn xem.
          <div className="relative">
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
            {patternOverlay}
          </div>
        }
        under={
          <div className="grid gap-2">
            {/* Banner Giải Thích Siêu Ngắn luôn nằm NGAY DƯỚI bàn cờ. */}
            {planPreview ? (
              <div
                id="kid-plan-preview-note"
                className="rounded-2xl border-2 border-dashed border-info-600 bg-info-50 p-2.5 text-center text-sm font-bold text-brand-800"
              >
                📍 Bé đang xem thế cờ CUỐI khai cuộc — ô tím là việc của câu vừa bấm
              </div>
            ) : openingPreview ? (
              <div
                id="kid-opening-preview"
                className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-2.5 py-1.5 text-center"
              >
                <p className="min-w-0 text-xs font-extrabold text-brand-800">
                  {opening.emoji} {opening.englishName} · thế cờ cuối (mẫu hình)
                </p>
                <KidButton
                  id="kid-opening-preview-start"
                  variant="primary"
                  size="sm"
                  className="animate-attention"
                  title="Bắt đầu học từ nước đầu (hoặc bấm phím Enter)"
                  aria-keyshortcuts="Enter"
                  onClick={startLearning}
                >
                  ▶ Bắt đầu học
                </KidButton>
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
      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        {/*
          Chọn khai cuộc → Mindset → chế độ → nút điều khiển → phần dạy từng bước.
          Bé cần NHỚ Ý (mục tiêu + 3 việc) trước khi nhớ nước nào đi trước.

          CHỌN KHAI CUỘC nằm NGAY ĐẦU cột: đây là việc bé/ba mẹ làm nhiều nhất -
          liếc xem có những kiểu khai cuộc nào. Trước đây khung này nằm dưới cả
          chế độ lẫn mục tiêu, trên điện thoại phải cuộn thêm gần một màn hình.
        */}
        <Panel className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
          {/* Tên khai cuộc đang học + ⓘ lịch sử: đủ để tra cứu, không cần khung riêng. */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            {/*
              Tên QUỐC TẾ là tên chính (bé/ba mẹ tra sách, video, cơ sở dữ liệu cờ đều
              dùng tên này); tên tiếng Việt + Grand Master nằm ngay dưới cho dễ hiểu.
            */}
            <span className="min-w-0">
              <span className="block truncate text-sm font-extrabold text-brand-800">
                {opening.emoji} {opening.englishName}
              </span>
              <span className="block truncate text-xs font-bold text-brand-500">
                {opening.name} · {opening.gm}
              </span>
              {/*
                Chip số liệu THẬT (đo từ Lichess Opening Explorer): % số ván đi vào
                khai cuộc này, kèm tên nguồn ngay trên chip. Khai cuộc chưa có số đo
                thì không hiện gì - không dựng ô rỗng hay số ước lượng.
              */}
              {opening.popularity && (
                <span className="mt-0.5 flex items-center gap-0.5">
                  <span
                    title={`${opening.popularity.source} · đo ở thế ${opening.popularity.position}`}
                    className="shrink-0 rounded-full border border-brand-100 bg-brand-50 px-1.5 py-px text-xs font-extrabold leading-tight text-brand-600"
                  >
                    📊 ≈
                    {opening.popularity.percent.toLocaleString('vi-VN', {
                      maximumFractionDigits: 1,
                    })}
                    % ván · Lichess
                  </span>
                  <InfoButton topic="popularity" />
                </span>
              )}
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                id="kid-final-pattern"
                onClick={openPatternPreview}
                aria-label="Xem thế cờ cuối khai cuộc"
                title="Xem thế cờ cuối khai cuộc (mẫu hình bé cần đạt tới)"
                className="grid size-7 place-items-center rounded-full border-2 border-brand-100 bg-white text-sm leading-none transition-all hover:border-brand-400 active:translate-y-[1px]"
              >
                🧩
              </button>
              <InfoButton topic={`opening:${opening.id}`} />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Segmented
              options={SIDE_OPTIONS}
              value={side}
              onChange={changeSide}
              size="sm"
            />
            <EyeToggle className="shrink-0" on={heatmap} onToggle={toggleHeatmap} />
          </div>
          <div id="kid-opening-move-filter" className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-opening-move-filter="all"
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
                    // Lọc xong là mở bài đầu tiên của nhóm → hiện mẫu hình của bài đó.
                    setOpeningPreview(true)
                    const first = sideOpenings.find((item) => kidFirstMove(item) === move)
                    if (first) setOpeningId(first.id)
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
          {/* Một hàng gọn: tên bảng chọn + lối tắt Đối phó + mở “tham khảo thêm”. */}
          <div className="flex items-center gap-1.5">
            {/* `line-clamp-2`: trên điện thoại hàng này còn hai chip (+2, Đối phó) nên
                một dòng không đủ - cắt còn “KHAI CUỘC QUÂN…” thì bé mất chữ. Hai dòng
                vẫn gọn hơn một dòng bị cắt cụt. */}
            <p className="min-w-0 flex-1 line-clamp-2 text-xs font-extrabold uppercase leading-tight tracking-wide text-brand-500">
              🗺️ {side === 'white' ? 'Khai cuộc quân Trắng' : 'Khai cuộc quân Đen'}
            </p>
            {extraOpenings.length > 0 && (
              <button
                type="button"
                id="kid-opening-extras"
                aria-expanded={extrasOpen}
                aria-label={`Tham khảo thêm ${extraOpenings.length} kiểu khác`}
                title={`Tham khảo thêm ${extraOpenings.length} kiểu khác`}
                onClick={() => setShowExtras((open) => !open)}
                className="flex shrink-0 items-center gap-0.5 rounded-full border-2 border-dashed border-brand-200 px-2 py-0.5 text-xs font-extrabold text-brand-600 hover:border-brand-400"
              >
                📚 +{extraOpenings.length}
                <span aria-hidden>{extrasOpen ? '▲' : '▼'}</span>
              </button>
            )}
            <button
              type="button"
              id="kid-opening-vs"
              onClick={() =>
                navigate({ to: '/counters', search: { vs: `vs-${opening.id}` } })
              }
              title="Xem đối thủ chơi khai cuộc này thì mình đáp lại thế nào"
              className="shrink-0 rounded-full border-2 border-leaf-300 bg-leaf-50 px-2 py-0.5 text-xs font-extrabold text-leaf-800 hover:border-leaf-500"
            >
              🧭 Đối phó
            </button>
          </div>
          <ProgressMap
            nodes={mainOpenings.map((item, index) => ({
              id: item.id,
              level: index + 1,
              title: item.englishName,
              emoji: item.emoji,
              subtitle: `${item.name} · ${
                item.side === 'white' ? '⬜ Bé cầm Trắng' : '⬛ Bé cầm Đen'
              } · ${item.gm}`,
              // Nhãn dạy học + (nếu có) % số ván đo thật - hai thứ khác bản chất nên
              // đứng cạnh nhau trong cùng một dòng nhỏ dưới tên khai cuộc.
              tag: item.popularity
                ? `${item.rankNote} · ≈${item.popularity.percent.toLocaleString('vi-VN', {
                    maximumFractionDigits: 1,
                  })}%`
                : item.rankNote,
            }))}
            activeId={opening.id}
            onSelect={selectOpening}
            showNames
          />
          {extraOpenings.length > 0 && (
            <div className="grid gap-1.5">
              {/*
                Vẫn giữ trong DOM khi đóng (chỉ ẩn bằng CSS) để bàn phím và các bài
                kiểm vẫn thấy đủ danh sách khai cuộc.
              */}
              <div className={extrasOpen ? 'grid grid-cols-2 gap-1.5 sm:grid-cols-3' : 'hidden'}>
                {extraOpenings.map((item) => {
                  const isActive = opening.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-level-id={item.id}
                      data-opening-extra
                      aria-current={isActive}
                      onClick={() => selectOpening(item.id)}
                      className={`flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 text-left transition-all active:translate-y-[1px] ${
                        isActive
                          ? 'border-brand-600 bg-brand-50'
                          : 'border-sand-200 bg-white hover:border-brand-400'
                      }`}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {item.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-extrabold leading-tight text-brand-800">
                          {item.englishName}
                        </span>
                        <span className="block truncate text-xs font-bold text-brand-500">
                          {item.rankNote}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </Panel>

        {/*
          MỘT thẻ duy nhất cho “Bé muốn gì?” + ba việc cần nhớ - trước đây là hai
          khung riêng nên bé phải nối hai chỗ với nhau mới ra được mindset của bài.
          Đọc một mạch: mục tiêu (câu lớn) → 3 việc cụ thể. Không phải học thuộc
          chuỗi nước đi.
        */}
        <Panel id="kid-opening-goal" className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-1.5">
          {/*
            Bỏ khối tiêu đề to (icon 44px + 2 dòng mô tả): nội dung bên dưới đã tự
            nói rõ “Mục tiêu + ba việc”, nên chỉ cần một dòng nhãn mỏng.
          */}
          <div className="flex items-center gap-1.5">
            {/* `line-clamp-1` (không phải `truncate`): vẫn cắt gọn 1 dòng nhưng chữ
                được phép xuống dòng nên không kéo cả khung rộng quá màn hình. */}
            <p className="min-w-0 flex-1 line-clamp-1 text-xs font-extrabold uppercase tracking-wide text-brand-500">
              🧠 Mindset khai cuộc
            </p>
            <InfoButton topic="goal" />
          </div>
          <button
            type="button"
            data-opening-goal
            aria-pressed={goalFocus && !previewing}
            onClick={toggleGoalFocus}
            title={
              goalFocusInfo.squares.length > 0
                ? goalFocus && !previewing
                  ? 'Bấm để tắt các ô tím trên bàn cờ'
                  : 'Bấm để tô sáng các ô mục tiêu trên bàn cờ'
                : 'Mục tiêu của khai cuộc này'
            }
            className={`grid gap-1 rounded-xl border-2 px-2.5 py-2 text-left transition-all active:translate-y-[1px] ${
              goalFocus && !previewing
                ? 'border-info-600 bg-info-100'
                : 'border-gold-300 bg-gold-50 hover:border-gold-400'
            }`}
          >
            <span className="block text-sm font-extrabold leading-snug text-brand-900">
              <span aria-hidden className="mr-1">
                🎯
              </span>{' '}
              <span className="text-brand-500">Mục tiêu: </span>
              <MoveText text={opening.goal} />
            </span>
          </button>

          {opening.plan.points.length > 0 && (
            <>
              <div className="flex items-center gap-1.5">
                {/* Tên khối ba việc là chính cái “mindset” ("Giữ ô f7 trong tầm ngắm"),
                    nên không được cắt cụt - cho xuống tối đa 2 dòng. */}
                <p className="min-w-0 flex-1 line-clamp-2 text-xs font-extrabold uppercase leading-tight tracking-wide text-brand-500">
                  🧠 {opening.plan.title}
                </p>
                {/* Chỉ hiện khi bàn cờ đang ở thế cuối - thay cho dòng gợi ý dài cũ. */}
                {previewing && (
                  <button
                    type="button"
                    id="kid-plan-preview-off"
                    onClick={() => {
                      setPlanFocusIdx(null)
                      setOpeningPreview(false)
                    }}
                    className="shrink-0 rounded-full border-2 border-brand-100 px-1.5 py-0.5 text-xs font-extrabold text-brand-500 hover:border-brand-300"
                  >
                    ↩ Quay lại bài học
                  </button>
                )}
                <InfoButton topic="plan" />
              </div>
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
                      <span>
                        <MoveText text={point} />
                      </span>
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
                          ? 'border-2 border-info-600 bg-info-100 text-brand-900'
                          : 'border-2 border-transparent text-brand-700 hover:bg-brand-50'
                      }`}
                    >
                      {/* Số thứ tự việc: bé nhớ “việc 1, việc 2…” dễ hơn nhớ cả câu. */}
                      <span
                        aria-hidden
                        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                          active ? 'bg-info-600 text-white' : 'bg-brand-100 text-brand-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0">
                        <MoveText text={point} />
                        {/* Nước “từ ô này sang ô kia” - chỉ hiện khi nước đó đi được thật. */}
                        {active && planArrow && (
                          <b className="ml-1 inline-block rounded-md bg-info-200/60 px-1 py-0.5 text-xs font-extrabold text-brand-700">
                            {planArrow.from} → {planArrow.to}
                          </b>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            </>
          )}          <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-sand-200 pt-2">
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
              onClick={() => {
                replyAfterDropRef.current = false
                // Về đầu BÀI: bé cầm Đen thì Trắng lại đi nước mở đầu trước.
                openingReplyRef.current = true
                setPly(0)
              }}
            >
              🔄 Đầu
            </KidButton>
          </div>
        </Panel>

        <HangingWarnings
          fen={fens[ply]}
          viewpoint={opening.side}
          enabled={heatmap}
        />

      </div>

      {/*
        Modal “Ôn mẫu hình”: xem thế cờ CUỐI của từng khai cuộc mà KHÔNG phải đi lại
        từng nước - bé mở ra liếc một cái là nhớ lại mẫu hình quân đứng ở đâu.
      */}

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🏆'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        onClose={() => setResult(null)}
        onRetry={() => {
          setResult(null)
          replyAfterDropRef.current = false
          openingReplyRef.current = true
          setPly(0)
          setFinished(false)
          setHintVisible(mode === 'learn')
          setWrongInfo(null)
          awardedRef.current = false
        }}
      />
    </div>
  )
}
