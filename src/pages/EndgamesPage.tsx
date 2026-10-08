import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { EyeToggle } from '../components/EyeToggle'
import { MoveStrip } from '../components/MoveStrip'
import { BoardStage } from '../components/BoardStage'
import { KidButton, Panel, SectionTitle } from '../components/ui'
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
import type { EndgameChallenge, EndgameGoal, OpeningMove } from '../types'

const PLAYER_COLOR = 'w' as const

/**
 * Hai nhóm bài tàn cuộc, chia theo ĐÍCH cuối cùng của bé. Bé nhìn là biết ngay
 * mình sắp luyện "đưa Tốt lên Hậu" hay "chiếu bí Vua Đen".
 */
const GROUPS: {
  goal: EndgameGoal
  icon: string
  title: string
  blurb: string
}[] = [
  {
    goal: 'promote',
    icon: '🛡️',
    title: 'Đưa Tốt lên thành Hậu',
    blurb: 'Vua đi trước che Tốt, Tốt cứ tiến tới hàng 8.',
  },
  {
    goal: 'checkmate',
    icon: '🏁',
    title: 'Chiếu bí Vua Đen',
    blurb: 'Khóa hết đường chạy của Vua Đen rồi chiếu.',
  },
]

const FILE_CHARS = 'abcdefgh'

/**
 * Những ô Vua Đen có thể chạy tới ở thế cờ hiện tại.
 *
 * Vì sao cần: khi bé bấm 🎯 “Soi mục tiêu” ở bài chiếu bí, bàn cờ tô tím đúng
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

  const [challengeId, setChallengeId] = useState('promote-easy')
  const [hintVisible, setHintVisible] = useState(false)
  /**
   * Bé bấm 🎯 “Soi mục tiêu” → bàn cờ tô tím đúng những ô bé cần nhắm tới:
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
      const move = pickMove(fen, 'easy')
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
   * Ô TÍM của “Soi mục tiêu”: những gì bé cần nhắm tới ở thế cờ đang đứng.
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      {/* Cột trái CHỈ có bàn cờ + nút điều khiển → bàn cờ luôn to hết cỡ. */}
      <BoardStage
        reserve={232}
        top={
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gold-100 px-3 py-1 text-xs font-extrabold text-gold-800">
                {challenge?.goal === 'promote' ? '🛡️ Đưa Tốt lên thành Hậu' : '🏁 Chiếu bí Vua Đen'}
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700">
                {board.history.length} nước
              </span>
              <span
                id="kid-endgame-status"
                role="status"
                className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-extrabold text-leaf-700"
              >
                {statusLabel}
              </span>
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} />
          </>
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
            <div className="flex flex-wrap items-center gap-2">
              <KidButton
                variant="sky"
                onClick={() => {
                  setGoalFocus(false)
                  setHintVisible(true)
                }}
                disabled={hintVisible || Boolean(finished) || !board.playerToMove}
              >
                💡 Gợi ý
              </KidButton>
              <KidButton
                id="kid-endgame-goal"
                variant={goalFocus ? 'rose' : 'grass'}
                onClick={() => {
                  setHintVisible(false)
                  setGoalFocus((value) => !value)
                }}
                aria-pressed={goalFocus}
                title="Tô tím những ô bé cần nhắm tới ở thế cờ này"
              >
                🎯 {goalFocus ? 'Tắt soi mục tiêu' : 'Soi mục tiêu'}
              </KidButton>
              <KidButton
                id="kid-endgame-takeback"
                variant="ghost"
                onClick={takeBack}
                disabled={board.history.length === 0}
                title="Lùi lại nước vừa rồi để đi lại"
              >
                ◀ Đi lại
              </KidButton>
              <KidButton
                variant="ghost"
                onClick={() => {
                  board.reset()
                  setFinished(null)
                  setHintVisible(false)
                  setGoalFocus(false)
                  setResult(null)
                  setConfetti(false)
                }}
              >
                🔄 Làm lại
              </KidButton>
            </div>

            {/* Đổi lời nhắc theo việc bé đang làm - không thêm dòng nào nên bàn cờ
                không bị thu nhỏ (xem chú thích `reserve` của BoardStage). */}
            {!finished && (
              <p className="text-[0.7rem] font-bold text-brand-400">
                {goalFocus
                  ? '🎯 Ô TÍM là những gì bé cần nhắm tới: Tốt + ô phong cấp, hoặc Vua Đen + các ô nó còn chạy được.'
                  : !board.playerToMove
                    ? '🤖 Chờ máy đi một nước nhé. Bé có thể bấm Đi lại để sửa nước vừa đi.'
                    : '🖐️ Kéo quân hoặc bấm quân rồi bấm ô đích · 💡 Gợi ý: viền vàng → viền xanh'}
              </p>
            )}

            {finished && (
              <p className="animate-pop-in rounded-2xl bg-leaf-50 px-3 py-2 text-center text-sm font-extrabold text-leaf-700">
                {finished === 'success'
                  ? '🎯 Bé đã đạt mục tiêu! Chọn bài khác để luyện tiếp nhé.'
                  : '🌱 Ván đã kết thúc nhưng chưa đạt mục tiêu. Bấm Đi lại để sửa hoặc Làm lại nhé.'}
              </p>
            )}
          </>
        }
      />

      {/* Cột phải: bài đang luyện → lịch sử nước đi → chọn bài theo nhóm. */}
      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 truncate text-sm font-extrabold text-brand-900">
              🧭 {challenge?.title ?? ''}
            </div>
            <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[0.7rem] font-extrabold text-brand-600 ring-1 ring-sand-200">
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 text-xs font-bold text-brand-600">{challenge?.hint}</p>
          <p className="mt-1 rounded-2xl bg-brand-50 px-2.5 py-1.5 text-[0.7rem] font-bold leading-snug text-brand-700">
            {challenge?.goal === 'promote'
              ? '1️⃣ Vua đi trước che Tốt · 2️⃣ Đẩy Tốt thẳng lên hàng 8 · 3️⃣ Chạm đích là thành Hậu!'
              : '1️⃣ Canh chặt hàng ngang · 2️⃣ Quân còn lại chiếu Vua · 3️⃣ Hết đường chạy là bí!'}
          </p>
          {goalFocus && challenge && (
            <p
              id="kid-endgame-goal-note"
              className="animate-pop-in mt-1 rounded-2xl border-2 border-dashed border-[#6d5bc7] bg-[rgba(126,106,209,0.12)] px-2.5 py-1.5 text-[0.7rem] font-bold leading-snug text-brand-800"
            >
              🎯 Ô tím trên bàn cờ:{' '}
              {challenge.goal === 'promote'
                ? 'Tốt của bé và ô phong cấp trên cùng cột - đưa Tốt tới đó là thành Hậu.'
                : 'Vua Đen và mọi ô nó còn chạy được - bé phải khóa hết rồi mới chiếu bí.'}
            </p>
          )}
          <p className="mt-1 text-[0.7rem] font-bold text-brand-400">
            🤖 Vua Đen đi như một bạn nhỏ đang tập chơi - thỉnh thoảng mắc lỗi, bé cứ bình tĩnh dồn
            Vua nhé.
          </p>
        </Panel>

        {/*
          Lịch sử nước đi: bé thấy mình đã đi những gì, và bấm một nước là quay lại
          đúng lúc đó. Trước đây bàn cờ chỉ hiện vệt nước vừa đi nên bé không có
          cách nào "sửa sai" ngoài bấm Làm lại từ đầu.
        */}
        <Panel id="kid-endgame-history">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[0.7rem] font-extrabold uppercase tracking-wide text-brand-500">
              📜 Nước đi của ván
            </span>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.7rem] font-extrabold text-brand-700 ring-1 ring-brand-100">
              {board.history.length} nước
            </span>
          </div>
          {playedMoves.length === 0 ? (
            <p className="mt-1 text-[0.7rem] font-bold text-brand-400">
              🐣 Bé kéo một quân trên bàn cờ để bắt đầu - từng nước sẽ hiện ở đây.
            </p>
          ) : (
            <div className="mt-1.5">
              <MoveStrip
                moves={playedMoves}
                side={challenge?.playerSide ?? 'white'}
                ply={playedMoves.length}
                notation={notation}
                onJump={jumpToMove}
              />
              <p className="mt-1 text-[0.7rem] font-bold text-brand-400">
                👆 Bấm một nước để quay lại đúng lúc đó, hoặc bấm ◀ Đi lại để lùi nước vừa rồi.
              </p>
            </div>
          )}
        </Panel>

        {challenge && (
          <Panel id="kid-endgame-explanation">
            <h3 className="text-xs font-extrabold text-brand-800">💡 Mẹo của bài này</h3>
            <p className="mt-1 text-sm font-bold text-brand-700">{challenge.explanation}</p>
            <p className="mt-1 rounded-xl bg-gold-50 px-2.5 py-1.5 text-xs font-extrabold text-gold-800">
              🎵 Khẩu quyết: “{challenge.rhyme}”
            </p>
          </Panel>
        )}

        {/*
          12 thế luyện chia thành HAI NHÓM theo đích cuối cùng. Bé thấy rõ mình đang
          luyện "đưa Tốt lên Hậu" hay "chiếu bí", thay vì một dải chip dài phẳng.
        */}
        <Panel id="kid-endgame-list">
          <SectionTitle
            icon="👑"
            title="Tàn cuộc cơ bản"
            subtitle="Endgame · 12 thế luyện cơ bản"
            info="endgame"
          />
          <div className="mt-2 grid gap-2.5">
            {GROUPS.map((group) => {
              const items = (endgames ?? []).filter((item) => item.goal === group.goal)
              if (items.length === 0) return null
              return (
                <div key={group.goal} className="grid gap-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xs font-extrabold text-brand-800">
                      {group.icon} {group.title}
                    </span>
                    <span className="text-[0.7rem] font-bold text-brand-400">
                      {group.blurb}
                    </span>
                  </div>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {items.map((item) => {
                      const active = item.id === challenge?.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-endgame-id={item.id}
                          onClick={() => setChallengeId(item.id)}
                          aria-pressed={active}
                          title={item.title}
                          className={`grid gap-0.5 rounded-2xl border-2 px-2.5 py-1.5 text-left transition-all active:translate-y-[2px] ${
                            active
                              ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                              : 'border-brand-100 bg-white hover:border-brand-300'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span aria-hidden>{group.icon}</span>
                            <span
                              className={`min-w-0 flex-1 truncate text-[0.72rem] font-extrabold ${
                                active ? 'text-brand-800' : 'text-brand-700'
                              }`}
                            >
                              {item.title}
                            </span>
                          </span>
                          {/* Một dòng gợi ý ngay trên thẻ để bé chọn bài mà không
                              phải bấm thử từng cái. */}
                          <span className="line-clamp-2 text-[0.66rem] font-bold leading-snug text-brand-400">
                            {item.hint}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
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