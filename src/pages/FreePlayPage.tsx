import { useEffect, useMemo, useRef, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { EyeToggle } from '../components/EyeToggle'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import type { Difficulty } from '../engine/minimax'
import { useChessEngine } from '../engine/useChessEngine'
import { useChessGame } from '../hooks/useChessGame'
import { formatSan, PIECE_NAME_VI, pieceFromSan } from '../lib/notation'
import { playError, playMove, playPromote, playTick, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { Side } from '../types'

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

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

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; icon: string }[] = [
  { value: 'easy', label: 'Dễ', icon: '🐣' },
  { value: 'medium', label: 'Vừa', icon: '🐰' },
  { value: 'hard', label: 'Khó', icon: '🦊' },
]

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: 'Máy chơi ngây thơ, hay quên bảo vệ quân — bé tha hồ săn quân!',
  medium: 'Máy biết ăn quân và tránh mất quân. Bé phải nhìn kỹ nhé!',
  hard: 'Máy tính trước 3 nước. Hãy bật 👁️ Mắt Thần trước khi đi!',
}

export function FreePlayPage() {
  const { notation, completeActivity, soundOn } = useKidProgress()
  const { think } = useChessEngine()

  const [kidSide, setKidSide] = useState<Side>('white')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [heatmap, setHeatmap] = useState(true)
  const [thinking, setThinking] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)
  const [gameKey, setGameKey] = useState(0)

  const board = useChessGame(START_FEN, kidSide)
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
        const first = completeActivity('freeplay:first-win', 8)
        const tough = difficulty === 'hard' ? 6 : difficulty === 'medium' ? 3 : 0
        setResult({
          emoji: '🏆',
          title: 'Bé chiếu bí máy rồi!',
          message: `Tuyệt vời! Bé đã hạ gục chú máy ở mức ${
            difficulty === 'hard' ? 'Khó' : difficulty === 'medium' ? 'Vừa' : 'Dễ'
          }.`,
          stars: (first ? 8 : 4) + tough,
        })
      } else {
        setResult({
          emoji: '🤗',
          title: 'Máy chiếu bí mất rồi!',
          message: 'Không sao đâu bé! Bật 👁️ Mắt Thần rồi chơi lại, lần này bé sẽ thắng!',
          stars: 1,
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
        stars: 1,
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

  const newGame = (side: Side = kidSide) => {
    finishedRef.current = false
    setKidSide(side)
    setResult(null)
    setThinking(false)
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

  const handleDrop = (from: string, to: string): boolean => {
    const move = board.playMove(from, to, 'q')
    if (!move) {
      if (soundOn) playError()
      return false
    }
    if (move.promotion && soundOn) playPromote()
    else if (soundOn) playMove()
    return true
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
          : '👉 Lượt của bé — suy nghĩ rồi đi nhé!'
        : '⏳ Chờ máy đi...'

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
      <Confetti show={confetti} onDone={() => setConfetti(false)} />

      <div className="grid gap-3">
        <Panel>
          <SectionTitle
            icon="🎮"
            title="Đấu tập tự do cùng chú Máy"
            subtitle="Chơi trọn một ván cờ thật, có Vua, Hậu, Xe, Tượng, Mã, Tốt đông đủ!"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-violet-500">
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
              <p className="mb-1 text-xs font-extrabold uppercase tracking-wide text-violet-500">
                🤖 Máy chơi giỏi cỡ nào?
              </p>
              <Segmented
                options={DIFFICULTY_OPTIONS}
                value={difficulty}
                onChange={setDifficulty}
                size="sm"
              />
            </div>
          </div>
          <p className="mt-2 rounded-2xl bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
            {DIFFICULTY_BLURB[difficulty]}
          </p>
        </Panel>

        <Panel className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  kidInCheck
                    ? 'animate-pulse bg-rose-100 text-rose-700'
                    : 'bg-violet-100 text-violet-700'
                }`}
              >
                {statusText}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                Nước {board.history.length + 1}
              </span>
            </div>
            <EyeToggle on={heatmap} onToggle={() => setHeatmap((value) => !value)} />
          </div>

          <ChessBoardPanel
            key={gameKey}
            fen={board.fen}
            orientation={kidSide}
            playerSide={kidSide}
            interactive={isKidTurn}
            heatmap={heatmap}
            extraSquareStyles={
              board.lastMove
                ? {
                    [board.lastMove.from]: {
                      boxShadow: 'inset 0 0 0 3px rgba(250, 204, 21, 0.95)',
                    },
                    [board.lastMove.to]: {
                      boxShadow: 'inset 0 0 0 4px rgba(250, 204, 21, 0.95)',
                    },
                  }
                : undefined
            }
            onDrop={handleDrop}
          />

          <div className="flex flex-wrap items-center gap-2">
            <KidButton variant="grass" onClick={() => newGame()}>
              ♟️ Ván mới
            </KidButton>
            <KidButton
              variant="sky"
              disabled={board.history.length === 0 || thinking}
              onClick={() => {
                // Lùi 2 nửa nước: nước của máy và nước của bé.
                board.undoMoves(board.history.length % 2 === 0 ? 2 : 1)
                finishedRef.current = false
                setResult(null)
              }}
            >
              ↩️ Đi lại nước vừa rồi
            </KidButton>
            <KidButton variant="ghost" onClick={() => setHeatmap((value) => !value)}>
              👁️ {heatmap ? 'Tắt Mắt Thần' : 'Bật Mắt Thần'}
            </KidButton>
          </div>

          <div className="rounded-2xl bg-violet-50 p-2.5">
            <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-violet-700">
              <span>🍬 Chiến lợi phẩm của bé</span>
              <span>{captures.byKid.length} quân</span>
            </div>
            <div className="flex min-h-7 flex-wrap items-center gap-0.5 text-xl leading-none">
              {captures.byKid.length === 0 ? (
                <span className="text-xs font-bold text-violet-400">
                  Chưa ăn được quân nào — hãy tìm quân đối thủ sơ hở nhé!
                </span>
              ) : (
                captures.byKid.map((item, index) => (
                  <span key={index}>{GLYPH[`${item.color}${item.type.toUpperCase()}`] ?? '♟'}</span>
                ))
              )}
            </div>
            <div className="mt-2 mb-1 flex items-center justify-between text-xs font-extrabold text-rose-500">
              <span>🤖 Máy đã ăn của bé</span>
              <span>{captures.byEngine.length} quân</span>
            </div>
            <div className="flex min-h-6 flex-wrap items-center gap-0.5 text-xl leading-none opacity-80">
              {captures.byEngine.length === 0 ? (
                <span className="text-xs font-bold text-rose-300">Chưa mất quân nào, giỏi quá!</span>
              ) : (
                captures.byEngine.map((item, index) => (
                  <span key={index}>{GLYPH[`${item.color}${item.type.toUpperCase()}`] ?? '♟'}</span>
                ))
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3">
        <Panel>
          <SectionTitle
            icon="📜"
            title="Sách ghi ván cờ"
            subtitle="Bé tập đọc lại ván đấu của mình như một kỳ thủ nhí!"
          />
          <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl bg-violet-50 p-2">
            {moveRows.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm font-bold text-violet-400">
                Ván cờ chưa bắt đầu. Bé đi nước đầu tiên nào! 🚀
              </p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {moveRows.map((row) => (
                    <tr key={row.no} className="odd:bg-white/70">
                      <td className="w-8 rounded-l-lg px-2 py-1 text-right font-extrabold text-violet-400">
                        {row.no}.
                      </td>
                      <td className="px-2 py-1 font-extrabold text-violet-900">
                        {row.white ? formatSan(row.white, notation) : ''}
                      </td>
                      <td className="px-2 py-1 font-extrabold text-violet-600">
                        {row.black ? formatSan(row.black, notation) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            icon="🧠"
            title="Bí kíp thắng chú Máy"
            subtitle="Ba điều bé nên nhớ trong mỗi nước đi"
          />
          <ul className="mt-3 grid gap-2 text-sm font-bold text-violet-700">
            <li className="rounded-2xl bg-violet-50 px-3 py-2">
              1️⃣ Bật 👁️ Mắt Thần, tránh xa những ô 🔴 đỏ.
            </li>
            <li className="rounded-2xl bg-violet-50 px-3 py-2">
              2️⃣ Chiếm ô trung tâm 🟢 để quân cờ của bé tung hoành.
            </li>
            <li className="rounded-2xl bg-violet-50 px-3 py-2">
              3️⃣ Đừng quên nhập thành để giấu Vua vào lều an toàn!
            </li>
          </ul>
          <p className="mt-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-800">
            🎵 Khẩu quyết vè: “Nhìn kỹ trước khi đi — ăn quân không bị mất quân!”
          </p>
          {board.history.length > 0 && (
            <p className="mt-2 text-center text-xs font-bold text-violet-400">
              Nước vừa rồi:{' '}
              <span className="font-extrabold text-violet-700">
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
        stars={result?.stars ?? 0}
        onClose={() => setResult(null)}
        onRetry={() => newGame()}
        retryLabel="Ván mới"
      />
    </div>
  )
}
