import { Chess } from 'chess.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { EyeToggle } from '../components/EyeToggle'
import { ExplanationBanner } from '../components/ExplanationBanner'
import type { BannerVariant } from '../components/ExplanationBanner'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import {
  getGmLecture,
  GM_LECTURES,
  isKidPly,
  kidStepCount,
  plyLabelOffset,
} from '../data/gmLectures'
import { PAWN_STRUCTURES, PAWN_TONE_STYLES } from '../data/pawnStructures'
import { useChessGame } from '../hooks/useChessGame'
import { useEyeCheck } from '../hooks/useEyeCheck'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  formatSan,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  moveLabel,
} from '../lib/notation'
import { reviewKey } from '../lib/review'
import { useKidProgress } from '../store/progress'
import { useReview } from '../store/review'
import type { GmLecture } from '../types'
import type { CSSProperties } from 'react'
import type { Arrow } from 'react-chessboard'

type Mode = 'lecture' | 'structure'

const MODE_OPTIONS: { value: Mode; label: string; icon: string }[] = [
  { value: 'lecture', label: 'Bài giảng GM', icon: '🎓' },
  { value: 'structure', label: 'Cấu trúc Tốt', icon: '🧬' },
]

const LECTURE_OPTIONS = GM_LECTURES.map((lecture) => ({
  value: lecture.id,
  label: lecture.title,
  icon: lecture.emoji,
}))

const STRUCTURE_OPTIONS = PAWN_STRUCTURES.map((structure) => ({
  value: structure.id,
  label: structure.name,
  icon: structure.emoji,
}))

/** Thời điểm chơi lại một nước trong lúc "tua" tới một bước. */
const WALK_MS = 200
const REPLY_MS = 450

export function StrategyPage() {
  const { completeActivity, isCompleted, notation } = useKidProgress()
  const { record } = useReview()

  const [mode, setMode] = useState<Mode>('lecture')
  const [lectureId, setLectureId] = useState(GM_LECTURES[0].id)
  const [structureId, setStructureId] = useState(PAWN_STRUCTURES[0].id)

  const lecture = useMemo(() => getGmLecture(lectureId) ?? GM_LECTURES[0], [lectureId])
  const structure = useMemo(
    () => PAWN_STRUCTURES.find((item) => item.id === structureId) ?? PAWN_STRUCTURES[0],
    [structureId],
  )

  const { on: heatmap, toggle: toggleHeatmap, checkMode } = useEyeCheck()
  const [guide, setGuide] = useState(true)
  const [wrongMove, setWrongMove] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [celebrate, setCelebrate] = useState<{ title: string; message: string } | null>(null)

  // "Tua" tới một bước: đi lần lượt từng nửa nước cho tới đích.
  const [targetPly, setTargetPly] = useState<number | null>(null)

  // Thế cờ GỐC của bài đang mở - dùng để dựng lại ván cờ, KHÔNG dùng để vẽ bàn.
  const startFen = mode === 'lecture' ? lecture.fen : structure.fen
  const activeSide = mode === 'lecture' ? lecture.playerSide : 'white'
  const board = useChessGame(startFen, activeSide)
  // Chỉ lấy đúng hàm cần dùng: `board` là object mới mỗi lần render, đưa cả object
  // vào deps của useEffect sẽ khiến đồng hồ hẹn giờ bị xoá liên tục và không bao
  // giờ chạy.
  const playSan = board.playSan

  const ply = board.sans.length
  const totalPlies = lecture.moves.length
  const finished = mode === 'lecture' && ply >= totalPlies
  const kidTurnNow = mode === 'lecture' && ply < totalPlies && isKidPly(lecture, ply)
  const walking = targetPly !== null && ply < targetPly
  const interactive = mode === 'lecture' && kidTurnNow && !finished && !walking

  /** Các bước thuộc về bé - dùng cho danh sách bước và thanh tiến độ. */
  const kidSteps = useMemo(
    () =>
      lecture.moves.reduce<{ ply: number; index: number }[]>((acc, move, index) => {
        if (move.annotation) acc.push({ ply: index, index: acc.length })
        return acc
      }, []),
    [lecture],
  )

  const doneSteps = kidSteps.filter((step) => step.ply < ply).length
  const totalSteps = kidStepCount(lecture)

  /** Dọn sạch trạng thái tạm - gọi từ chính sự kiện gây ra thay đổi. */
  const clearSession = useCallback(() => {
    setTargetPly(null)
    setWrongMove(null)
    setCelebrate(null)
  }, [])

  const completeLecture = useCallback(() => {
    record(reviewKey('lecture', lecture.id), true)
    const first = completeActivity(`strategy:${lecture.id}`, 4)
    if (first) {
      setConfetti(true)
      setCelebrate({
        title: `${lecture.emoji} Bé đã học xong!`,
        message: `“${lecture.title}” - kỹ thuật của ${lecture.gm}.`,
      })
    }
  }, [completeActivity, lecture, record])

  /**
   * Một nửa nước nữa vừa được đi xong. Nếu đó là nửa nước cuối của bài giảng
   * thì chốt là bé đã học xong bài.
   */
  const afterMove = useCallback(
    (nextPly: number) => {
      if (nextPly < totalPlies) return
      completeLecture()
    },
    [totalPlies, completeLecture],
  )

  // Tự đi những nửa nước không thuộc về bé (và đi thay bé trong lúc "tua").
  useEffect(() => {
    if (mode !== 'lecture') return
    if (ply >= totalPlies) return
    const isKid = isKidPly(lecture, ply)
    if (isKid && !walking) return
    const nextPly = ply + 1
    const timer = setTimeout(
      () => {
        playSan(lecture.moves[ply].san)
        // Tua tới đích rồi thì buông cờ cho bé tự đi.
        if (walking && nextPly >= (targetPly ?? 0)) setTargetPly(null)
        afterMove(nextPly)
      },
      walking ? WALK_MS : REPLY_MS,
    )
    return () => clearTimeout(timer)
  }, [ply, totalPlies, lecture, mode, walking, targetPly, playSan, afterMove])

  const handleDrop = useCallback(
    (from: string, to: string): boolean => {
      if (mode !== 'lecture' || finished || walking) return false
      if (!isKidPly(lecture, ply)) return false
      const expected = lecture.moves[ply]
      const probe = new Chess(board.game.fen())
      let san: string
      try {
        san = probe.move({ from, to, promotion: 'q' }).san
      } catch {
        return false
      }
      if (san !== expected.san) {
        setWrongMove(
          `Nước ${formatSan(san, notation)} chưa đúng ý của Đại Kiện Tướng. Bé đọc lại khẩu quyết “${expected.annotation?.rhyme ?? ''}” nhé!`,
        )
        return false
      }
      setWrongMove(null)
      board.playMove(from, to)
      afterMove(ply + 1)
      return true
    },
    [mode, finished, walking, lecture, ply, board, notation, afterMove],
  )

  const restart = useCallback(() => {
    board.reset()
    clearSession()
  }, [board, clearSession])

  const jumpToStep = useCallback(
    (targetIndex: number) => {
      const step = kidSteps[targetIndex]
      if (!step) return
      setWrongMove(null)
      if (ply > step.ply) {
        board.undoMoves(ply - step.ply)
        setTargetPly(null)
        return
      }
      setTargetPly(step.ply)
    },
    [kidSteps, ply, board],
  )

  /** Mũi tên vàng + hai ô viền màu cho nước đi kế tiếp của Đại Kiện Tướng. */
  const guideMove = useMemo(() => {
    if (mode !== 'lecture' || !guide || finished || walking) return null
    if (!isKidPly(lecture, ply)) return null
    const move = lecture.moves[ply]
    const probe = new Chess(board.game.fen())
    try {
      const played = probe.move(move.san)
      return { from: played.from, to: played.to }
    } catch {
      return null
    }
  }, [mode, guide, finished, walking, lecture, ply, board])

  const arrows: Arrow[] = guideMove
    ? [{ startSquare: guideMove.from, endSquare: guideMove.to, color: ARROW_COLOR }]
    : []

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}

    if (mode === 'structure') {
      for (const marker of structure.markers) {
        const tone = PAWN_TONE_STYLES[marker.tone]
        styles[marker.square] = { backgroundColor: tone.fill, boxShadow: tone.ring }
      }
      return styles
    }

    if (board.lastMove) {
      styles[board.lastMove.from] = {
        ...(styles[board.lastMove.from] ?? {}),
        boxShadow: BOARD_MARKS.lastMoveFrom,
      }
      styles[board.lastMove.to] = {
        ...(styles[board.lastMove.to] ?? {}),
        boxShadow: BOARD_MARKS.lastMoveTo,
      }
    }
    if (guideMove) {
      styles[guideMove.from] = { ...HINT_FROM_STYLE }
      styles[guideMove.to] = { ...HINT_TO_STYLE }
    }
    return styles
  }, [mode, structure, board.lastMove, guideMove])

  /** Banner Siêu Ngắn 3 phần - luôn hiện đúng nước đang học. */
  const banner = useMemo((): {
    annotation: NonNullable<GmLecture['moves'][number]['annotation']>
    plyIndex: number
    variant: BannerVariant
  } | null => {
    if (mode !== 'lecture') return null
    const offset = plyLabelOffset(lecture)
    if (wrongMove && kidTurnNow) {
      const move = lecture.moves[ply]
      if (move.annotation) return { annotation: move.annotation, plyIndex: ply + offset, variant: 'wrong' }
    }
    const last = board.lastMove
    if (last) {
      const lastPly = ply - 1
      const move = lecture.moves[lastPly]
      if (move?.annotation) {
        return {
          annotation: move.annotation,
          plyIndex: lastPly + offset,
          variant: isKidPly(lecture, lastPly) ? 'played' : 'opponent',
        }
      }
    }
    const upcoming = lecture.moves[ply]
    if (upcoming?.annotation) {
      return { annotation: upcoming.annotation, plyIndex: ply + offset, variant: 'hint' }
    }
    return null
  }, [mode, lecture, ply, board.lastMove, wrongMove, kidTurnNow])

  const spotlightSquares = useMemo(() => {
    if (mode !== 'lecture') return []
    if (!board.lastMove) return []
    const played = lecture.moves[ply - 1]
    return played?.spotlight ?? []
  }, [mode, lecture, ply, board.lastMove])

  const completeRate = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      <BoardStage
        reserve={300}
        top={
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-2xl" aria-hidden>
                {mode === 'lecture' ? lecture.emoji : structure.emoji}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-brand-900 sm:text-base">
                  {mode === 'lecture' ? lecture.title : structure.name}
                </div>
                <div className="hidden truncate text-[0.7rem] font-bold text-ink-500 sm:block">
                  {mode === 'lecture' ? `${lecture.gm} · ${totalSteps} bước` : structure.englishName}
                </div>
              </div>
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} checkMode={checkMode} />
          </div>
        }
        board={
          <ChessBoardPanel
            fen={board.fen}
            orientation={activeSide}
            playerSide={activeSide}
            interactive={interactive}
            heatmap={heatmap}
            arrows={arrows}
            extraSquareStyles={squareStyles}
            onDrop={handleDrop}
          />
        }
        under={
          <>
            {spotlightSquares.length > 0 && mode === 'lecture' && (
              <p className="rounded-2xl bg-coral-50 px-2.5 py-1 text-[0.7rem] font-extrabold text-coral-700 ring-1 ring-coral-200">
                🚫 {spotlightSquares.join(', ')} đã bị bé khoá lại - đối thủ hết đường nhảy vào!
              </p>
            )}
            {banner ? (
              <ExplanationBanner
                annotation={banner.annotation}
                plyIndex={banner.plyIndex}
                notation={notation}
                variant={banner.variant}
              />
            ) : (
              <p className="card-pop px-3 py-2 text-sm font-bold text-ink-500">
                {mode === 'structure'
                  ? '👀 Bé nhìn bàn cờ: ô XANH là Tốt khoẻ, ô ĐỎ là Tốt yếu.'
                  : 'Chọn một bài giảng ở cột bên phải để bắt đầu.'}
              </p>
            )}

            {wrongMove && !banner && (
              <p className="rounded-2xl bg-coral-50 px-2.5 py-1 text-[0.7rem] font-extrabold text-coral-700 ring-1 ring-coral-200">
                🤔 {wrongMove}
              </p>
            )}

            {mode === 'lecture' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <KidButton
                  size="sm"
                  variant="ghost"
                  onClick={() => jumpToStep(Math.max(0, doneSteps - 1))}
                  disabled={doneSteps === 0}
                >
                  ◀ Lùi
                </KidButton>
                <KidButton
                  size="sm"
                  variant="grass"
                  onClick={() => jumpToStep(Math.min(doneSteps, totalSteps - 1))}
                  disabled={finished}
                >
                  ▶ Đi giúp
                </KidButton>
                <KidButton size="sm" variant="primary" onClick={restart}>
                  ⟳ Chơi lại
                </KidButton>
                <KidButton
                  size="sm"
                  variant={guide ? 'sun' : 'ghost'}
                  onClick={() => setGuide((value) => !value)}
                  aria-pressed={guide}
                >
                  {guide ? '🙈 Ẩn mũi tên' : '💡 Hiện mũi tên'}
                </KidButton>
              </div>
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel>
          <SectionTitle
            icon="🎓"
            title="Chiến lược Đại Kiện Tướng"
            subtitle="Đòn bẩy Tốt · Phòng thủ dự phòng · Lucena · Philidor"
          />
          <div className="mt-2 grid gap-2">
            <Segmented
              options={MODE_OPTIONS}
              value={mode}
              onChange={(value) => {
                setMode(value)
                clearSession()
              }}
              size="sm"
            />
            {mode === 'lecture' ? (
              <Segmented
                options={LECTURE_OPTIONS}
                value={lectureId}
                onChange={(value) => {
                  setLectureId(value)
                  clearSession()
                  // Bài mới thì trả lại mũi tên chỉ dẫn cho bé.
                  setGuide(true)
                }}
                size="sm"
              />
            ) : (
              <Segmented
                options={STRUCTURE_OPTIONS}
                value={structureId}
                onChange={(value) => {
                  setStructureId(value)
                  clearSession()
                }}
                size="sm"
              />
            )}
          </div>
        </Panel>

        {mode === 'lecture' ? (
          <>
            <Panel>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-brand-900">
                  🪜 Các bước của Đại Kiện Tướng
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-extrabold text-brand-700">
                  {doneSteps}/{totalSteps}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-leaf-500 transition-all"
                  style={{ width: `${completeRate}%` }}
                />
              </div>
              <ol className="mt-2 grid gap-1.5">
                {kidSteps.map((step) => {
                  const move = lecture.moves[step.ply]
                  const done = step.ply < ply
                  const current = step.ply === ply
                  return (
                    <li key={`${lecture.id}-${step.ply}`}>
                      <button
                        type="button"
                        onClick={() => jumpToStep(step.index)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-2.5 py-1.5 text-left transition-all ${
                          current
                            ? 'bg-gold-100 ring-2 ring-gold-300'
                            : done
                              ? 'bg-leaf-50'
                              : 'bg-sand-100 hover:bg-white'
                        }`}
                      >
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-extrabold ${
                            done
                              ? 'bg-leaf-600 text-white'
                              : current
                                ? 'bg-gold-400 text-gold-950'
                                : 'bg-white text-ink-500 ring-1 ring-sand-200'
                          }`}
                        >
                          {done ? '✓' : current ? '👉' : step.index + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-extrabold text-brand-900">
                            {formatSan(move.san, notation)} · “{move.annotation?.rhyme}”
                          </span>
                          <span className="block truncate text-[0.65rem] font-bold text-ink-500">
                            {moveLabel(step.ply + plyLabelOffset(lecture), move.san, notation)}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </Panel>

          </>
        ) : (
          <Panel>
            <SectionTitle
              icon={structure.emoji}
              title={structure.name}
              subtitle={structure.englishName}
            />
            <div className="mt-2 grid gap-2">
              <span
                className={`w-fit rounded-full px-2.5 py-0.5 text-[0.7rem] font-extrabold ${
                  structure.verdict === 'good'
                    ? 'bg-leaf-100 text-leaf-800'
                    : 'bg-coral-100 text-coral-800'
                }`}
              >
                {structure.verdict === 'good' ? '✅ Tốt khoẻ' : '⚠️ Tốt yếu'}
              </span>
              <p className="rounded-2xl bg-brand-50 px-2.5 py-2 text-sm font-bold text-brand-900">
                {structure.reason}
              </p>
              <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-sun bg-sun/20 px-2.5 py-2">
                <span className="text-xl" aria-hidden>
                  🎵
                </span>
                <div className="min-w-0">
                  <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-gold-600">
                    Khẩu quyết vè
                  </div>
                  <div className="text-base font-extrabold text-gold-900">“{structure.rhyme}”</div>
                </div>
              </div>
              <p className="text-xs font-bold text-ink-500">
                🎨 Bé xem bàn cờ: ô <span className="text-leaf-700">XANH</span> là Tốt khoẻ, ô{' '}
                <span className="text-coral-700">ĐỎ</span> là Tốt yếu. Bật 👁️ Mắt Thần để so thêm với
                vùng đối thủ kiểm soát.
              </p>
              <span className="text-xs font-bold text-ink-500">
                Tiến độ module: {isCompleted(`strategy:structure:${structure.id}`) ? 'đã xem ✓' : 'chưa xem'}
              </span>
              <KidButton
                variant="grass"
                onClick={() => {
                  record(reviewKey('structure', structure.id), true)
                  completeActivity(`strategy:structure:${structure.id}`, 2)
                }}
              >
                ✅ Bé đã hiểu thế Tốt này
              </KidButton>
            </div>
          </Panel>
        )}
      </div>

      {celebrate && (
        <div className="fixed inset-x-0 bottom-3 z-40 mx-auto flex w-[min(92vw,32rem)] items-center gap-3 rounded-2xl border-[3px] border-gold-300 bg-white px-3 py-2 shadow-2xl">
          <span className="text-2xl" aria-hidden>
            🏆
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-brand-900">{celebrate.title}</div>
            <div className="truncate text-xs font-bold text-ink-500">{celebrate.message}</div>
          </div>
          <KidButton variant="ghost" onClick={() => setCelebrate(null)}>
            Đóng
          </KidButton>
        </div>
      )}
    </div>
  )
}
