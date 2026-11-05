import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { EyeToggle } from '../components/EyeToggle'
import { MoveStrip } from '../components/MoveStrip'
import { BoardStage } from '../components/BoardStage'
import { Panel, SectionTitle } from '../components/ui'
import { useEndgamesQuery } from '../data/queries'
import { pickMove } from '../engine/minimax'
import { useChessGame } from '../hooks/useChessGame'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { findHintMove } from '../lib/hints'
import {
  ARROW_COLOR,
  BOARD_MARKS,
  HINT_FROM_STYLE,
  HINT_TO_STYLE,
  PLAN_FOCUS_STYLE,
} from '../lib/notation'
import { playError, playMove, playPromote, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { CSSProperties } from 'react'
import type { EndgameChallenge, EndgameLevel, OpeningMove } from '../types'

const PLAYER_COLOR = 'w' as const

/**
 * Hai MỨC luyện, chia theo độ khó thay vì theo đích: bé chọn đúng tầm mình đang
 * đứng trước, rồi trong mỗi mức tự chọn bài. Mỗi thẻ còn ghi đích bằng emoji
 * (🛡️ phong Hậu / 🏁 chiếu bí) nên vẫn biết ngay bài dạy gì.
 */
const LEVELS: {
  level: EndgameLevel
  icon: string
  title: string
  blurb: string
}[] = [
  {
    level: 'basic',
    icon: '🌱',
    title: 'Tàn cuộc cơ bản',
    blurb: 'Vua che Tốt, Xe/Hậu chiếu bí.',
  },
  {
    level: 'advanced',
    icon: '🔥',
    title: 'Tàn cuộc nâng cao',
    blurb: 'Đổi Xe, Tượng đôi, Mã + Tượng, Lucena.',
  },
]

const FILE_CHARS = 'abcdefgh'

/**
 * Nút của thanh công cụ dưới bàn cờ: cao đúng 2rem, một dòng, không bóng đổ dày.
 * Nằm trong lưới 2×2 (điện thoại hẹp) hoặc 4 cột nên nhãn không bị cắt - vì vậy
 * nhãn luôn là bản NGẮN ("Mục tiêu", "Làm lại"); lời giải thích dài nằm ở `title`.
 */
function ToolButton({
  id,
  icon,
  label,
  title,
  active = false,
  disabled = false,
  pressed,
  tone = 'plain',
  onClick,
}: {
  id?: string
  icon: string
  label: string
  title: string
  active?: boolean
  disabled?: boolean
  /** `aria-pressed` cho nút bật/tắt (bài kiểm trình duyệt đọc thuộc tính này). */
  pressed?: boolean
  /**
   * `sky` = nút HÀNH ĐỘNG chính (💡 Gợi ý, xanh thép như tab Trung cuộc);
   * `plain` = nút phụ nền trắng viền gỗ. Bật/tắt (🎯) thì luôn dùng màu navy đậm
   * của app - KHÔNG dùng đỏ son, vì đỏ son chỉ dành cho "sai / nguy hiểm".
   */
  tone?: 'sky' | 'plain'
  onClick: () => void
}) {
  /*
   * Cùng một "ngôn ngữ nút" với các tab khác: cao 36px, viền 2px, bo 12px và bóng
   * 2px phía dưới để bé thấy bấm được. Trước đây hàng này dùng viền 1px + bo khác
   * nhau nên nhìn lệch hẳn so với nút ở Khai cuộc / Trung cuộc.
   */
  const palette = active
    ? 'border-brand-600 bg-brand-700 text-white shadow-[0_3px_0_#1b2639] hover:bg-brand-600'
    : tone === 'sky'
      ? 'border-info-600 bg-info-500 text-white shadow-[0_3px_0_#294e5a] hover:bg-info-400'
      : 'border-sand-300 bg-white text-brand-700 shadow-[0_3px_0_#e3cda3] hover:border-brand-300 hover:bg-brand-50'

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={pressed}
      className={`inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-2xl border-2 px-2 py-1.5 text-sm font-extrabold leading-none transition-all active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-sand-200 disabled:bg-white disabled:text-brand-400 disabled:opacity-70 disabled:shadow-none ${palette}`}
    >
      <span className="shrink-0 text-sm leading-none" aria-hidden>
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

/**
 * Những ô Vua Đen có thể chạy tới ở thế cờ hiện tại.
 *
 * Vì sao cần: khi bé bấm 🎯 “Mục tiêu” ở bài chiếu bí, bàn cờ tô tím đúng
 * Vua Đen + **mọi ô nó còn chạy được**. Bé nhìn thấy ngay còn thiếu ô nào chưa
 * khóa, thay vì phải tự nhẩm trong đầu.
 *
 * Cách tính: thử từng ô trong 8 ô quanh Vua, dựng lại thế cờ với Vua đứng ở ô
 * đó rồi hỏi `chess.js` xem ô ấy có bị quân Trắng tấn công không - nhờ vậy không
 * phải tự viết lại luật cờ.
 */
function kingEscapeSquares(game: Chess, from: string): string[] {
  const squares: string[] = []
  const fileIndex = FILE_CHARS.indexOf(from[0])
  const rank = Number(from[1])
  for (const df of [-1, 0, 1]) {
    for (const dr of [-1, 0, 1]) {
      if (df === 0 && dr === 0) continue
      const file = fileIndex + df
      const nextRank = rank + dr
      if (file < 0 || file > 7 || nextRank < 1 || nextRank > 8) continue
      const target = `${FILE_CHARS[file]}${nextRank}` as Square
      const occupant = game.get(target)
      // Ô đang có quân Đen khác thì Vua không chen vào được.
      if (occupant && (occupant.color === 'b' || occupant.type === 'k')) continue
      const probe = new Chess(game.fen())
      probe.remove(from as Square)
      if (!probe.put({ type: 'k', color: 'b' }, target)) continue
      if (!probe.isAttacked(target, 'w')) squares.push(target)
    }
  }
  return squares
}

export function EndgamesPage() {
  const { data: endgames, isLoading } = useEndgamesQuery()
  const { notation, soundOn } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()

  const [challengeId, setChallengeId] = useState('opposition')
  const [hintVisible, setHintVisible] = useState(false)
  /**
   * Bé bấm 🎯 “Mục tiêu” → bàn cờ tô tím đúng những ô bé cần nhắm tới:
   * các Tốt của bé + ô phong cấp (bài phong Hậu), hoặc Vua Đen + mọi ô nó còn
   * chạy được (bài chiếu bí). Nhìn thấy mục tiêu rõ hơn hẳn chỉ đọc chữ.
   */
  const [goalFocus, setGoalFocus] = useState(false)
  // Kết thúc ván không đồng nghĩa với đạt mục tiêu: hòa/thua cần thử lại.
  const [finished, setFinished] = useState<'success' | 'retry' | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
  } | null>(null)

  const challenge: EndgameChallenge | undefined =
    endgames?.find((item) => item.id === challengeId) ?? endgames?.[0]

  const board = useChessGame(
    challenge?.fen ?? '8/8/8/8/8/8/8/K6k w - - 0 1',
    challenge?.playerSide ?? 'white',
  )

  useEffect(() => {
    setFinished(null)
    setHintVisible(false)
    setGoalFocus(false)
    setResult(null)
    setConfetti(false)
  }, [challengeId])

  // Đối thủ đi theo engine ở mức DỄ - máy còn mắc lỗi để bé kịp thực hiện kỹ thuật.
  useEffect(() => {
    if (finished) return
    if (board.playerToMove) return
    if (board.game.isGameOver()) return
    const fen = board.fen
    const timer = setTimeout(() => {
      // Mức KHÓ (không còn mức Dễ): bài tàn cuộc phải là đối thủ thật, đỡ quân
       // đúng - hạ được máy mức Khó mới tính là biết kỹ thuật tàn cuộc.
      const move = pickMove(fen, 'hard')
      if (move) board.playSan(move.san)
    }, 750)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.fen, board.playSan, board.playerToMove, finished])

  // Kiểm tra thắng / thua / hòa sau mỗi nước.
  useEffect(() => {
    if (finished || !challenge) return
    const game = board.game
    const playerPromoted = board.history.some(
      (move) => move.promotion && move.color === PLAYER_COLOR,
    )

    if (game.isCheckmate()) {
      setFinished(game.turn() !== PLAYER_COLOR ? 'success' : 'retry')
      if (game.turn() !== PLAYER_COLOR) {
        if (soundOn) playWin()
        setConfetti(true)
        setResult({
          emoji: '🏁',
          title: 'Chiếu bí tuyệt vời!',
          message: 'Bé đã khóa hết đường chạy của Vua Đen. Quá đỉnh!',
        })
      } else {
        setResult({
          emoji: '😅',
          title: 'Bé bị chiếu bí rồi!',
          message: 'Lần sau bé nhớ giữ Vua tránh xa nhé. Thử lại nào!',
        })
      }
      return
    }

    if (game.isStalemate() || game.isInsufficientMaterial() || game.isDraw()) {
      setFinished('retry')
      setResult({
        emoji: '🤝',
        title: 'Hòa cờ mất rồi!',
        message: 'Gần thắng lắm rồi, bé thử lại nhé!',
      })
      return
    }

    if (challenge.goal === 'promote' && playerPromoted) {
      setFinished('success')
      if (soundOn) {
        playPromote()
        playWin()
      }
      setConfetti(true)
      setResult({
        emoji: '👑',
        title: 'Tốt hóa thành Hậu!',
        message: 'Bé đã đưa được Tốt lên tận cùng và phong Hậu. Tuyệt cú mèo!',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.sans, finished, challenge])

  /**
   * Nước hay nhất cho bé ở thế cờ hiện tại - chỉ tính khi bé bấm 💡 Gợi ý.
   * Khác bài đố của tab Trung cuộc: ở đây thế cờ đổi sau mỗi nước nên gợi ý
   * luôn được tính lại theo thế mới.
   */
  const hintMove = useMemo(() => {
    if (finished || !hintVisible || !board.playerToMove) return null
    if (!challenge) return null
    const move = findHintMove(board.game, challenge.goal, PLAYER_COLOR)
    return move ? { from: move.from, to: move.to } : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, finished, hintVisible, board.fen, board.playerToMove])

  const hintArrow = useMemo(
    () =>
      hintMove
        ? [{ startSquare: hintMove.from, endSquare: hintMove.to, color: ARROW_COLOR }]
        : [],
    [hintMove],
  )

  /** Tô sáng QUÂN CẦN ĐI (viền vàng) + Ô ĐÍCH (viền xanh), y như tab Khai cuộc. */
  const hintSquares = useMemo(() => {
    if (!hintMove) return undefined
    return {
      [hintMove.from]: HINT_FROM_STYLE,
      [hintMove.to]: HINT_TO_STYLE,
    }
  }, [hintMove])

  /**
   * Ô TÍM của nút “Mục tiêu”: những gì bé cần nhắm tới ở thế cờ đang đứng.
   *
   * - Bài phong Hậu: tô các Tốt của bé + ô phong cấp trên cùng cột.
   * - Bài chiếu bí: tô Vua Đen + mọi ô Vua Đen còn chạy được (ô bé cần khóa).
   *
   * Tính lại theo thế cờ hiện tại nên sau mỗi nước, các ô mục tiêu tự cập nhật -
   * bé thấy mình đã khóa thêm được ô nào.
   */
  const goalSquares = useMemo(() => {
    if (!goalFocus || !challenge) return undefined
    const game = board.game
    const styles: Record<string, CSSProperties> = {}
    if (challenge.goal === 'promote') {
      for (const row of game.board()) {
        for (const cell of row) {
          if (!cell || cell.color !== PLAYER_COLOR || cell.type !== 'p') continue
          styles[cell.square] = PLAN_FOCUS_STYLE
          const promoSquare = `${cell.square[0]}8`
          if (cell.square[1] !== '8') styles[promoSquare] = PLAN_FOCUS_STYLE
        }
      }
    } else {
      for (const row of game.board()) {
        for (const cell of row) {
          if (!cell || cell.color !== 'b' || cell.type !== 'k') continue
          styles[cell.square] = PLAN_FOCUS_STYLE
          for (const escape of kingEscapeSquares(game, cell.square)) {
            styles[escape] = PLAN_FOCUS_STYLE
          }
        }
      }
    }
    return Object.keys(styles).length > 0 ? styles : undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalFocus, challenge, board.fen])

  const lastMoveSquares = useMemo(
    () =>
      board.lastMove
        ? {
            [board.lastMove.from]: { boxShadow: BOARD_MARKS.lastMoveFrom },
            [board.lastMove.to]: { boxShadow: BOARD_MARKS.lastMoveTo },
          }
        : undefined,
    [board.lastMove],
  )

  /**
   * Vệt nước vừa đi + vệt gợi ý quân cần đi. Khi bé đang soi MỤC TIÊU thì chỉ
   * hiện ô mục tiêu cho đỡ rối mắt - giống cách tab Khai cuộc xử lý.
   */
  const squareStyles = useMemo(() => {
    if (goalFocus) return goalSquares ?? {}
    return hintSquares ? { ...lastMoveSquares, ...hintSquares } : lastMoveSquares
  }, [goalFocus, goalSquares, lastMoveSquares, hintSquares])

  const handleDrop = (from: string, to: string): boolean => {
    if (finished || !board.playerToMove) return false
    const move = board.playMove(from, to)
    if (!move) {
      if (soundOn) playError()
      return false
    }
    if (soundOn) playMove()
    setHintVisible(false)
    return true
  }

  /**
   * Lịch sử nước đi thật của ván đang chơi, để bé xem lại mình đã đi những gì -
   * và bấm vào một nước để **quay lại đúng lúc đó** khi lỡ tay.
   */
  const playedMoves = useMemo<OpeningMove[]>(
    () => board.history.map((move) => ({ san: move.san })),
    [board.history],
  )

  /** Quay lại thế cờ ngay SAU nước thứ `index` (bỏ hết các nước phía sau). */
  const jumpToMove = (index: number) => {
    const back = board.history.length - (index + 1)
    if (back > 0) board.undoMoves(back)
    setFinished(null)
    setHintVisible(false)
  }

  /**
   * “◀ Đi lại” cho bé sửa sai: nếu nước vừa rồi là của máy thì lùi cả nước của
   * máy lẫn nước của bé, để bé được đi lại chính nước mình vừa đi.
   */
  const takeBack = () => {
    const count = board.history.length
    if (count === 0) return
    const last = board.history[count - 1]
    const back = last.color !== PLAYER_COLOR ? Math.min(2, count) : 1
    board.undoMoves(back)
    setFinished(null)
    setHintVisible(false)
  }

  const statusLabel = finished === 'success'
    ? '✅ Đạt mục tiêu'
    : finished === 'retry'
      ? '🤝 Thử lại nhé'
      : board.playerToMove
        ? '🖐️ Đến lượt bé'
        : '🤖 Máy đang nghĩ…'

  /** Ba việc cốt lõi của nhóm bài - một câu, không phải đoạn văn. */
  const mindset =
    (challenge?.goal ?? 'promote') === 'promote'
      ? '1️⃣ Vua đi trước che Tốt · 2️⃣ Đẩy Tốt thẳng lên hàng 8 · 3️⃣ Chạm đích là thành Hậu!'
      : '1️⃣ Canh chặt hàng ngang · 2️⃣ Quân còn lại chiếu Vua · 3️⃣ Hết đường chạy là bí!'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/*
        Cột trái CHỈ có bàn cờ + nút điều khiển → bàn cờ luôn to hết cỡ.

        `reserve` là 296 (trước đây 232) vì phép tính của BoardStage còn phải chừa
        cả thanh tab cố định ở đáy (64px): thiếu nó thì ở cửa sổ 938×914 hàng nút
        nằm sau thanh tab, bé phải cuộn mới bấm được. Bàn cờ dựng đứng vẫn rộng
        hết cỡ (bị chặn bề ngang chứ không phải chiều cao) nên không nhỏ đi.
      */}
      <BoardStage
        reserve={296}
        top={
          /*
           * `mb-2`: khung gỗ của bàn cờ tràn lên 12px (`-m-3` trong
           * ChessBoardPanel), nhiều hơn khe 6px giữa hàng này và bàn cờ, nên phải
           * chừa thêm chút đệm - không thì đáy các chip bị khung bàn cờ che mất
           * một mảng, trông như bị cắt cụt.
           */
          <div className="mb-2 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
            {/*
              Một hàng trạng thái GỌN cho điện thoại: nhãn mục tiêu viết ngắn, số
              nước chỉ hiện khi đã có nước, và nút Mắt Thần nằm chung hàng. Trước
              đây ba chip + nút Mắt Thần rơi thành 3-4 hàng, đẩy bàn cờ xuống gần
              40px mà không thêm thông tin gì.
            */}
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-extrabold text-gold-800">
                <span className="stage:hidden">
                  {challenge?.goal === 'promote' ? '🛡️ Thành Hậu' : '🏁 Chiếu bí'}
                </span>
                <span className="hidden stage:inline">
                  {challenge?.goal === 'promote' ? '🛡️ Đưa Tốt lên thành Hậu' : '🏁 Chiếu bí Vua Đen'}
                </span>
              </span>
              {board.history.length > 0 && (
                <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-extrabold text-brand-700">
                  {board.history.length} nước
                </span>
              )}
              <span
                id="kid-endgame-status"
                role="status"
                className="rounded-full bg-leaf-100 px-2.5 py-1 text-xs font-extrabold text-leaf-700"
              >
                {statusLabel}
              </span>
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} />
          </div>
        }
        board={
          isLoading || !challenge ? (
            <div className="aspect-square w-full animate-pulse rounded-[1.4rem] bg-brand-100" />
          ) : (
            <ChessBoardPanel
              fen={board.fen}
              orientation="white"
              playerSide="white"
              interactive={board.playerToMove && !finished}
              heatmap={heatmap}
              arrows={goalFocus ? [] : hintArrow}
              extraSquareStyles={squareStyles}
              onDrop={handleDrop}
            />
          )
        }
        under={
          <>
            {/*
              Hàng công cụ GỌN như tab Trung cuộc: bốn nút cùng một cỡ, cùng bóng
              đáy 2px nên nhìn liền một khối. Lưới 2×2 ở điện thoại hẹp (dưới
              480px), 4 cột từ 480px trở lên: nhãn “Mục tiêu / Làm lại” không còn
              bị cắt thành “Mục …”, và mỗi nút vẫn cao 40px - đủ to cho ngón tay bé.
            */}
            <div className="mx-auto grid w-full max-w-[32rem] grid-cols-2 gap-1.5 min-[480px]:grid-cols-4">
              <ToolButton
                icon="💡"
                label="Gợi ý"
                tone="sky"
                title="Gợi ý nước hay nhất ở thế cờ này"
                onClick={() => {
                  setGoalFocus(false)
                  setHintVisible(true)
                }}
                disabled={hintVisible || Boolean(finished) || !board.playerToMove}
              />
              <ToolButton
                id="kid-endgame-goal"
                icon="🎯"
                label={goalFocus ? 'Tắt' : 'Mục tiêu'}
                active={goalFocus}
                pressed={goalFocus}
                title="Tô tím những ô bé cần nhắm tới ở thế cờ này (bấm lần nữa để tắt)"
                onClick={() => {
                  setHintVisible(false)
                  setGoalFocus((value) => !value)
                }}
              />
              <ToolButton
                id="kid-endgame-takeback"
                icon="◀"
                label="Đi lại"
                title="Lùi lại nước vừa rồi để đi lại"
                onClick={takeBack}
                disabled={board.history.length === 0}
              />
              <ToolButton
                icon="🔄"
                label="Làm lại"
                title="Chơi lại bài này từ đầu"
                onClick={() => {
                  board.reset()
                  setFinished(null)
                  setHintVisible(false)
                  setGoalFocus(false)
                  setResult(null)
                  setConfetti(false)
                }}
              />
            </div>

            {/* Đổi lời nhắc theo việc bé đang làm - không thêm dòng nào nên bàn cờ
                không bị thu nhỏ (xem chú thích `reserve` của BoardStage). */}
            {!finished && (
              <p className="text-center text-xs font-bold leading-snug text-ink-600">
                {goalFocus
                  ? '🎯 Ô TÍM là chỗ bé cần nhắm tới (Tốt + ô phong cấp, hoặc Vua Đen + ô nó chạy được).'
                  : !board.playerToMove
                    ? '🤖 Chờ máy đi một nước · ◀ Đi lại để sửa nước vừa đi.'
                    : '🖐️ Kéo quân hoặc bấm quân rồi bấm ô đích · 💡 viền vàng → viền xanh'}
              </p>
            )}

            {finished && (
              <p className="animate-pop-in rounded-xl bg-leaf-50 px-2.5 py-1.5 text-center text-xs font-extrabold text-leaf-700">
                {finished === 'success'
                  ? '🎯 Đạt mục tiêu! Chọn bài khác để luyện tiếp nhé.'
                  : '🌱 Chưa đạt mục tiêu. Bấm ◀ Đi lại để sửa hoặc 🔄 Làm lại nhé.'}
              </p>
            )}
          </>
        }
      />

      {/*
        Cột phải xếp theo đúng thứ tự bé dùng:
          1. CHỌN BÀI (việc làm nhiều nhất - trước đây nằm tận cuối, phải cuộn qua ba khung),
          2. bài đang luyện: mục tiêu → 3 việc → mẹo → nước đã đi, gói trong MỘT khung.
        Hai khung nằm SÁT nhau nên trên máy tính không còn khoảng trống ~350px
        giữa hai khung (bỏ `stage:mt-auto` đã đẩy khung bài học xuống đáy cột).
      */}
      <div className="lesson-reader flex min-h-0 flex-col gap-1.5 stage:overflow-y-auto stage:pr-1">
        <Panel id="kid-endgame-list" className="stage:p-2">
          <SectionTitle
            icon="👑"
            title="Tàn cuộc"
            subtitle={`Cơ bản + nâng cao · ${endgames?.length ?? 0} thế`}
            info="endgame"
          />
          {/*
            CHỌN BÀI BẰNG COMBO (cùng kiểu tab Đối phó): trước đây 20 thẻ nhỏ xếp
            thành 4 hàng - vừa chiếm gần nửa cột phải, vừa phải đọc từng thẻ để tìm
            bài. Combo chỉ cao một dòng, mở ra là thấy đủ 20 bài chia sẵn hai mức
            (optgroup), và nói rõ ĐANG luyện bài nào. Trên điện thoại dùng luôn bảng
            chọn quen thuộc của máy nên không phải vuốt qua cả thư viện.
          */}
          <label
            htmlFor="kid-endgame-select"
            className="mt-1.5 flex min-w-0 items-center gap-1.5 rounded-xl border-2 border-brand-200 bg-white px-2 py-1"
          >
            <span className="shrink-0 text-xs font-extrabold uppercase tracking-wide text-brand-500">
              Bài tàn cuộc
            </span>
            <select
              id="kid-endgame-select"
              value={challenge?.id ?? ''}
              onChange={(event) => setChallengeId(event.target.value)}
              aria-label="Chọn bài tàn cuộc"
              className="min-w-0 flex-1 appearance-none truncate bg-transparent text-sm font-extrabold text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              {LEVELS.map((group) => {
                const items = (endgames ?? []).filter(
                  (item) => (item.level ?? 'basic') === group.level,
                )
                if (items.length === 0) return null
                return (
                  <optgroup key={group.level} label={`${group.icon} ${group.title}`}>
                    {items.map((item) => (
                      <option key={item.id} value={item.id} data-endgame-id={item.id}>
                        {item.goal === 'promote' ? '🛡️' : '🏁'} {item.title}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
            <span aria-hidden className="shrink-0 text-brand-500">
              ▾
            </span>
          </label>
          {/*
            Hai tên mức vẫn hiện thành một dòng ngắn: optgroup chỉ đọc được khi mở
            combo, còn dòng này cho bé biết ngay thư viện chia làm hai tầm.
          */}
          <p className="mt-1 text-xs font-bold text-brand-500">
            {LEVELS.map((group) => {
              const count = (endgames ?? []).filter(
                (item) => (item.level ?? 'basic') === group.level,
              ).length
              return `${group.icon} ${group.title} ${count} bài`
            }).join(' · ')}
          </p>
        </Panel>

        {/*
          Khung bài học cao ĐÚNG BẰNG nội dung và nằm ngay dưới combo. Trước đây
          nó bị `stage:mt-auto` đẩy xuống đáy cột, để hở một khoảng trống lớn ngay
          dưới khung chọn bài - nhìn như trang bị thiếu nội dung.
        */}
        <Panel id="kid-endgame-lesson" className="grid gap-0.5 stage:p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-extrabold text-brand-900">
              🧭 {challenge?.title ?? ''}
            </span>
            <span className="shrink-0 rounded-full bg-sand-100 px-2 py-0.5 text-xs font-extrabold text-brand-600 ring-1 ring-sand-200">
              {board.history.length} nước
            </span>
          </div>
          {/*
            Lời nhắc + mindset chung MỘT hộp: hai câu ngắn cùng trả lời “bé làm gì
            bây giờ”, tách hai hộp chỉ tốn chiều cao mà đọc bị ngắt.
          */}
          <div className="grid gap-0.5 rounded-2xl bg-brand-50 px-2.5 py-1.5 text-xs font-bold leading-snug text-brand-700">
            <p>{challenge?.hint}</p>
            <p className="text-brand-600">🧠 {mindset}</p>
          </div>

          {/*
            Mẹo + câu vè in liền MỘT đoạn: trước đây là nhãn + đoạn + hộp vàng riêng,
            tốn ba dòng chiều cao mà đọc rời rạc. Nội dung không mất chữ nào.
          */}
          <div id="kid-endgame-explanation" className="border-t border-brand-100 pt-1.5">
            <p className="text-xs font-bold leading-snug text-brand-700">
              <span className="font-extrabold tracking-wide text-brand-500">
                💡 Mẹo của bài này:{' '}
              </span>
              {challenge?.explanation}{' '}
              <span className="font-extrabold text-gold-800">🎵 “{challenge?.rhyme}”</span>
            </p>
          </div>

          <div
            id="kid-endgame-history"
            className={
              playedMoves.length === 0 ? 'grid gap-1' : 'grid gap-1 border-t border-brand-100 pt-1.5'
            }
          >
            {playedMoves.length === 0 ? (
              <p className="text-xs font-bold text-ink-600">
                📜 🐣 Bé kéo một quân để bắt đầu - từng nước hiện ở đây, bấm một nước để quay lại.
              </p>
            ) : (
              <>
                <span className="text-xs font-extrabold uppercase tracking-wide text-brand-500">
                  📜 Nước đi của ván · bấm một nước để quay lại
                </span>
              <MoveStrip
                moves={playedMoves}
                side={challenge?.playerSide ?? 'white'}
                ply={playedMoves.length}
                notation={notation}
                onJump={jumpToMove}
              />
              </>
            )}
          </div>
        </Panel>

      </div>

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🎉'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        onClose={() => setResult(null)}
        onRetry={() => {
          setResult(null)
          board.reset()
          setFinished(null)
          setHintVisible(false)
          setGoalFocus(false)
          setConfetti(false)
        }}
        retryLabel="Chơi lại"
      />
    </div>
  )
}