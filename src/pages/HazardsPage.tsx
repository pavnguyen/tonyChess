import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import { useCallback, useMemo, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { KidButton, Panel, SectionTitle } from '../components/ui'
import { FIGURINE, PIECE_NAME_VI } from '../lib/notation'
import { HEATMAP_COLORS, WARNING_BADGE, findHangingPieces } from '../lib/threats'
import { playError, playWin } from '../lib/sound'
import { useKidProgress } from '../store/progress'
import type { CSSProperties } from 'react'
import type { PieceCode } from '../types'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
/** Quân của bé đặt ngẫu nhiên (không có Vua - Vua lo riêng). */
const KID_TYPES: PieceCode[] = ['n', 'b', 'r', 'q', 'p']
/** Quân đối phương rình ăn. */
const FOE_TYPES: PieceCode[] = ['q', 'r', 'b', 'n']

/**
 * Hai mức của bài luyện.
 *
 * - **Dễ**: 3 quân của bé, 2 quân địch. Chỉ ra quân **bị ăn mà không ai đỡ** -
 *   đúng một loại "treo" nên bé mới học luật cũng làm được.
 * - **Khó**: 6 quân của bé, 4 quân địch (có cả Tốt địch). Thế nào cũng có ít
 *   nhất một quân **bị quân rẻ hơn tấn công** (Tốt chĩa Mã, Mã chĩa Xe...),
 *   tức loại treo khó thấy nhất - kể cả khi quân đó đang được đỡ.
 */
const LEVELS = {
  easy: {
    label: 'Dễ',
    icon: '🟢',
    kid: 3,
    foe: 2,
    foeTypes: FOE_TYPES,
    maxHanging: 2,
    /** Dễ: chỉ có quân không ai đỡ, không lẫn kiểu "rẻ hơn ăn đắt hơn". */
    forbidCheaper: true,
    description: 'Quân bị ăn mà không ai đỡ.',
  },
  hard: {
    label: 'Khó',
    icon: '🔴',
    kid: 6,
    foe: 4,
    // Có Tốt địch: Tốt (100) chĩa Mã/Tượng/Xe là đúng kiểu "quân rẻ hơn".
    foeTypes: [...FOE_TYPES, 'p'] as PieceCode[],
    maxHanging: 4,
    forbidCheaper: false,
    /** Khó: bắt buộc có ít nhất một quân bị quân RẺ HƠN tấn công. */
    requireCheaper: true,
    description: 'Bị ăn mà không ai đỡ, HOẶC bị quân rẻ hơn tấn công.',
  },
} as const

type HazardLevel = keyof typeof LEVELS

const pickIndex = (length: number) => Math.floor(Math.random() * length)

function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = pickIndex(i + 1)
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function randomSquare(minRank: number, maxRank: number, used: Set<string>): Square | null {
  for (let tries = 0; tries < 40; tries += 1) {
    const square = `${FILES[pickIndex(8)]}${minRank + pickIndex(maxRank - minRank + 1)}`
    if (!used.has(square)) {
      used.add(square)
      return square as Square
    }
  }
  return null
}

export interface HazardRound {
  fen: string
  /** Các quân của bé trên bàn - bé bấm vào quân mình nghĩ đang bị treo. */
  choices: { square: string; piece: PieceCode }[]
  /** Đáp án: những ô đang treo (do `findHangingPieces` chấm). */
  hanging: string[]
}

/**
 * Sinh một thế cờ ngẫu nhiên có **1-2 quân treo** (mức Dễ) hoặc **1-4 quân treo**
 * (mức Khó).
 *
 * Cách làm: đặt Vua hai bên, rải ngẫu nhiên quân của bé (hàng 2-5) và quân đối
 * phương (hàng 3-8) theo đúng số lượng của mức đang chọn, rồi hỏi chính
 * `findHangingPieces` xem quân nào bị ăn mà không ai đỡ / bị quân rẻ hơn tấn công.
 * Thế nào không thoả (bị chiếu, không có quân treo, quá nhiều quân treo, hoặc
 * không đúng kiểu "quân rẻ hơn" mà mức đó yêu cầu) thì bỏ và rút lại - nhờ vậy
 * mọi thế đưa cho bé đều là thế có đáp án thật.
 */
function buildRound(level: HazardLevel = 'easy'): HazardRound {
  const spec = LEVELS[level]

  for (let attempt = 0; attempt < 600; attempt += 1) {
    const chess = new Chess()
    chess.clear()
    const used = new Set<string>(['e1', 'e8'])
    chess.put({ type: 'k', color: 'w' }, 'e1')
    chess.put({ type: 'k', color: 'b' }, 'e8')

    const choices: { square: string; piece: PieceCode }[] = []
    for (const type of shuffled(KID_TYPES).slice(0, spec.kid)) {
      const square = randomSquare(2, 5, used)
      if (!square) break
      chess.put({ type, color: 'w' }, square)
      choices.push({ square, piece: type })
    }
    for (const type of shuffled(spec.foeTypes).slice(0, spec.foe)) {
      const square = randomSquare(3, 8, used)
      if (!square) break
      chess.put({ type, color: 'b' }, square)
    }

    // Lượt của bé + ép bỏ quyền nhập thành/phong cấp để FEN gọn và hợp lệ.
    const placement = chess.fen().split(' ')[0]
    const fen = `${placement} w - - 0 1`
    let probe: Chess
    try {
      probe = new Chess(fen)
    } catch {
      continue
    }
    if (choices.length < spec.kid) continue
    if (probe.isCheck()) continue
    const hanging = findHangingPieces(probe, 'white')
    if (hanging.length === 0 || hanging.length > spec.maxHanging) continue

    // `defenders > 0` nghĩa là quân ấy vẫn bị treo dù có quân đỡ → đúng kiểu
    // "bị quân rẻ hơn tấn công". Mức Khó phải có ít nhất một quân như vậy,
    // mức Dễ thì không lẫn kiểu đó vào.
    const hasCheaperCase = hanging.some((item) => item.defenders > 0)
    if (level === 'hard' && !hasCheaperCase) continue
    if (level === 'easy' && hasCheaperCase) continue

    return { fen, choices, hanging: hanging.map((item) => item.square) }
  }

  // Thế dự phòng (đã kiểm bằng đúng công thức `findHangingPieces`):
  // - Dễ: Mã d5 bị Xe d7 chĩa xuống mà **không ai đỡ** → treo thật.
  // - Khó: Mã f3 bị Tốt g4 (rẻ hơn) ăn trong khi Tốt e2 đang đỡ → vẫn treo.
  if (level === 'hard') {
    return {
      fen: '1r2k3/8/8/3n4/2B3p1/5N2/3PP3/3RK3 w - - 0 1',
      choices: [
        { square: 'c4', piece: 'b' },
        { square: 'd2', piece: 'p' },
        { square: 'd1', piece: 'r' },
        { square: 'e2', piece: 'p' },
        { square: 'f3', piece: 'n' },
      ],
      hanging: ['f3'],
    }
  }
  return {
    fen: '4k3/3r4/8/3N4/3P4/8/8/4K3 w - - 0 1',
    choices: [
      { square: 'd4', piece: 'p' },
      { square: 'd5', piece: 'n' },
    ],
    hanging: ['d5'],
  }
}

/**
 * Tab **Soi quân treo** - bài luyện thói quen quan trọng nhất để lên 1500:
 * *trước khi đi, nhìn xem quân mình có bị treo không*.
 *
 * Bé không học lý thuyết: mỗi lượt app sinh một thế cờ ngẫu nhiên, bé bấm vào
 * quân mình nghĩ đang bị ăn miễn phí. Đáp án do chính `findHangingPieces` của
 * "Mắt Thần Cờ Vua" chấm (`src/lib/threats.ts`) - cùng một bộ luật với tab Đấu Máy,
 * nên hai nơi không thể nói khác nhau.
 *
 * Hai mức: **Dễ** (chỉ quân không ai đỡ) và **Khó** (thêm quân bị quân rẻ hơn tấn
 * công, nhiều quân hơn). Điểm nhân theo chuỗi đúng liên tiếp để bé soi kỹ thay vì
 * bấm liều.
 */
export function HazardsPage() {
  const { soundOn } = useKidProgress()
  const [level, setLevel] = useState<HazardLevel>('easy')
  const [round, setRound] = useState<HazardRound>(() => buildRound('easy'))
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [tries, setTries] = useState(0)

  const answered = picked !== null || revealed
  const correct = picked !== null && round.hanging.includes(picked)

  const pick = useCallback(
    (square: string) => {
      if (answered) return
      setPicked(square)
      setRevealed(true)
      if (round.hanging.includes(square)) {
        // Điểm theo CHUỖI: câu đúng thứ 1 được 10, thứ 2 được 20, thứ 3 được 30...
        // Sai là chuỗi về 0, nên bé có động lực soi kỹ thay vì bấm liều.
        const nextStreak = streak + 1
        setStreak(nextStreak)
        setScore((value) => value + 10 * nextStreak)
        if (soundOn) playWin()
      } else {
        setStreak(0)
        setTries((value) => value + 1)
        if (soundOn) playError()
      }
    },
    [answered, round.hanging, soundOn, streak],
  )

  const nextRound = () => {
    setRound(buildRound(level))
    setPicked(null)
    setRevealed(false)
  }

  /** Đổi mức: thế mới theo mức mới, chuỗi và số lần sai tính lại từ đầu. */
  const changeLevel = (next: HazardLevel) => {
    if (next === level) return
    setLevel(next)
    setRound(buildRound(next))
    setPicked(null)
    setRevealed(false)
    setStreak(0)
    setTries(0)
  }

  /** Sau khi trả lời, tô đỏ đúng những quân đang treo (như Mắt Thần). */
  const revealStyles = useMemo<Record<string, CSSProperties> | undefined>(() => {
    if (!revealed) return undefined
    const styles: Record<string, CSSProperties> = {}
    for (const square of round.hanging) {
      styles[square] = {
        backgroundColor: HEATMAP_COLORS.hanging,
        boxShadow: 'inset 0 0 0 4px #a04a3b',
        backgroundImage: WARNING_BADGE,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top right',
        backgroundSize: '44%',
      }
    }
    if (picked && !round.hanging.includes(picked)) {
      styles[picked] = { ...(styles[picked] ?? {}), boxShadow: 'inset 0 0 0 4px #5f9faf' }
    }
    return styles
  }, [revealed, round.hanging, picked])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <BoardStage
        reserve={260}
        top={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700">
              🔍 Soi quân trước khi đi
            </span>
            <span
              id="kid-hazard-score"
              className="rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-700"
            >
              💎 Điểm: {score}
            </span>
            <span
              id="kid-hazard-streak"
              className="rounded-full bg-gold-100 px-3 py-1 text-xs font-extrabold text-gold-800"
            >
              ⭐ Chuỗi: {streak}
              {streak > 0 ? ` · câu này +${10 * (streak + 1)}` : ''}
            </span>
          </div>
        }
        board={
          <ChessBoardPanel
            fen={round.fen}
            orientation="white"
            playerSide="white"
            interactive={false}
            extraSquareStyles={revealStyles}
          />
        }
        under={
          answered ? (
            <p
              id="kid-hazard-result"
              className={`rounded-2xl px-3 py-2 text-center text-sm font-extrabold ${
                correct
                  ? 'bg-leaf-50 text-leaf-800 ring-2 ring-leaf-300'
                  : 'bg-coral-50 text-coral-800 ring-2 ring-coral-300'
              }`}
            >
              {correct
                ? '✅ Đúng rồi! Bé nhìn thấy quân mình bị treo trước khi đối thủ ăn.'
                : `⚠️ Chưa đúng — quân đang treo là ${round.hanging
                    .map((square) => square)
                    .join(', ')}. Ô đỏ trên bàn cờ là chỗ bị ăn miễn phí.`}
            </p>
          ) : (
            <p className="rounded-2xl bg-brand-50 px-3 py-2 text-center text-sm font-bold text-brand-700">
              👆 Bấm vào quân Trắng mà bé nghĩ đang bị ăn miễn phí.
            </p>
          )
        }
      />

      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel className="grid gap-2">
          <SectionTitle
            icon="🔍"
            title="Soi quân treo"
            subtitle="Thói quen số 1 để lên 1500: nhìn quân mình trước khi đi"
          />
          <p className="rounded-2xl bg-brand-50 px-2.5 py-2 text-sm font-bold leading-snug text-brand-700">
            Quân <b>treo</b> = bị quân địch ăn mà không ai đỡ, hoặc bị quân rẻ hơn tấn
            công. Bé tìm ra trước khi đối thủ kịp ăn nhé!
          </p>

          {/*
            Chọn mức luyện: hai nút cùng cỡ 40px, cùng bo 16px và cùng bóng đáy như nút
            ở các tab khác (trước đây là hai chip 36px nằm trong một khung trắng viền
            kép, nhìn nặng và lạc tông so với phần còn lại).
          */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-brand-500">
              Mức luyện
            </span>
            <div id="kid-hazard-levels" className="flex min-w-0 gap-1.5">
              {(Object.keys(LEVELS) as HazardLevel[]).map((key) => {
                const spec = LEVELS[key]
                const active = key === level
                return (
                  <button
                    key={key}
                    type="button"
                    data-hazard-level={key}
                    aria-pressed={active}
                    onClick={() => changeLevel(key)}
                    className={`min-h-10 rounded-2xl border-2 px-3 text-sm font-extrabold transition-all active:translate-y-[2px] ${
                      active
                        ? 'border-brand-600 bg-brand-700 text-white shadow-[0_3px_0_#1b2639]'
                        : 'border-sand-300 bg-white text-brand-700 shadow-[0_3px_0_#e3cda3] hover:border-brand-300'
                    }`}
                  >
                    {spec.icon} {spec.label}
                  </button>
                )
              })}
            </div>
          </div>
          <p
            id="kid-hazard-level-hint"
            className="text-xs font-bold leading-snug text-brand-500"
          >
            {LEVELS[level].description}{' '}
            {level === 'hard'
              ? 'Thế khó có thể có 2–4 quân treo: chỉ cần tìm ra một quân là được.'
              : 'Ba quân của bé, hai quân địch.'}
          </p>

          <div id="kid-hazard-choices" className="grid grid-cols-2 gap-1.5">
            {round.choices.map((choice) => {
              const isHanging = round.hanging.includes(choice.square)
              const state = !answered
                ? 'border-sand-200 bg-white hover:border-brand-400'
                : isHanging
                  ? 'border-coral-400 bg-coral-50'
                  : 'border-sand-200 bg-white'
              return (
                <button
                  key={choice.square}
                  type="button"
                  data-hazard-square={choice.square}
                  disabled={answered}
                  onClick={() => pick(choice.square)}
                  className={`flex min-h-10 min-w-0 items-center gap-1.5 rounded-2xl border-2 px-2 py-1 text-left text-sm font-extrabold text-brand-900 transition-all active:translate-y-[1px] disabled:cursor-default ${state}`}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {FIGURINE[choice.piece]}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {PIECE_NAME_VI[choice.piece]} {choice.square}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <KidButton
              id="kid-hazard-next"
              variant="primary"
              size="sm"
              onClick={nextRound}
            >
              🎲 Thế cờ mới
            </KidButton>
            <KidButton
              id="kid-hazard-reveal"
              variant="ghost"
              size="sm"
              disabled={answered}
              onClick={() => setRevealed(true)}
            >
              👁️ Xem đáp án
            </KidButton>
          </div>

          <p className="text-xs font-bold leading-snug text-ink-600">
            Đúng liên tiếp thì điểm nhân lên (10 → 20 → 30...), sai là chuỗi về 0.
            {tries > 0 ? ` Số lần chưa đúng: ${tries}.` : ''} Cứ chậm mà chắc: đếm quân
            bị tấn công trước rồi mới bấm.
          </p>
        </Panel>
      </div>
    </div>
  )
}
