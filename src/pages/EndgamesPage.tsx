import { useEffect, useMemo, useState } from 'react'
import { CelebrationModal } from '../components/CelebrationModal'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { Confetti } from '../components/Confetti'
import { ExplanationBanner } from '../components/ExplanationBanner'
import { EyeToggle } from '../components/EyeToggle'
import { BoardStage } from '../components/BoardStage'
import { KidButton, Panel, SectionTitle } from '../components/ui'
import { useEndgamesQuery } from '../data/queries'
import { useChessGame } from '../hooks/useChessGame'
import { findHintMove } from '../lib/hints'
import { ARROW_COLOR, BOARD_MARKS, HINT_FROM_STYLE, HINT_TO_STYLE } from '../lib/notation'
import { playError, playMove, playPromote, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { EndgameChallenge, MoveAnnotation } from '../types'

const PLAYER_COLOR = 'w' as const

export function EndgamesPage() {
  const { data: endgames, isLoading } = useEndgamesQuery()
  const { notation, completeActivity, isCompleted, soundOn } = useKidProgress()

  const [challengeId, setChallengeId] = useState('promote-easy')
  const [heatmap, setHeatmap] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [finished, setFinished] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [result, setResult] = useState<{
    emoji: string
    title: string
    message: string
    stars: number
  } | null>(null)

  const challenge: EndgameChallenge | undefined =
    endgames?.find((item) => item.id === challengeId) ?? endgames?.[0]

  const board = useChessGame(
    challenge?.fen ?? '8/8/8/8/8/8/8/K6k w - - 0 1',
    challenge?.playerSide ?? 'white',
  )

  useEffect(() => {
    setFinished(false)
    setHintVisible(false)
  }, [challengeId])

  // Đối thủ (Vua Đen) đi ngẫu nhiên như một em nhỏ đang tập chơi.
  useEffect(() => {
    if (finished) return
    if (board.playerToMove) return
    if (board.game.isGameOver()) return
    const timer = setTimeout(() => board.autoReply(), 750)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.sans.length, board.playerToMove, finished])

  // Kiểm tra thắng / thua / hòa sau mỗi nước.
  useEffect(() => {
    if (finished || !challenge) return
    const game = board.game

    if (game.isCheckmate()) {
      setFinished(true)
      if (game.turn() !== PLAYER_COLOR) {
        if (soundOn) playWin()
        setConfetti(true)
        const firstTime = completeActivity(`endgame:${challenge.id}`, 5)
        setResult({
          emoji: '🏁',
          title: 'Chiếu bí tuyệt vời!',
          message: 'Bé đã khóa hết đường chạy của Vua Đen. Quá đỉnh!',
          stars: firstTime ? 5 : 2,
        })
      } else {
        setResult({
          emoji: '😅',
          title: 'Bé bị chiếu bí rồi!',
          message: 'Lần sau bé nhớ giữ Vua tránh xa nhé. Thử lại nào!',
          stars: 0,
        })
      }
      return
    }

    if (game.isStalemate() || game.isInsufficientMaterial() || game.isDraw()) {
      setFinished(true)
      setResult({
        emoji: '🤝',
        title: 'Hòa cờ mất rồi!',
        message: 'Gần thắng lắm rồi, bé thử lại nhé!',
        stars: 0,
      })
      return
    }

    const promoted = board.history.some(
      (move) => move.promotion && move.color === PLAYER_COLOR,
    )
    if (challenge.goal === 'promote' && promoted) {
      setFinished(true)
      if (soundOn) {
        playPromote()
        playWin()
      }
      setConfetti(true)
      const firstTime = completeActivity(`endgame:${challenge.id}`, 5)
      setResult({
        emoji: '👑',
        title: 'Tốt hóa thành Hậu!',
        message: 'Bé đã đưa được Tốt lên tận cùng và phong Hậu. Tuyệt cú mèo!',
        stars: firstTime ? 5 : 2,
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
    if (!challenge || finished || !hintVisible) return null
    if (!board.playerToMove) return null
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

  /** Vệt nước vừa đi + vệt gợi ý quân cần đi (gợi ý đè lên vệt cũ). */
  const squareStyles = useMemo(
    () => (hintSquares ? { ...lastMoveSquares, ...hintSquares } : lastMoveSquares),
    [lastMoveSquares, hintSquares],
  )

  const handleDrop = (from: string, to: string): boolean => {
    const move = board.playMove(from, to)
    if (!move) {
      if (soundOn) playError()
      return false
    }
    if (soundOn) playMove()
    setHintVisible(false)
    return true
  }

  const doneCount = (endgames ?? []).filter((item) => isCompleted(`endgame:${item.id}`)).length

  const annotation: MoveAnnotation | null = challenge
    ? {
        san: challenge.goal === 'promote' ? 'e8=Q' : 'Q#',
        piece: challenge.goal === 'promote' ? 'q' : 'q',
        reason: challenge.explanation,
        rhyme: challenge.rhyme,
      }
    : null

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
                {challenge?.goal === 'promote'
                  ? '🛡️ Đưa Tốt lên thành Hậu'
                  : '🏁 Chiếu bí Vua Đen'}
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700">
                {board.history.length} nước
              </span>
            </div>
            <EyeToggle on={heatmap} onToggle={() => setHeatmap((value) => !value)} />
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
              arrows={hintArrow}
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
                onClick={() => setHintVisible(true)}
                disabled={hintVisible || finished || !board.playerToMove}
              >
                💡 Gợi ý
              </KidButton>
              <KidButton
                variant="ghost"
                onClick={() => {
                  board.reset()
                  setFinished(false)
                  setHintVisible(false)
                }}
              >
                🔄 Làm lại
              </KidButton>
            </div>

            {!finished && (
              <p className="text-[0.7rem] font-bold text-brand-400">
                🖐️ Kéo quân của bé tới ô bé muốn · 💡 bấm Gợi ý để xem quân viền vàng đi sang ô viền xanh
              </p>
            )}

            {finished && (
              <p className="animate-pop-in rounded-2xl bg-leaf-50 px-3 py-2 text-center text-sm font-extrabold text-leaf-700">
                🎯 Bài đã hoàn thành! Bé chọn bài khác hoặc bấm Làm lại để chơi nữa nhé.
              </p>
            )}
          </>
        }
      />

      {/* Cột phải: chọn bài, hướng dẫn, băng giải thích, huy chương */}
      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel>
          <SectionTitle
            icon="👑"
            title="Tàn cuộc - Trạm năng lượng Hậu"
            subtitle={`Bé lái Tốt & Vua của mình · 🏅 ${doneCount}/${endgames?.length ?? 0} bài xong`}
          />
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {endgames?.map((item) => {
              const active = item.id === challenge?.id
              return (
                <button
                  key={item.id}
                  onClick={() => setChallengeId(item.id)}
                  className={`rounded-2xl border-[3px] p-2 text-left transition-all active:translate-y-[2px] ${
                    active
                      ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                      : 'border-brand-100 bg-white hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {item.goal === 'promote' ? '🛡️' : '🏁'}
                    </span>
                    <span className="text-sm font-extrabold text-brand-900">{item.title}</span>
                    {isCompleted(`endgame:${item.id}`) && (
                      <span className="ml-auto text-base">🏆</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[0.7rem] font-bold text-brand-500">
                    {item.goal === 'promote'
                      ? 'Mục tiêu: Tốt lên hàng 8 thành Hậu'
                      : 'Mục tiêu: Chiếu bí Vua Đen'}
                  </div>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel>
          <SectionTitle
            icon="🧭"
            title={challenge?.title ?? ''}
            subtitle={challenge?.hint}
          />
          <div className="mt-2 grid gap-2">
            <div className="whitespace-pre-line rounded-2xl bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 sm:text-sm">
              {challenge?.goal === 'promote'
                ? '1️⃣ Vua Trắng đi trước che chở cho Tốt.\n2️⃣ Đẩy Tốt thẳng tiến lên hàng 8.\n3️⃣ Tốt chạm đích là biến thành Hậu ngay!'
                : '1️⃣ Xe/Hậu canh chặt hàng ngang.\n2️⃣ Đưa quân còn lại chiếu Vua Đen.\n3️⃣ Vua Đen hết đường chạy là chiếu bí!'}
            </div>
            <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-3 py-2">
              <div className="text-xs font-extrabold uppercase text-gold-600">
                🎵 Khẩu quyết vè
              </div>
              <div className="text-base font-extrabold text-gold-900">
                “{challenge?.rhyme}”
              </div>
            </div>
            <p className="text-xs font-bold text-brand-500">
              🤖 Vua Đen đi ngẫu nhiên như một bạn nhỏ đang tập chơi - bé cứ bình tĩnh dồn Vua nhé.
            </p>
          </div>
        </Panel>

        {annotation && (
          <ExplanationBanner
            annotation={annotation}
            plyIndex={0}
            notation={notation}
            variant={finished ? 'played' : 'hint'}
          />
        )}

      </div>

      <CelebrationModal
        open={Boolean(result)}
        emoji={result?.emoji ?? '🎉'}
        title={result?.title ?? ''}
        message={result?.message ?? ''}
        stars={result?.stars ?? 0}
        onClose={() => setResult(null)}
        onRetry={() => {
          setResult(null)
          board.reset()
          setFinished(false)
          setHintVisible(false)
        }}
        retryLabel="Chơi lại"
      />
    </div>
  )
}
