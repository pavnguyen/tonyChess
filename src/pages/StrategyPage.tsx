import { useMemo, useState } from 'react'
import { BoardStage } from '../components/BoardStage'
import { ChessBoardPanel } from '../components/ChessBoardPanel'
import { EyeToggle } from '../components/EyeToggle'
import { InfoButton } from '../components/InfoPopover'
import { KidButton, Panel, SectionTitle, Segmented } from '../components/ui'
import { GOLD_PRINCIPLES, PRINCIPLE_TONE_STYLES } from '../data/goldPrinciples'
import { useEyeCheck } from '../hooks/useEyeCheck'
import { useReportLesson } from '../store/lesson'
import { useKidProgress } from '../store/progress'
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
  const { completeActivity, isCompleted } = useKidProgress()
  const { on: heatmap, toggle: toggleHeatmap } = useEyeCheck()

  const [openPrinciple, setOpenPrinciple] = useState<string | null>(null)
  const [demoSide, setDemoSide] = useState<DemoSide>('good')

  const activePrinciple = useMemo(
    () => GOLD_PRINCIPLES.find((item) => item.id === openPrinciple) ?? GOLD_PRINCIPLES[0],
    [openPrinciple],
  )
  const board = activePrinciple[demoSide]

  // Báo cho khung “Gợi ý cho ba mẹ” (§10) biết bé đang mở thẻ nguyên tắc nào.
  useReportLesson(openPrinciple ? `principle:${openPrinciple}` : null)

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
    setDemoSide('good')
    setOpenPrinciple((current) => (current === id ? null : id))
  }

  const mastered = isCompleted(`strategy:principle:${activePrinciple.id}`)

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
                  {demoSide === 'good' ? '✅ Thế cờ NÊN làm' : '⚠️ Thế cờ KHÔNG NÊN'}
                </div>
              </div>
            </div>
            <EyeToggle on={heatmap} onToggle={toggleHeatmap} />
          </div>
        }
        board={
          <ChessBoardPanel
            fen={board.fen}
            orientation="white"
            playerSide="white"
            interactive={false}
            heatmap={heatmap}
            extraSquareStyles={squareStyles}
          />
        }
        under={
          <div className="grid gap-2">
            <Segmented
              options={DEMO_OPTIONS}
              value={demoSide}
              onChange={(value) => setDemoSide(value)}
              size="sm"
            />
            {/*
              Khung lời giải đổi hẳn MÀU theo thế đang xem (xanh = nên, đỏ =
              không nên) và nói rõ nó đang khoe thế nào. Nhờ vậy chỉ cần liếc một
              cái là bé biết mình đang nhìn thế "làm đúng" hay "làm sai".
            */}
            <div
              id="kid-principle-note"
              className={`rounded-2xl border-2 px-3 py-2 text-[0.78rem] font-bold leading-snug ${
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
            <div className="flex flex-wrap items-center gap-1.5">
              <KidButton
                variant="grass"
                size="sm"
                onClick={() => completeActivity(`strategy:principle:${activePrinciple.id}`, 2)}
              >
                ✅ Bé đã hiểu nguyên tắc này
              </KidButton>
              <span className="text-[0.7rem] font-bold text-ink-500">
                {mastered ? 'đã ghi nhận ✓' : '🟩 ô xanh là NÊN · 🟥 ô đỏ là KHÔNG NÊN'}
              </span>
            </div>
          </div>
        }
      />

      <div className="flex min-h-0 flex-col gap-2 stage:overflow-y-auto stage:pr-1">
        <Panel id="kid-gold-principles">
          <SectionTitle
            icon="🏅"
            title="10 nguyên tắc vàng"
            subtitle="Mười thói quen giúp bé chơi cờ giỏi hơn mỗi ngày"
            info="principles"
          />
          <p className="mt-1 text-[0.7rem] font-bold text-brand-400">
            👆 Bấm một nguyên tắc để soi hai thế cờ NÊN / KHÔNG NÊN lên bàn cờ lớn.
          </p>
          <div className="mt-2 grid gap-1.5">
            {GOLD_PRINCIPLES.map((principle) => {
              const open = openPrinciple === principle.id
              const viewed = isCompleted(`strategy:principle:${principle.id}`)
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
                      <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-brand-900">
                        {principle.emoji} {principle.title}
                      </span>
                      {viewed && <span aria-hidden>🏆</span>}
                      <span aria-hidden className="shrink-0 text-brand-400">
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    <InfoButton topic={principle.info} />
                  </div>

                  {open && (
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
