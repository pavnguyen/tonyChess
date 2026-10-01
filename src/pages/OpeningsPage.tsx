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
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  formatSan,
  opponentAnnotation,
  pieceFromSan,
} from '../lib/notation'
import { buildLivePlan } from '../lib/livePlan'
import type { LivePlan, LivePlanItem } from '../lib/livePlan'
import {
  forksOf,
  mainLine,
  mainNodes,
  pathToMoves,
  plyLabel,
  repliesOf,
  treeDepth,
} from '../lib/openingTree'
import type { TreeFork } from '../lib/openingTree'
import { playError, playMove, playWin } from '../lib/sound'
import { useReportLesson } from '../store/lesson'
import { useKidProgress } from '../store/progress'
import type { CSSProperties } from 'react'
import type { MoveAnnotation, Opening, OpeningNode } from '../types'

type Mode = 'learn' | 'memorize'

const MODES: { value: Mode; label: string; icon: string }[] = [
  { value: 'learn', label: 'Học từng bước', icon: '📖' },
  { value: 'memorize', label: 'Luyện thuộc lòng', icon: '🧠' },
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
  const { notation, completeActivity, soundOn, stage } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap, checkMode } = useEyeCheck()

  const [openingId, setOpeningId] = useState('london')
  const [mode, setMode] = useState<Mode>('learn')
  /**
   * Đường đi bé đã chọn trong CÂY khai cuộc. Dùng đường đi thay cho "số ply" vì
   * cùng một ply có thể là nhiều nhánh khác nhau - chỉ đường đi mới biết bé đang
   * ở nhánh nào.
   */
  const [path, setPath] = useState<OpeningNode[]>([])
  const [autoPlay, setAutoPlay] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)
  const [confetti, setConfetti] = useState(false)
  const [wrongInfo, setWrongInfo] = useState<{
    annotation: MoveAnnotation
    plyIndex: number
  } | null>(null)
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)
  const awardedRef = useRef(false)

  const openingList = openings ?? NO_OPENINGS
  const opening: Opening | undefined = useMemo(
    () => openingList.find((item) => item.id === openingId) ?? openingList[0],
    [openingList, openingId],
  )

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang học khai cuộc nào.
  useReportLesson(opening ? `opening:${opening.id}` : null)

  // Bản đồ leo cấp: bài sau mở khi bé đã thuộc bài trước.
  const curriculum = useCurriculum(openingList, 'openings', ':memorize')

  const ply = path.length

  /** Các nước có thể đi tiếp ở thế hiện tại. Phần tử đầu là nhánh chính. */
  const replies = useMemo(() => (opening ? repliesOf(opening.tree, path) : []), [opening, path])
  const mainNode: OpeningNode | undefined = replies[0]
  const atLeaf = replies.length === 0

  /** FEN sau mỗi ply: fens[i] = thế cờ khi đã đi i nửa nước. */
  const fens = useMemo(() => {
    const game = new Chess()
    const list = [game.fen()]
    for (const node of path) {
      try {
        game.move(node.san)
      } catch {
        break
      }
      list.push(game.fen())
    }
    return list
  }, [path])

  const isKidPly = (index: number) =>
    opening ? (opening.side === 'white' ? index % 2 === 0 : index % 2 === 1) : false

  const totalKidMoves = opening
    ? opening.moves.filter((_, index) => isKidPly(index)).length
    : 0

  /** Mọi ngã ba của cây - để bé xem trước và nhảy nhanh sang nhánh khác. */
  const forks = useMemo(() => (opening ? forksOf(opening.tree) : []), [opening])

  // Đổi bài hoặc đổi chế độ → chơi lại từ đầu.
  useEffect(() => {
    setPath([])
    setHintVisible(mode === 'learn')
    setWrongInfo(null)
    setFinished(false)
    setAutoPlay(false)
    awardedRef.current = false
    replyAfterDropRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, mode])

  /** Bé vừa kéo đúng ở chế độ học → cho đối thủ đáp trả ngay một nước. */
  const replyAfterDropRef = useRef(false)

  /**
   * Đối thủ tự đi trong 2 chế độ luyện. Ở chế độ "Học từng bước" đối thủ chỉ
   * đáp trả sau khi bé vừa kéo quân của mình, còn lúc bé bấm ◀ ▶ thì vẫn đi
   * từng nước để bé kịp nhìn.
   *
   * Khác biệt của cây khai cuộc: khi đối thủ có NHIỀU nước lý thuyết (ngã ba) thì
   * app DỪNG LẠI chờ bé chọn nhánh - không tự đoán thay bé.
   */
  useEffect(() => {
    if (!opening || autoPlay) return
    if (atLeaf) return
    if (isKidPly(ply)) return
    if (replies.length > 1) return
    if (mode === 'learn' && !replyAfterDropRef.current) return
    const timer = setTimeout(() => {
      replyAfterDropRef.current = false
      setPath((current) => [...current, replies[0]])
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoPlay, ply, opening, replies, atLeaf])

  // Tự động chạy trong chế độ học (luôn đi theo nhánh chính).
  useEffect(() => {
    if (mode !== 'learn' || !autoPlay || !opening) return
    if (atLeaf) {
      setAutoPlay(false)
      return
    }
    const timer = setTimeout(() => setPath((current) => [...current, replies[0]]), 1300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoPlay, ply, opening, replies, atLeaf])

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
   * Nước đi kế tiếp theo nhánh chính. `mine` = nước này thuộc về bé (bé cầm quân
   * đi được), dùng để tô sáng quân cần đi cho bé dễ kéo.
   */
  const hintMove = useMemo(() => {
    if (!mainNode) return null
    if (mode !== 'learn' && !isKidPly(ply)) return null
    try {
      const probe = new Chess(fens[ply])
      const move = probe.move(mainNode.san)
      return { from: move.from, to: move.to, mine: isKidPly(ply) }
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainNode, ply, mode, fens])

  const arrow = useMemo(
    () =>
      hintVisible && hintMove
        ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
        : [],
    [hintVisible, hintMove],
  )

  const lastMoveSquares = useMemo(() => {
    if (ply === 0) return undefined
    try {
      const probe = new Chess(fens[ply - 1])
      const move = probe.move(path[ply - 1].san)
      return {
        [move.from]: { boxShadow: BOARD_MARKS.lastMoveFrom },
        [move.to]: { boxShadow: BOARD_MARKS.lastMoveTo },
      }
    } catch {
      return undefined
    }
  }, [ply, path, fens])

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

  /** Vệt vàng của nước vừa đi + vệt gợi ý quân cần đi. */
  const squareStyles = useMemo(
    () => (hintSquares ? { ...lastMoveSquares, ...hintSquares } : lastMoveSquares),
    [lastMoveSquares, hintSquares],
  )

  const bannerState = useMemo(() => {
    if (!opening) return null
    if (wrongInfo) {
      return { ...wrongInfo, variant: 'wrong' as const }
    }
    if (mode === 'learn') {
      const node = mainNode ?? path[ply - 1]
      if (!node) return null
      const index = mainNode ? ply : ply - 1
      return {
        annotation: node.annotation ?? opponentAnnotation(node.san, notation),
        plyIndex: index,
        variant: 'hint' as const,
      }
    }
    if (ply === 0) return null
    const node = path[ply - 1]
    return {
      annotation: node.annotation ?? opponentAnnotation(node.san, notation),
      plyIndex: ply - 1,
      variant: node.annotation ? ('played' as const) : ('opponent' as const),
    }
  }, [opening, wrongInfo, mode, ply, notation, mainNode, path])

  /** Bé đang đứng ở ngã ba của ĐỐI THỦ → chờ bé chọn nhánh, chưa tự đi. */
  const forkOpen = mode === 'learn' && !autoPlay && !atLeaf && !isKidPly(ply) && replies.length > 1

  /** Bé thấy được cả đường đã đi lẫn dòng chính phía trước. */
  const stripMoves = useMemo(() => [...pathToMoves(path), ...mainLine(replies)], [path, replies])

  const chooseBranch = useCallback((node: OpeningNode) => {
    // Bé tự chọn nhánh → không để effect "đối thủ tự đáp" ghi đè thêm một nước.
    replyAfterDropRef.current = false
    setWrongInfo(null)
    setPath((current) => [...current, node])
  }, [])

  /** Nhảy thẳng tới một ngã ba trong cây (đi theo nhánh chính rồi rẽ). */
  const jumpToBranch = useCallback(
    (fork: TreeFork, index: number) => {
      if (!opening) return
      replyAfterDropRef.current = false
      setAutoPlay(false)
      setWrongInfo(null)
      setPath([...mainNodes(opening.tree).slice(0, fork.at), fork.options[index]])
    },
    [opening],
  )

  /** Tiến / Lùi một nước - dùng chung cho nút bấm và phím mũi tên. */
  const goStep = useCallback(
    (delta: number) => {
      if (!opening) return
      // Bé tự bấm tức là bé muốn tự điều khiển → dừng chế độ tự chạy.
      setAutoPlay(false)
      replyAfterDropRef.current = false
      // Đi lại từ đầu bằng nút ◀ ▶ thì bỏ luôn lời nhắc "nước chưa đúng".
      setWrongInfo(null)
      setPath((current) => {
        if (delta < 0) return current.slice(0, Math.max(0, current.length + delta))
        const next = repliesOf(opening.tree, current)[0]
        return next ? [...current, next] : current
      })
    },
    [opening],
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
  const interactive = kidTurn

  const handleDrop = (from: string, to: string): boolean => {
    if (!interactive || !opening) return false
    const expected = replies[0]
    const probe = new Chess(fens[ply])
    let move
    try {
      move = probe.move({ from, to, promotion: 'q' })
    } catch {
      if (soundOn) playError()
      return false
    }
    // Chấp nhận MỌI nước lý thuyết ở nút này, không chỉ nhánh chính - nhờ vậy bé
    // được thử các cách đáp khác nhau mà vẫn được coi là đi đúng.
    const chosen = replies.find((node) => node.san === move.san)
    if (!chosen) {
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
    // Chế độ học luôn giữ gợi ý sáng để bé đi tiếp nước sau.
    if (mode === 'learn') {
      replyAfterDropRef.current = true
    } else {
      setHintVisible(false)
    }
    setPath((current) => [...current, chosen])
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
            fen={fens[ply]}
            orientation={opening.side}
            playerSide={opening.side}
            interactive={interactive}
            heatmap={heatmap}
            arrows={arrow}
            extraSquareStyles={squareStyles}
            onDrop={handleDrop}
          />
        }
        under={
          <div className="grid gap-2">
            {/*
              Ngã ba: đối thủ có nhiều nước lý thuyết. App DỪNG LẠI để bé tự chọn
              muốn tập nhánh nào - đúng tinh thần "học phản ứng, không học vẹt".
            */}
            {forkOpen && (
              <section
                id="kid-opening-fork"
                className="animate-pop-in card-pop grid gap-1.5 border-[3px] border-info-300 p-2.5"
              >
                <p className="text-[0.65rem] font-extrabold uppercase tracking-wide text-info-600">
                  🔀 Ngã ba · đối thủ có {replies.length} cách đáp
                </p>
                <p className="text-xs font-bold text-brand-600">
                  Bé muốn tập nhánh nào? (⭐ là dòng chính)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {replies.map((node, index) => (
                    <button
                      key={node.san}
                      type="button"
                      onClick={() => chooseBranch(node)}
                      title={node.note ?? 'Nước lý thuyết'}
                      className={`rounded-xl border-2 px-2.5 py-1.5 text-xs font-extrabold transition-all active:translate-y-[2px] ${
                        index === 0
                          ? 'border-gold-400 bg-gold-100 text-gold-900'
                          : 'border-brand-200 bg-white text-brand-600 hover:border-brand-300'
                      }`}
                    >
                      {index === 0 && <span aria-hidden>⭐ </span>}
                      {formatSan(node.san, notation)}
                    </button>
                  ))}
                </div>
                {replies[1]?.note && (
                  <p className="text-[0.65rem] font-bold text-brand-400">
                    💬 {replies[1].note}
                  </p>
                )}
              </section>
            )}

            {/* Banner Giải Thích Siêu Ngắn luôn nằm NGAY DƯỚI bàn cờ. */}
            {bannerState ? (
              <ExplanationBanner
                annotation={bannerState.annotation}
                plyIndex={bannerState.plyIndex}
                notation={notation}
                variant={bannerState.variant}
              />
            ) : (
              !forkOpen && (
                <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-2.5 text-center text-sm font-bold text-brand-500">
                  🐣 Bé hãy kéo quân để bắt đầu bài học nhé!
                </div>
              )
            )}
          </div>
        }
      />

      {/* Cột phải: tab chế độ, bản đồ leo cấp, điều khiển, mục tiêu… (tự cuộn) */}
      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          {/*
            Mắt Thần nằm CÙNG HÀNG với tiêu đề: tiết kiệm hẳn một hàng so với để
            nút riêng bên dưới, nhờ vậy cột phải không phải cuộn.

            `min-w-0` là BẮT BUỘC: đây là một ô của lưới Panel, mà ô lưới mặc định
            có min-width:auto nên sẽ nở rộng bằng cả câu `nowrap` của tiêu đề
            (đo được 487px trong khung 372px) làm cả trang tràn ngang.

            `sm:flex-nowrap` cũng vậy: chữ `truncate` vẫn tính cả bề rộng vào
            min-content, nên nếu để flex-wrap thì hai nút tự đẩy nhau xuống hai
            hàng (đo được 106px thay vì 52px) - và thế là cột phải bị cuộn.
            Trên điện thoại thì cứ để xuống hàng cho tiêu đề đọc được đầy đủ.
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
              checkMode={checkMode}
            />
          </div>
          <Segmented
            options={MODES.map((m) => ({
              value: m.value,
              label: m.value === 'memorize' ? `Luyện ${totalKidMoves} bước` : m.label,
              icon: m.icon,
            }))}
            value={mode}
            onChange={setMode}
            size="sm"
          />
        </Panel>

        <Panel>
          <ProgressMap
            nodes={curriculum.map((entry) => ({
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
            onSelect={setOpeningId}
            title="Bản đồ chinh phục khai cuộc"
            unitLabel="bài"
            allDoneMessage="Bé đã phá đảo toàn bộ khai cuộc Grand Master! 🏆"
            info="cup"
          />
        </Panel>

        <Panel className="grid gap-2">
          {/*
            Ngã ba cũng chặn nút "Tiến" để bé không vô tình nhảy qua mất phần chọn
            nhánh - muốn đi tiếp thì bấm vào một nhánh ở khung ngay dưới bàn cờ.
          */}
          {forkOpen && (
            <p className="rounded-xl bg-info-50 px-2.5 py-1.5 text-[0.7rem] font-extrabold text-info-700">
              🔀 Đang chờ bé chọn nhánh ở khung ngay dưới bàn cờ.
            </p>
          )}
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
                  disabled={ply >= treeDepth(opening.tree) || forkOpen}
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
                    setPath([])
                  }}
                >
                  🔄 Đầu
                </KidButton>
              </>
            ) : (
              <>
                <KidButton
                  variant="sky"
                  onClick={() => setHintVisible(true)}
                  disabled={hintVisible || atLeaf}
                >
                  💡 Gợi ý
                </KidButton>
                <KidButton variant="ghost" onClick={() => { replyAfterDropRef.current = false; setPath([]); setHintVisible(false); setWrongInfo(null); setFinished(false); awardedRef.current = false }}>
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

        {/* Cây khai cuộc: bé thấy trước các cách đáp khác của đối thủ và nhảy sang nhánh đó. */}
        {forks.length > 0 && (
          <Panel id="kid-opening-tree" className="grid gap-2">
            <SectionTitle
              icon="🌳"
              title="Cây khai cuộc"
              subtitle={`${forks.length} ngã ba - bé thử nhiều cách đáp của đối thủ`}
              info="tree"
            />
            <div className="grid gap-1.5">
              {forks.map((fork) => (
                <div
                  key={fork.at}
                  className="rounded-xl border-2 border-dashed border-brand-100 bg-brand-50/60 px-2 py-1.5"
                >
                  <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
                    {plyLabel(fork.at)} {isKidPly(fork.at) ? 'bé chọn' : 'đối thủ đáp'} ·{' '}
                    {fork.options.length} cách
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {fork.options.map((node, index) => (
                      <button
                        key={node.san}
                        type="button"
                        onClick={() => jumpToBranch(fork, index)}
                        title={node.note ?? 'Nước lý thuyết'}
                        className={`rounded-lg border-2 px-2 py-1 text-[0.7rem] font-extrabold transition-all active:translate-y-[1px] ${
                          index === 0
                            ? 'border-gold-300 bg-gold-50 text-gold-800'
                            : 'border-brand-200 bg-white text-brand-600 hover:border-brand-300'
                        }`}
                      >
                        {index === 0 && <span aria-hidden>⭐ </span>}
                        {formatSan(node.san, notation)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Kế hoạch tiếp theo: việc bé cần làm sau khi hết phần khai cuộc đã học. */}
        {opening.plan.points.length > 0 && (
          <Panel id="kid-opening-plan" className="grid gap-2">
            <SectionTitle
              icon="🧭"
              title={opening.plan.title}
              subtitle={playing ? 'Đã tới lúc áp dụng!' : 'Học hết phần khai cuộc là dùng được ngay'}
              info="plan"
            />
            <ul className="grid gap-1">
              {opening.plan.points.map((point) => (
                <li key={point} className="flex gap-1.5 text-xs font-bold text-brand-700">
                  <span aria-hidden className="text-gold-500">
                    ◆
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
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
          enabled={heatmap && (stage.id === 'nhi' || stage.id === 'thieu-nhi')}
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
            moves={stripMoves}
            side={opening.side}
            ply={ply}
            notation={notation}
            onJump={
              mode === 'learn'
                ? (index) => {
                    // Trong cây chỉ lùi được về thế đã đi qua, không "nhảy tới" một nhánh chưa chọn.
                    if (index >= ply) return
                    replyAfterDropRef.current = false
                    setAutoPlay(false)
                    setWrongInfo(null)
                    setPath((current) => current.slice(0, index))
                  }
                : undefined
            }
          />

          <div className="flex flex-wrap gap-1.5">
            {opening.moves
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
          setPath([])
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
