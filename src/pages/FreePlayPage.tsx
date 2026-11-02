import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { EyeToggle } from '../components/EyeToggle'
import { BoardStage } from '../components/BoardStage'
import { FoldPanel, KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import type { Difficulty } from '../engine/minimax'
import { preloadStockfish } from '../engine/stockfishLoader'
import { useChessEngine } from '../engine/useChessEngine'
import { useChessGame } from '../hooks/useChessGame'
import { useEyeCheck } from '../hooks/useEyeCheck'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  formatSan,
  PIECE_NAME_VI,
  pieceFromSan,
} from '../lib/notation'
import { playError, playMove, playPromote, playTick, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import { Chess } from 'chess.js'
import { gradeMove } from '../engine/analysis'
import { describeDanger, describeLoss, saveBlunder, worstOf } from '../lib/coach'
import type { Blunder } from '../lib/coach'
import { findHangingPieces } from '../lib/threats'
import type { Side } from '../types'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Số lần bé được bấm 💡 Gợi ý trong mỗi ván (để bé tự suy nghĩ nhiều hơn). */
const HINT_LIMIT = 3

/** Emoji quân cờ để hiển thị "túi quân đã ăn được". */
const GLYPH: Record<string, string> = {
  w: '♙',
  b: '♟',
  wN: '♘',
  wB: '♗',
  wR: '♖',
  wQ: '♕',
  wK: '♔',
  bN: '♞',
  bB: '♝',
  bR: '♜',
  bQ: '♛',
  bK: '♚',
}

/**
 * Hai mức của chế độ Đấu tập: NHÃN hiển thị là Dễ và Khá, còn engine thật vẫn là mức KHÓ
 * (depth 3 + quiescence) và mức SIÊU (Stockfish) - đổi nhãn để bé không thấy nản khi vào.
 * Mức `easy`/`medium` chỉ còn trong engine cho bài kiểm, không hiện ra UI. Vẫn còn trong
 * bộ máy cờ và được dùng ở tab Tàn cuộc cho bé tập kỹ thuật.
 */
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; icon: string }[] = [
  { value: 'hard', label: 'Dễ', icon: '🦊' },
  { value: 'master', label: 'Khá', icon: '🦁' },
]

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Dễ (engine)',
  medium: 'Vừa (engine)',
  hard: 'Dễ',
  master: 'Khá',
}

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  // `easy`/`medium` vẫn khai báo vì kiểu `Difficulty` dùng chung với engine (bài kiểm
  // engine vẫn gọi hai mức này), nhưng giao diện KHÔNG còn cho bé chọn.
  easy: 'Máy chơi ngây thơ, hay quên bảo vệ quân - bé tha hồ săn quân!',
  medium: 'Máy biết ăn quân và tránh mất quân. Bé phải nhìn kỹ nhé!',
  hard: 'Đối thủ này tính trước 3 nước và không đi bừa - bé bật 👁️ Mắt Thần rồi thử sức nhé!',
  master: 'Máy tính trước 4 nước, gần như không mắc lỗi. Bé chơi được mức này là rất cứng rồi!',
}

export function FreePlayPage() {
  const { notation, soundOn } = useKidProgress()
  const { think } = useChessEngine()

  const [kidSide, setKidSide] = useState<Side>('white')
  // Chỉ còn hai mức KHÓ và SIÊU (đã bỏ Dễ và Vừa vì dưới 1200 Elo). Đây là app học
  // cờ, không phải bảng xếp hạng: không chấm điểm, không so hơn thua.
  const [difficulty, setDifficulty] = useState<Difficulty>('hard')
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()
  const [thinking, setThinking] = useState(false)
  /** Nước gợi ý cho bé - chỉ hiện khi còn đúng thế cờ đã tính (`fen` khớp). */
  const [hint, setHint] = useState<{ fen: string; from: string; to: string } | null>(null)
  const [hintBusy, setHintBusy] = useState(false)
  /** Số lần gợi ý còn lại của ván hiện tại; hết thì nút 💡 tự khoá. */
  const [hintsLeft, setHintsLeft] = useState(HINT_LIMIT)
  const [confetti, setConfetti] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
  } | null>(null)
  const [gameKey, setGameKey] = useState(0)

  /**
   * Thế cờ bắt đầu ván. Đổi giá trị này là bắt đầu ván mới từ một thế khác - dùng
   * cho nút “▶ Luyện lại thế này” ở phần tổng kết của HLV.
   */
  const [startFen, setStartFen] = useState(START_FEN)
  /** Câu nhận xét của HLV về nước bé VỪA đi (chỉ hiện khi mất ≥ 1 điểm). */
  const [coach, setCoach] = useState<{
    text: string
    lossCp: number
    san: string
    bestFrom: string
    bestTo: string
  } | null>(null)
  /** Cảnh báo TRƯỚC khi đi: nước sắp đi làm quân mình bị treo. */
  const [danger, setDanger] = useState<{ from: string; to: string; warning: string } | null>(null)
  /** Các lỗi của ván đang chơi, dùng cho phần tổng kết cuối ván. */
  const [blunders, setBlunders] = useState<Blunder[]>([])
  const [coachBusy, setCoachBusy] = useState(false)
  /** Tăng mỗi lần bé đi lại / đổi ván → kết quả chấm cũ bị bỏ. */
  const moveTokenRef = useRef(0)

  const board = useChessGame(startFen, kidSide)
  const engineColor: 'w' | 'b' = kidSide === 'white' ? 'b' : 'w'
  const finishedRef = useRef(false)

  // Trạng thái mới nhất cho các tác vụ bất đồng bộ của máy.
  const liveRef = useRef({ fen: board.fen, playerToMove: board.playerToMove })
  liveRef.current = { fen: board.fen, playerToMove: board.playerToMove }

  const gameOver = board.game.isCheckmate() || board.game.isDraw() || board.game.isStalemate()

  /** Máy suy nghĩ rồi đi một nước. */
  useEffect(() => {
    if (gameOver || board.playerToMove) return
    const requestFen = board.fen
    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      setThinking(true)
      const move = await think(requestFen, difficulty)
      if (cancelled) return
      setThinking(false)
      const live = liveRef.current
      if (live.playerToMove || live.fen !== requestFen || !move) return
      board.playSan(move.san)
      if (move.promotion && soundOn) playPromote()
      else if (soundOn) playMove()
    }, 420)

    return () => {
      cancelled = true
      clearTimeout(timer)
      setThinking(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.fen, board.playerToMove, difficulty, gameOver, think])

  /** Kết thúc ván cờ: khen ngợi hoặc an ủi bé. */
  useEffect(() => {
    if (finishedRef.current) return
    const chess = board.game
    if (chess.isCheckmate()) {
      finishedRef.current = true
      const kidWins = chess.turn() === engineColor
      if (kidWins) {
        if (soundOn) playWin()
        setConfetti(true)
        setResult({
          emoji: '🏆',
          title: 'Bé chiếu bí máy rồi!',
          message: `Tuyệt vời! Bé đã hạ gục chú máy ở mức ${DIFFICULTY_LABEL[difficulty]}.`,
        })
      } else {
        setResult({
          emoji: '🤗',
          title: 'Máy chiếu bí mất rồi!',
          message: 'Không sao đâu bé! Bật 👁️ Mắt Thần rồi chơi lại, lần này bé sẽ thắng!',
        })
      }
      return
    }
    if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isDraw()) {
      finishedRef.current = true
      setResult({
        emoji: '🤝',
        title: 'Hòa cờ!',
        message: 'Hai bên hòa nhau. Bé chơi lại để tìm cách thắng nhé!',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.sans, difficulty])

  /** Báo "chiếu!" cho bé nghe. */
  const kidInCheck = useMemo(() => {
    if (board.game.isCheckmate()) return false
    const chess = board.game
    return chess.isCheck() && chess.turn() === (kidSide === 'white' ? 'w' : 'b')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.fen, kidSide])

  const newGame = (side: Side = kidSide, fen: string = START_FEN) => {
    moveTokenRef.current += 1
    finishedRef.current = false
    setStartFen(fen)
    setKidSide(side)
    setResult(null)
    setThinking(false)
    setHint(null)
    setHintsLeft(HINT_LIMIT)
    setCoach(null)
    setDanger(null)
    setBlunders([])
    setCoachBusy(false)
    board.reset()
    setGameKey((value) => value + 1)
    if (soundOn) playTick()
  }

  /** Hai cột nước đi kiểu sách cờ. */
  const moveRows = useMemo(() => {
    const rows: { no: number; white?: string; black?: string }[] = []
    board.history.forEach((move, index) => {
      const rowIndex = Math.floor(index / 2)
      if (!rows[rowIndex]) rows[rowIndex] = { no: rowIndex + 1 }
      if (move.color === 'w') rows[rowIndex].white = move.san
      else rows[rowIndex].black = move.san
    })
    return rows
  }, [board.history])

  /** Quân đã bị ăn (hiển thị như "túi chiến lợi phẩm"). */
  const captures = useMemo(() => {
    const byKid: { color: 'w' | 'b'; type: string }[] = []
    const byEngine: { color: 'w' | 'b'; type: string }[] = []
    const kidColor = kidSide === 'white' ? 'w' : 'b'
    for (const move of board.history) {
      if (!move.captured) continue
      const victimColor = move.color === 'w' ? 'b' : 'w'
      const target = move.color === kidColor ? byKid : byEngine
      target.push({ color: victimColor, type: move.captured })
    }
    return { byKid, byEngine }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.history, kidSide])

  const isKidTurn = board.playerToMove && !gameOver && !thinking

  /** Gợi ý đang hiện chỉ tính cho ĐÚNG thế cờ hiện tại (đi nước nào là tự ẩn). */
  const hintMove = hint && hint.fen === board.fen ? hint : null

  /**
   * Bé bấm 💡 Gợi ý: nhờ engine (mức Khó) tìm nước mạnh nhất cho CHÍNH bên đang đi
   * (là bé) rồi vẽ mũi tên vàng + khoanh quân đi và ô đích - giống các tab khác.
   */
  const showHint = async () => {
    if (!isKidTurn || hintsLeft <= 0) return
    const fen = board.fen
    setHintBusy(true)
    setHintsLeft((left) => Math.max(0, left - 1))
    const move = await think(fen, 'hard')
    setHintBusy(false)
    const live = liveRef.current
    if (!move || live.fen !== fen || !live.playerToMove) return
    setHint({ fen, from: move.from, to: move.to })
  }

  /** Vệt nước vừa đi + gợi ý nước cần đi (nếu đang bật gợi ý). */
  const boardStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    if (board.lastMove) {
      styles[board.lastMove.from] = { boxShadow: BOARD_MARKS.lastMoveFrom }
      styles[board.lastMove.to] = { boxShadow: BOARD_MARKS.lastMoveTo }
    }
    if (hintMove) {
      styles[hintMove.from] = HINT_FROM_STYLE
      styles[hintMove.to] = HINT_TO_STYLE
    }
    return Object.keys(styles).length ? styles : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.lastMove, hintMove])

  const hintArrow = useMemo(
    () =>
      hintMove
        ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
        : [],
    [hintMove],
  )

  /**
   * HLV chấm nước bé VỪA đi (chạy nền, không chặn bàn cờ).
   *
   * Có “vé”: mỗi lần bé đi lại / đổi ván, `moveTokenRef` tăng lên nên kết quả chấm
   * của nước cũ bị bỏ - không bao giờ hiện nhận xét cho một thế cờ đã qua.
   */
  const runCoach = async (fenBefore: string, san: string, ply: number) => {
    const token = moveTokenRef.current
    setCoachBusy(true)
    try {
      const graded = await gradeMove(fenBefore, san)
      if (!graded || token !== moveTokenRef.current) return
      if (graded.lossCp < 100) return
      setCoach({
        text: describeLoss(graded.lossCp, formatSan(graded.bestSan, notation)),
        lossCp: graded.lossCp,
        san,
        bestFrom: graded.bestFrom,
        bestTo: graded.bestTo,
      })
      const blunder: Blunder = {
        date: new Date().toISOString(),
        fen: fenBefore,
        san,
        bestSan: graded.bestSan,
        lossCp: graded.lossCp,
        ply,
      }
      saveBlunder(blunder)
      setBlunders((prev) => [...prev, blunder])
    } catch {
      /* HLV không bao giờ được làm hỏng ván cờ */
    } finally {
      if (token === moveTokenRef.current) setCoachBusy(false)
    }
  }

  /** Thực hiện nước đi của bé (đã qua bước cảnh báo) rồi gọi HLV chấm. */
  const applyKidMove = (from: string, to: string): boolean => {
    const fenBefore = board.fen
    const ply = board.history.length + 1
    const move = board.playMove(from, to, 'q')
    if (!move) {
      if (soundOn) playError()
      return false
    }
    setDanger(null)
    setCoach(null)
    if (move.promotion && soundOn) playPromote()
    else if (soundOn) playMove()
    void runCoach(fenBefore, move.san, ply)
    return true
  }

  /**
   * Bé thả quân: **cảnh báo trước** nếu nước này làm quân mình bị treo mới.
   *
   * Cách làm rẻ nhất (không gọi engine): mô phỏng nước đi trên bản sao thế cờ rồi so
   * danh sách quân bị treo trước/sau bằng `findHangingPieces`. Chỉ báo những quân MỚI
   * bị treo - nhờ vậy câu cảnh báo chỉ đúng lỗi của nước sắp đi.
   */
  const handleDrop = (from: string, to: string): boolean => {
    let probe: Chess
    try {
      probe = new Chess(board.fen)
      probe.move({ from, to, promotion: 'q' })
    } catch {
      if (soundOn) playError()
      return false
    }
    const beforeHanging = new Set(
      findHangingPieces(new Chess(board.fen), kidSide).map((item) => item.square),
    )
    const fresh = findHangingPieces(probe, kidSide).filter(
      (item) => !beforeHanging.has(item.square),
    )
    if (fresh.length > 0) {
      setDanger({
        from,
        to,
        warning: describeDanger(
          fresh.map((item) => `${PIECE_NAME_VI[item.piece]} ${item.square}`),
        ),
      })
      if (soundOn) playError()
      return false
    }
    return applyKidMove(from, to)
  }

  /** “◀ Đi lại” - bỏ kết quả chấm cũ để HLV không nhận xét nhầm thế cờ. */
  const undoKid = () => {
    moveTokenRef.current += 1
    board.undoMoves(board.history.length % 2 === 0 ? 2 : 1)
    finishedRef.current = false
    setResult(null)
    setHint(null)
    setCoach(null)
    setDanger(null)
    setCoachBusy(false)
  }

  const statusText = gameOver
    ? board.game.isCheckmate()
      ? 'Ván cờ đã kết thúc'
      : 'Ván cờ hòa'
    : thinking
      ? '🤖 Máy đang suy nghĩ...'
      : isKidTurn
        ? kidInCheck
          ? '⚠️ Vua của bé đang bị chiếu! Bé phải cứu Vua ngay!'
          : '👉 Lượt của bé - suy nghĩ rồi đi nhé!'
        : '⏳ Chờ máy đi...'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái CHỈ có bàn cờ + nút điều khiển → bàn cờ luôn to hết cỡ. */}
      <BoardStage
        reserve={300}
        top={
          <>
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                kidInCheck
                  ? 'animate-pulse bg-coral-100 text-coral-700'
                  : 'bg-brand-100 text-brand-700'
              }`}
            >
              {statusText}
            </span>
            <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-extrabold text-gold-800">
              Nước {board.history.length + 1}
            </span>
            {coachBusy && !gameOver && (
              <span id="kid-coach-busy" className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-500">
                🧑‍🏫 đang chấm…
              </span>
            )}
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} />
          </>
        }
        board={
          <ChessBoardPanel
            key={gameKey}
            fen={board.fen}
            orientation={kidSide}
            playerSide={kidSide}
            interactive={isKidTurn}
            heatmap={heatmap}
            arrows={hintArrow}
            extraSquareStyles={boardStyles}
            onDrop={handleDrop}
          />
        }
        under={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <KidButton variant="grass" size="sm" onClick={() => newGame()}>
              ♟️ Ván mới
            </KidButton>
            <KidButton
              variant="sky"
              size="sm"
              disabled={board.history.length === 0 || thinking}
              onClick={undoKid}
            >
              ↩️ Đi lại nước vừa rồi
            </KidButton>
            <KidButton variant="ghost" size="sm" onClick={toggleHeatmap}>
              👁️ {heatmap ? 'Tắt Mắt Thần' : 'Bật Mắt Thần'}
            </KidButton>
            <KidButton
              id="kid-freeplay-hint"
              variant="sky"
              size="sm"
              disabled={!isKidTurn || hintBusy || hintsLeft <= 0}
              onClick={showHint}
            >
              {hintBusy
                ? '💡 Đang tính…'
                : hintsLeft > 0
                  ? `💡 Gợi ý (${hintsLeft})`
                  : '💡 Hết gợi ý'}
            </KidButton>
          </div>

          {/*
            HLV: cảnh báo TRƯỚC khi đi (đỏ) và nhận xét SAU khi đi (vàng). Chỉ một
            thẻ, một dòng, giọng trung tính - đúng như chốt trong spec.
          */}
          {danger && (
            <div
              id="kid-coach-danger"
              className="animate-pop-in rounded-xl border-2 border-coral-300 bg-coral-50 px-2.5 py-2"
            >
              <p className="text-xs font-extrabold leading-snug text-coral-800">
                ⚠️ {danger.warning}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <KidButton
                  id="kid-coach-danger-go"
                  variant="rose"
                  size="sm"
                  onClick={() => applyKidMove(danger.from, danger.to)}
                >
                  Vẫn đi
                </KidButton>
                <KidButton
                  id="kid-coach-danger-cancel"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDanger(null)}
                >
                  Đổi nước khác
                </KidButton>
              </div>
            </div>
          )}

          {coach && !danger && (
            <div
              id="kid-coach-loss"
              className="animate-pop-in rounded-xl border-2 border-gold-300 bg-gold-50 px-2.5 py-2"
            >
              <p className="text-xs font-extrabold leading-snug text-gold-900">
                🧑‍🏫 HLV: {coach.text}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <KidButton
                  id="kid-coach-best"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setHint({ fen: board.fen, from: coach.bestFrom, to: coach.bestTo })
                  }
                >
                  👁 Nước hay hơn
                </KidButton>
                <KidButton id="kid-coach-undo" variant="ghost" size="sm" onClick={undoKid}>
                  ◀ Đi lại
                </KidButton>
              </div>
            </div>
          )}

          {/* Túi chiến lợi phẩm: hai dòng gọn để không chiếm chiều cao. */}
          <div className="grid gap-1 rounded-2xl bg-brand-50 px-2.5 py-2">
            <div className="flex items-center gap-2 text-xs leading-none">
              <span className="shrink-0 font-extrabold text-brand-700">
                🍬 Bé ăn {captures.byKid.length}:
              </span>
              <span className="flex flex-wrap items-center gap-0.5 text-lg">
                {captures.byKid.length === 0 ? (
                  <span className="text-xs font-bold text-ink-600">
                    chưa ăn được quân nào
                  </span>
                ) : (
                  captures.byKid.map((item, index) => (
                    <span key={index}>
                      {GLYPH[`${item.color}${item.type.toUpperCase()}`] ?? '♟'}
                    </span>
                  ))
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs leading-none">
              <span className="shrink-0 font-extrabold text-coral-500">
                🤖 Máy ăn {captures.byEngine.length}:
              </span>
              <span className="flex flex-wrap items-center gap-0.5 text-lg opacity-80">
                {captures.byEngine.length === 0 ? (
                  <span className="text-xs font-bold text-coral-300">
                    chưa mất quân nào, giỏi quá!
                  </span>
                ) : (
                  captures.byEngine.map((item, index) => (
                    <span key={index}>
                      {GLYPH[`${item.color}${item.type.toUpperCase()}`] ?? '♟'}
                    </span>
                  ))
                )}
              </span>
            </div>
            </div>
          </>
        }
      />

      {/* Cột phải: chọn quân / độ khó, sách ghi ván cờ, bí kíp */}
      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <SectionTitle
            icon="🎮"
            title="Đấu tập tự do cùng bạn Robot"
            subtitle="Chơi trọn một ván cờ thật, có Vua, Hậu, Xe, Tượng, Mã, Tốt đông đủ!"
            info="machine"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-brand-500">
                🐣 Bé cầm quân gì?
              </p>
              <Segmented
                options={[
                  { value: 'white', label: 'Trắng', icon: '⬜' },
                  { value: 'black', label: 'Đen', icon: '⬛' },
                ]}
                value={kidSide}
                onChange={(value) => newGame(value)}
                size="sm"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-brand-500">
                🤖 Máy chơi giỏi cỡ nào?
              </p>
              <Segmented
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={(value) => {
                  setDifficulty(value)
                  // Bé chọn mức KHÁ (= Stockfish) → tải sẵn để nước đầu không phải chờ lâu.
                  if (value === 'master') preloadStockfish()
                }}
                size="sm"
              />
            </div>
          </div>
          <p className="rounded-2xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700">
            {DIFFICULTY_BLURB[difficulty]}
          </p>
        </Panel>

        {/*
          Sách ghi ván cờ là phần TRA CỨU, không phải việc bé làm mỗi nước: trên
          điện thoại thu lại sau một dòng bấm-mở để trang không dài lê thê.
        */}
        {gameOver && blunders.length > 0 && (
          <Panel id="kid-coach-review" className="grid gap-1.5">
            <SectionTitle
              icon="🧑‍🏫"
              title="Ván này của bé"
              subtitle="Lỗi lớn nhất - bấm để luyện lại đúng thế cờ đó"
            />
            <p className="rounded-xl bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700">
              {board.history.length} nước · {blunders.length} nước mất điểm · nặng nhất{' '}
              {(Math.max(...blunders.map((item) => item.lossCp)) / 100).toFixed(1)} điểm
            </p>
            <div className="grid gap-1">
              {worstOf(blunders, 3).map((blunder, index) => (
                <div
                  key={`${blunder.ply}-${blunder.san}`}
                  className="flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 text-xs font-extrabold leading-tight text-brand-800">
                    Nước {Math.floor(blunder.ply / 2) + 1} ·{' '}
                    {formatSan(blunder.san, notation)} · kém{' '}
                    {(blunder.lossCp / 100).toFixed(1)} điểm
                  </span>
                  <button
                    type="button"
                    data-coach-retry={index}
                    onClick={() => newGame(kidSide, blunder.fen)}
                    className="shrink-0 rounded-lg bg-brand-700 px-2 py-1 text-xs font-extrabold text-white active:translate-y-[1px]"
                  >
                    ▶ Luyện lại
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <FoldPanel id="kid-freeplay-book" icon="📜" title="Sách ghi ván cờ">
          <div className="hidden stage:block">
            <SectionTitle
              icon="📜"
              title="Sách ghi ván cờ"
              subtitle="Bé tập đọc lại ván đấu của mình như một kỳ thủ nhí!"
              info="notation"
            />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl bg-brand-50 p-2">
            {moveRows.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm font-bold text-ink-600">
                Ván cờ chưa bắt đầu. Bé đi nước đầu tiên nào! 🚀
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {moveRows.map((row) => (
                    <tr key={row.no} className="odd:bg-white/70">
                      <td className="w-8 rounded-l-lg px-2 py-1 text-right font-extrabold text-ink-600">
                        {row.no}.
                      </td>
                      <td className="px-2 py-1 font-extrabold text-brand-900">
                        {row.white ? formatSan(row.white, notation) : ''}
                      </td>
                      <td className="px-2 py-1 font-extrabold text-brand-600">
                        {row.black ? formatSan(row.black, notation) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </FoldPanel>

        <Panel>
          <SectionTitle
            icon="🧠"
            title="Bí kíp thắng bạn Robot"
            subtitle="Ba điều bé nên nhớ trong mỗi nước đi"
            info="machine"
          />
          <ul className="mt-2 grid gap-1.5 text-xs font-bold text-brand-700 sm:text-sm">
            <li className="rounded-xl bg-brand-50 px-2.5 py-1.5">
              1️⃣ Bật 👁️ Mắt Thần, tránh xa những ô 🔴 đỏ.
            </li>
            <li className="rounded-xl bg-brand-50 px-2.5 py-1.5">
              2️⃣ Chiếm ô trung tâm 🟢 để quân cờ của bé tung hoành.
            </li>
            <li className="rounded-xl bg-brand-50 px-2.5 py-1.5">
              3️⃣ Đừng quên nhập thành để giấu Vua vào lều an toàn!
            </li>
          </ul>
          <p className="mt-2 rounded-xl border-2 border-dashed border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs font-extrabold text-gold-800">
            🎵 Khẩu quyết vè: “Nhìn kỹ trước khi đi - ăn quân không bị mất quân!”
          </p>
          {board.history.length > 0 && (
            <p className="mt-2 text-center text-xs font-bold text-ink-600">
              Nước vừa rồi:{' '}
              <span className="font-extrabold text-brand-700">
                {formatSan(board.history[board.history.length - 1].san, notation)}
              </span>{' '}
              ({PIECE_NAME_VI[pieceFromSan(board.history[board.history.length - 1].san)]})
            </p>
          )}
        </Panel>
      </div>

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🎉'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        onClose={() => setResult(null)}
        onRetry={() => newGame()}
        retryLabel="Ván mới"
      />
    </div>
  )
}
