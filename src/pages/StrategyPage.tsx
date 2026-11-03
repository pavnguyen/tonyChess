import { useMemo, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { EyeToggle } from '../components/EyeToggle'
import { InfoButton } from '../components/InfoPopover'
import { KidButton, Panel, SectionTitle } from '../components/ui'
import { GOLD_PRINCIPLES, PRINCIPLE_TONE_STYLES } from '../data/goldPrinciples'
import { useEyeCheck } from '../hooks/useEyeCheck'
import type { CSSProperties } from 'react'

type DemoSide = 'good' | 'bad'

const DEMO_OPTIONS: { value: DemoSide; label: string; icon: string }[] = [
  { value: 'good', label: 'Nên làm', icon: '✅' },
  { value: 'bad', label: 'Không nên', icon: '⚠️' },
]

/**
 * Tab Chiến lược - dạy bé **tư duy vị trí**, không phải học thuộc biến khai cuộc.
 *
 * Bố cục cột phải chỉ còn **hai khung**, xếp đúng thứ tự bé dùng:
 *   1. `10 nguyên tắc vàng` - lưới ô bấm được, cả 10 nguyên tắc nằm gọn một màn
 *      (bản cũ là danh sách xổ dọc, mỗi nguyên tắc một thẻ, mở ra bốn khối chữ).
 *   2. `Bài đang học` - một mạch đọc: khẩu quyết → câu bé tự hỏi → vì sao →
 *      thế cờ đang soi trên bàn (kèm chú giải ô màu) → mẹo.
 *
 * Nội dung KHÔNG bị cắt: chỉ bỏ phần lặp. Bản cũ vừa hiện lời giải thế cờ ngay dưới
 * bàn cờ, vừa lặp lại đúng câu đó trong thẻ nguyên tắc đang mở; giờ mỗi câu chỉ nằm
 * ở một chỗ, và lời giải thế "Nên/Không nên" chỉ hiện cho phía đang xem.
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

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {}
    for (const mark of board.marks) {
      const tone = PRINCIPLE_TONE_STYLES[mark.tone]
      styles[mark.square] = { backgroundColor: tone.fill, boxShadow: tone.ring }
    }
    return styles
  }, [board])

  /**
   * Chú giải ô màu, gom theo nhãn để hai ô cùng ý nghĩa không chiếm hai dòng.
   * Nằm NGAY TRONG khung lời giải (không phải khung riêng) vì nó trả lời đúng câu
   * "vì sao ô này được tô màu" của khung đó.
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
          /*
            Hàng trạng thái MỘT dòng, cao đúng một chip nhỏ: emoji trong ô bo nhẹ +
            tên nguyên tắc + (chỉ khi ẩn đáp án) chip “Ẩn đáp án”, rồi nút Mắt Thần
            bên phải. Bản cũ xếp emoji 24px chồng tiêu đề và một dòng phụ
            “✅ Thế cờ NÊN làm” ngay dưới, làm hàng này cao gấp đôi bàn cờ cần và
            chữ phụ đè lên tiêu đề. Thế cờ đang soi đã có nút Nên/Không nên tô màu
            ngay dưới bàn cờ và câu giải thích trong khung bài học, nên không lặp lại
            ở đây nữa.
          */
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-100 text-sm leading-none"
                aria-hidden
              >
                {activePrinciple.emoji}
              </span>
              <span className="truncate text-xs font-extrabold text-brand-900 sm:text-sm">
                {activePrinciple.order}. {activePrinciple.title}
              </span>
              {hidingAnswer && (
                <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[0.65rem] font-extrabold whitespace-nowrap text-gold-800">
                  🔎 Ẩn đáp án
                </span>
              )}
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
              <div className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Chọn câu trả lời">
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
                <KidButton
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setQuiz(false)
                    setAnswer(null)
                  }}
                >
                  Xem bài học
                </KidButton>
              </div>
            ) : (
              /*
                MỘT hàng ba nút CÙNG CỠ (40px, bo 16px, bóng đáy 3px): hai nút chọn
                thế cờ minh hoạ + nút mời làm thử thách. Trước đây dãy chọn nằm trong
                một thanh nền cát cao 34px còn nút thử thách cao 40px, lại khác bo
                góc, nên nhìn lệch hẳn và nút vàng trông như dán đè lên thanh kia.
                Nút đang chọn tự đổi màu: xanh ngọc = thế NÊN làm, đỏ son = KHÔNG NÊN.
              */
              <div
                role="group"
                aria-label="Chọn thế cờ minh hoạ"
                className="flex flex-wrap items-center justify-center gap-1.5"
              >
                {DEMO_OPTIONS.map((option) => {
                  const active = demoSide === option.value
                  return (
                    <KidButton
                      key={option.value}
                      size="sm"
                      variant={active ? (option.value === 'good' ? 'grass' : 'rose') : 'ghost'}
                      aria-pressed={active}
                      onClick={() => setDemoSide(option.value)}
                    >
                      {option.icon} {option.label}
                    </KidButton>
                  )
                })}
                <KidButton id="kid-principle-quiz" variant="sun" size="sm" onClick={startQuiz}>
                  🔎 Thử xem bé hiểu chưa
                </KidButton>
              </div>
            )}
          </div>
        }
      />

      <div className="lesson-reader flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        {/*
          Lưới 10 ô thay cho danh sách xổ dọc: bé/ba mẹ thấy CẢ 10 nguyên tắc trong
          một màn, bấm ô nào là bài đó hiện ra ở khung dưới - đúng kiểu "tra cứu".
        */}
        <Panel id="kid-gold-principles">
          <SectionTitle
            icon="🏅"
            title="7 nguyên tắc vàng"
            subtitle="Bấm một ô để học · cả 7 nằm gọn một màn"
            info="principles"
          />
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {GOLD_PRINCIPLES.map((principle) => {
              const open = activePrinciple.id === principle.id
              return (
                <button
                  key={principle.id}
                  type="button"
                  data-principle-id={principle.id}
                  onClick={() => togglePrinciple(principle.id)}
                  aria-expanded={open}
                  aria-label={`${principle.order}. ${principle.title}`}
                  className={`flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border-2 px-1.5 py-1 text-left transition-all active:translate-y-[1px] ${
                    open
                      ? 'border-brand-600 bg-brand-50 shadow-[0_2px_6px_rgba(31,65,50,0.28)]'
                      : 'border-sand-200 bg-white hover:border-brand-400'
                  }`}
                >
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full text-[0.55rem] font-extrabold text-white ${
                      open
                        ? 'bg-gradient-to-br from-brand-700 to-brand-500 animate-pulse-ring'
                        : 'bg-gradient-to-br from-brand-700 to-brand-500'
                    }`}
                  >
                    {principle.order}
                  </span>
                  <span className="text-xs leading-none" aria-hidden>
                    {principle.emoji}
                  </span>
                  <span
                    className={`line-clamp-2 min-w-0 flex-1 text-xs font-extrabold leading-tight ${
                      open ? 'text-brand-900' : 'text-brand-800'
                    }`}
                  >
                    {principle.title}
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        {/*
          Khung bài học duy nhất: một mạch đọc từ trên xuống, thay cho bố cục cũ hai
          khung (một khung câu hỏi + một khung danh sách) khiến bé phải nhảy mắt
          qua lại và đọc trùng nội dung.
        */}
        <Panel id="kid-principle-check" className="grid gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-300 text-sm font-extrabold text-gold-950">
              {activePrinciple.order}
            </span>
            <h3 className="min-w-0 flex-1 truncate text-base font-extrabold text-brand-900">
              {activePrinciple.emoji} {activePrinciple.title}
            </h3>
            {!hidingAnswer && <InfoButton topic={activePrinciple.info} />}
          </div>

          {/*
            Khẩu quyết đặt ngay dưới tên: câu dễ thuộc nhất phải thấy trước tiên.
            Ẩn khi bé đang làm thử thách để không lộ đáp án.
          */}
          {!hidingAnswer && (
            <p className="rounded-xl bg-gold-50 px-2.5 py-1 text-xs font-extrabold text-gold-800 ring-1 ring-gold-200">
              🎵 Khẩu quyết: “{activePrinciple.rhyme}”
            </p>
          )}

          <p className="text-sm font-bold leading-snug text-brand-800">
            <span aria-hidden>🤔 </span>
            {quiz ? 'Thế cờ này nên làm hay không nên?' : activePrinciple.ask}
          </p>

          {quiz && (
            <div
              id="kid-principle-feedback"
              role="status"
              className="rounded-xl bg-brand-50 px-2.5 py-1.5 text-sm font-bold text-brand-800"
            >
              {answer === null
                ? 'Bé nhìn quân Trắng trên bàn, nói một lý do rồi chọn Nên / Không nên nhé.'
                : answer === 'correct'
                  ? '✅ Đúng rồi! Bé chỉ lên bàn cờ và nói vì sao nhé.'
                  : '🌱 Chưa đúng cũng không sao! Cùng xem thế cờ đang soi bên dưới rồi thử lại nhé.'}
            </div>
          )}
          {quiz && answer !== null && (
            <KidButton
              id="kid-principle-quiz-again"
              size="sm"
              variant="sun"
              onClick={startQuiz}
            >
              Thử một lượt nữa
            </KidButton>
          )}

          {!hidingAnswer && (
            <>
              <p className="text-xs font-bold leading-snug text-brand-600">
                <b className="text-brand-800">Vì sao?</b> {activePrinciple.why}
              </p>

              <div
                id="kid-principle-note"
                className={`grid gap-1 rounded-2xl border-2 px-2.5 py-1.5 text-sm font-bold leading-snug ${
                  demoSide === 'good'
                    ? 'border-leaf-300 bg-leaf-50 text-leaf-800'
                    : 'border-coral-300 bg-coral-50 text-coral-800'
                }`}
              >
                <p>
                  <b className="font-extrabold">
                    {demoSide === 'good' ? '✅ Thế cờ NÊN làm: ' : '⚠️ Thế cờ KHÔNG NÊN: '}
                  </b>
                  {board.note}
                </p>
                {legend.length > 0 && (
                  <ul
                    id="kid-principle-legend"
                    className="flex flex-wrap gap-1"
                    aria-label="Vì sao các ô được tô màu"
                  >
                    {legend.map((entry) => (
                      <li
                        key={entry.label}
                        className="flex items-center gap-1 rounded-md bg-white/70 px-1.5 py-0.5 text-xs font-bold"
                      >
                        <span
                          className={`shrink-0 rounded px-1 font-mono text-xs font-extrabold text-white ${
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
              </div>

              {activePrinciple.tips && activePrinciple.tips.length > 0 && (
                <p className="rounded-xl bg-info-50 px-2.5 py-1 text-xs font-bold leading-snug text-info-800 ring-1 ring-info-200">
                  <span aria-hidden>{activePrinciple.emoji} </span>
                  {activePrinciple.tips.join(' · ')}
                </p>
              )}
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}
