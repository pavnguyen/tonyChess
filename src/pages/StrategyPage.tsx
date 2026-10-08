import { useMemo, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { EyeToggle } from '../components/EyeToggle'
import { InfoButton } from '../components/InfoPopover'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { GOLD_PRINCIPLES, PRINCIPLE_TONE_STYLES } from '../data/goldPrinciples'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { useReportLesson } from '../store/lesson'
import type { CSSProperties } from 'react'

type DemoSide = 'good' | 'bad'

const DEMO_OPTIONS: { value: DemoSide; label: string; icon: string }[] = [
  { value: 'good', label: 'Nên làm', icon: '✅' },
  { value: 'bad', label: 'Không nên', icon: '⚠️' },
]

/**
 * Tab Chiến lược - dạy bé **tư duy vị trí** (không phải học thuộc biến khai cuộc).
 *
 * Mười nguyên tắc vàng là trái tim của tab. Mỗi nguyên tắc kèm **hai thế cờ minh
 * hoạ**: một thế "NÊN làm" (tô xanh) và một thế "KHÔNG NÊN" (tô đỏ). Bé bấm thẻ để
 * soi thế cờ lên bàn cờ lớn rồi gạt công tắc Nên / Không nên để **so sánh bằng mắt**
 * - học chay bằng chữ thì nhớ được rất ít.
 */
export function StrategyPage() {
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()

  const [openPrinciple, setOpenPrinciple] = useState<string | null>(null)
  const [demoSide, setDemoSide] = useState<DemoSide>('good')
  const [quiz, setQuiz] = useState(false)
  const [answer, setAnswer] = useState<'correct' | 'wrong' | null>(null)
  const hidingAnswer = quiz && answer === null

  const activePrinciple = useMemo(
    () => GOLD_PRINCIPLES.find((item) => item.id === openPrinciple) ?? GOLD_PRINCIPLES[0],
    [openPrinciple],
  )
  const board = activePrinciple[demoSide]

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang mở thẻ nguyên tắc nào.
  useReportLesson(!hidingAnswer && openPrinciple ? `principle:${openPrinciple}` : null)

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    for (const mark of board.marks) {
      const tone = PRINCIPLE_TONE_STYLES[mark.tone]
      styles[mark.square] = { backgroundColor: tone.fill, boxShadow: tone.ring }
    }
    return styles
  }, [board])

  /**
   * Bảng chú giải ô màu: mỗi dòng nói RÕ ô nào được tô và vì sao (nhãn viết tay
   * trong dữ liệu). Trước đây các nhãn này chỉ nằm trong dữ liệu mà không hiện ra,
   * nên bé thấy ô xanh/đỏ mà không biết chúng đang chỉ điều gì.
   *
   * Gom theo nhãn để hai ô cùng ý nghĩa không chiếm hai dòng.
   */
  const legend = useMemo(() => {
    const byLabel = new Map<string, string[]>()
    for (const mark of board.marks) {
      const squares = byLabel.get(mark.label) ?? []
      squares.push(mark.square)
      byLabel.set(mark.label, squares)
    }
    return [...byLabel.entries()].map(([label, squares]) => ({ label, squares }))
  }, [board])

  const togglePrinciple = (id: string) => {
    setQuiz(false)
    setAnswer(null)
    setDemoSide('good')
    setOpenPrinciple((current) => (current === id ? null : id))
  }

  const startQuiz = () => {
    setDemoSide(Math.random() < 0.5 ? 'good' : 'bad')
    setAnswer(null)
    setQuiz(true)
  }

  const submitAnswer = (choice: DemoSide) => {
    if (!hidingAnswer) return
    setAnswer(choice === demoSide ? 'correct' : 'wrong')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 stage:grid stage:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)] stage:grid-rows-[minmax(0,1fr)] stage:overflow-hidden">
      <BoardStage
        reserve={300}
        top={
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-2xl" aria-hidden>
                {activePrinciple.emoji}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-brand-900 sm:text-base">
                  {activePrinciple.order}. {activePrinciple.title}
                </div>
                <div className="hidden truncate text-[0.7rem] font-bold text-ink-500 sm:block">
                  {hidingAnswer ? '🔎 Bé đang xem quân Trắng' : demoSide === 'good' ? '✅ Thế cờ NÊN làm' : '⚠️ Thế cờ KHÔNG NÊN'}
                </div>
              </div>
            </div>
            {!hidingAnswer && <EyeToggle on={heatmap} onToggle={toggleHeatmap} />}
          </div>
        }
        board={
          <ChessBoardPanel
            fen={board.fen}
            orientation="white"
            playerSide="white"
            interactive={false}
            heatmap={!hidingAnswer && heatmap}
            extraSquareStyles={hidingAnswer ? {} : squareStyles}
          />
        }
        under={
          <div className="grid gap-2">
            {quiz ? (
              <div className="flex flex-wrap gap-2" aria-label="Chọn câu trả lời">
                <KidButton
                  id="kid-principle-answer-good"
                  size="sm"
                  variant="ghost"
                  disabled={answer !== null}
                  onClick={() => submitAnswer('good')}
                >
                  Nên làm
                </KidButton>
                <KidButton
                  id="kid-principle-answer-bad"
                  size="sm"
                  variant="ghost"
                  disabled={answer !== null}
                  onClick={() => submitAnswer('bad')}
                >
                  Không nên
                </KidButton>
                <KidButton size="sm" variant="ghost" onClick={() => {
                  setQuiz(false)
                  setAnswer(null)
                }}>
                  Xem bài học
                </KidButton>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Segmented options={DEMO_OPTIONS} value={demoSide} onChange={setDemoSide} size="sm" />
                <KidButton id="kid-principle-quiz" variant="sun" size="sm" onClick={startQuiz}>
                  🔎 Thử xem bé hiểu chưa
                </KidButton>
              </div>
            )}
          </div>
        }
      />

      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel id="kid-principle-check">
          <h3 className="text-lg font-extrabold text-brand-900">{quiz ? '🔎 Bé quan sát rồi chọn nhé' : '💡 Nhìn bàn cờ, hiểu nguyên tắc'}</h3>
          <p className="mt-1 text-base font-bold text-brand-700">{activePrinciple.ask}</p>
          {quiz && (
            <div id="kid-principle-feedback" role="status" className="mt-2 rounded-xl bg-brand-50 p-3 text-base font-bold text-brand-800">
              {answer === null ? 'Nhìn quân Trắng trên bàn: cách sắp xếp này NÊN làm hay KHÔNG NÊN? Bé nói một lý do rồi chọn nhé.'
                : answer === 'correct' ? '✅ Đúng rồi! Bé chỉ lên bàn cờ và nói vì sao nhé.'
                : '🌱 Chưa đúng cũng không sao! Cùng xem lời giải bên dưới rồi thử lại nhé.'}
            </div>
          )}
          {quiz && answer !== null && (
            <KidButton id="kid-principle-quiz-again" className="mt-2" size="sm" variant="sun" onClick={startQuiz}>Thử một lượt nữa</KidButton>
          )}
          {!hidingAnswer && <div className="mt-2 grid gap-2">
            {/*
              Khung lời giải đổi hẳn MÀU theo thế đang xem (xanh = nên, đỏ =
              không nên) và nói rõ nó đang khoe thế nào. Nhờ vậy chỉ cần liếc một
              cái là bé biết mình đang nhìn thế "làm đúng" hay "làm sai".
            */}
            <div
              id="kid-principle-note"
              className={`rounded-2xl border-2 px-3 py-2 text-base font-bold leading-relaxed ${
                demoSide === 'good'
                  ? 'border-leaf-300 bg-leaf-50 text-leaf-800'
                  : 'border-coral-300 bg-coral-50 text-coral-800'
              }`}
            >
              <b className="font-extrabold">
                {demoSide === 'good' ? '✅ Thế cờ NÊN làm: ' : '⚠️ Thế cờ KHÔNG NÊN: '}
              </b>
              {board.note}
            </div>
            {/*
              Bảng chú giải ô màu: đọc thẳng từ nhãn viết tay trong dữ liệu, nên
              bé biết chính xác ô nào đang chỉ điều gì thay vì đoán theo màu.
            */}
            {legend.length > 0 && (
              <ul
                id="kid-principle-legend"
                className="grid gap-1"
                aria-label="Vì sao các ô được tô màu"
              >
                {legend.map((entry) => (
                  <li
                    key={entry.label}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[0.7rem] font-bold ${
                      demoSide === 'good'
                        ? 'bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200'
                        : 'bg-coral-50 text-coral-800 ring-1 ring-coral-200'
                    }`}
                  >
                    {/* Tên ô viết THƯỜNG (d4) cho khớp cách viết trên bàn cờ và
                        trong biên bản cờ - bé không phải học hai kiểu viết. */}
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[0.65rem] font-extrabold text-white ${
                        demoSide === 'good' ? 'bg-leaf-600' : 'bg-coral-600'
                      }`}
                    >
                      {entry.squares.join(' ')}
                    </span>
                    <span className="min-w-0">{entry.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>}
        </Panel>
        <Panel id="kid-gold-principles">
          <SectionTitle
            icon="🏅"
            title="10 nguyên tắc vàng"
            subtitle="Mười thói quen giúp bé chơi cờ giỏi hơn mỗi ngày"
            info="principles"
          />
          <p className="mt-1 text-[0.7rem] font-bold text-brand-600">
            👆 Bấm một nguyên tắc để soi hai thế cờ NÊN / KHÔNG NÊN lên bàn cờ lớn.
          </p>
          <div className="mt-2 grid gap-1.5">
            {GOLD_PRINCIPLES.map((principle) => {
              const open = openPrinciple === principle.id
              return (
                <div
                  key={principle.id}
                  className={`rounded-2xl border-2 px-2.5 py-2 transition-all ${
                    open ? 'border-gold-300 bg-gold-50' : 'border-brand-100 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-principle-id={principle.id}
                      onClick={() => togglePrinciple(principle.id)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-extrabold ${
                          open ? 'bg-gold-400 text-gold-950' : 'bg-brand-100 text-brand-700'
                        }`}
                      >
                        {principle.order}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-extrabold text-brand-900">
                        {principle.emoji} {principle.title}
                      </span>
                      <span aria-hidden className="shrink-0 text-brand-600">
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {!hidingAnswer && <InfoButton topic={principle.info} />}
                  </div>

                  {open && !hidingAnswer && (
                    <div className="animate-pop-in mt-1.5 grid gap-1.5">
                      <p className="rounded-xl bg-white px-2.5 py-1.5 text-[0.7rem] font-extrabold text-info-700 ring-1 ring-info-200">
                        ❓ {principle.ask}
                      </p>
                      <p className="text-[0.7rem] font-bold leading-snug text-brand-600">
                        {principle.why}
                      </p>
                      <p className="rounded-xl bg-leaf-50 px-2.5 py-1.5 text-[0.7rem] font-bold leading-snug text-leaf-800 ring-1 ring-leaf-200">
                        ✅ Nên: {principle.good.note}
                      </p>
                      <p className="rounded-xl bg-coral-50 px-2.5 py-1.5 text-[0.7rem] font-bold leading-snug text-coral-800 ring-1 ring-coral-200">
                        ⚠️ Không nên: {principle.bad.note}
                      </p>
                      <p className="text-[0.7rem] font-extrabold text-gold-700">
                        🎵 Khẩu quyết: “{principle.rhyme}”
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
      </div>
    </div>
  )
}
