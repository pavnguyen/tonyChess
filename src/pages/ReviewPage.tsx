import { Link } from '@tanstack/react-router'
import { useEndgamesQuery, useOpeningsQuery, useTacticsQuery } from '../data/queries'
import { GM_LECTURES } from '../data/gmLectures'
import { PAWN_STRUCTURES } from '../data/pawnStructures'
import { TACTIC_META } from '../data/tactics'
import { kindOfKey } from '../lib/review'
import { useKidProgress } from '../store/progress'
import { useReview } from '../store/review'
import { Panel, SectionTitle } from '../components/ui'
import type { ReviewItem } from '../lib/review'

type ReviewTo = '/' | '/tactics' | '/endgames' | '/strategy'

interface CardInfo {
  emoji: string
  label: string
  to: ReviewTo
}

/**
 * Ôn tập ngắt quãng: mỗi quân bài tới hạn được nhắc lại đúng lúc bé sắp quên.
 * Trang này KHÔNG có bàn cờ - nó chỉ dẫn bé về đúng bài cần làm lại.
 */
export function ReviewPage() {
  const { stage } = useKidProgress()
  const { due, summary } = useReview()
  const { data: tactics } = useTacticsQuery()
  const { data: endgames } = useEndgamesQuery()
  const { data: openings } = useOpeningsQuery()

  const infoFor = (key: string): CardInfo => {
    const kind = kindOfKey(key)
    const rest = key.slice(key.indexOf(':') + 1)

    if (kind === 'tactic') {
      const puzzle = tactics?.find((item) => item.id === rest)
      return {
        emoji: puzzle ? TACTIC_META[puzzle.type].emoji : '⚔️',
        label: puzzle?.title ?? rest,
        to: '/tactics',
      }
    }
    if (kind === 'endgame') {
      const challenge = endgames?.find((item) => item.id === rest)
      return { emoji: '👑', label: challenge?.title ?? rest, to: '/endgames' }
    }
    if (kind === 'opening') {
      const id = rest.replace(/:memorize$/, '')
      const opening = openings?.find((item) => item.id === id)
      return { emoji: opening?.emoji ?? '🛡️', label: opening?.name ?? id, to: '/' }
    }
    if (kind === 'lecture') {
      const lecture = GM_LECTURES.find((item) => item.id === rest)
      return { emoji: lecture?.emoji ?? '🎓', label: lecture?.title ?? rest, to: '/strategy' }
    }
    const structure = PAWN_STRUCTURES.find((item) => item.id === rest)
    return { emoji: structure?.emoji ?? '🧬', label: structure?.name ?? rest, to: '/strategy' }
  }

  const session = due.slice(0, Math.max(1, stage.sessionSize))

  return (
    <div
      id="kid-review-page"
      className="mx-auto flex w-full max-w-[48rem] flex-col gap-2"
    >
      <Panel className="grid gap-2">
        <SectionTitle
          icon="🔁"
          title="Ôn tập ngắt quãng"
          subtitle="Gặp lại đúng câu bé sắp quên - nhớ lâu hơn hẳn!"
        />
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-brand-50 px-2.5 py-2 text-center">
            <div className="text-xl font-extrabold text-brand-800">{summary.due}</div>
            <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-brand-500">
              cần ôn hôm nay
            </div>
          </div>
          <div className="rounded-2xl bg-leaf-50 px-2.5 py-2 text-center">
            <div className="text-xl font-extrabold text-leaf-700">{summary.total}</div>
            <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-leaf-600">
              câu trong sổ
            </div>
          </div>
          <div className="rounded-2xl bg-gold-50 px-2.5 py-2 text-center">
            <div className="text-xl font-extrabold text-gold-700">{summary.masteredPercent}%</div>
            <div className="text-[0.65rem] font-extrabold uppercase tracking-wide text-gold-600">
              đã nhớ dai
            </div>
          </div>
        </div>
      </Panel>

      {session.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-sm font-extrabold text-leaf-700">
            🎉 Hôm nay không còn câu nào tới hạn ôn. Bé cứ học bài mới, mai mình ôn tiếp nhé!
          </p>
        </Panel>
      ) : (
        <Panel className="grid gap-1.5">
          <div className="text-sm font-extrabold text-brand-900">
            🎯 Buổi ôn hôm nay · {session.length} câu
          </div>
          {session.map((item: ReviewItem) => {
            const info = infoFor(item.key)
            return (
              <Link
                key={item.key}
                to={info.to}
                className="flex items-center gap-2.5 rounded-2xl border-2 border-sand-200 bg-white px-2.5 py-2 transition-all hover:border-brand-300 active:translate-y-[1px]"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl" aria-hidden>
                  {info.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-brand-900">
                    {info.label}
                  </span>
                  <span className="block text-[0.7rem] font-bold text-ink-500">
                    {item.lapses > 0 ? `đã từng sai ${item.lapses} lần · ` : ''}
                    làm lại ngay
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-gold-100 px-2 py-0.5 text-[0.7rem] font-extrabold text-gold-800">
                  Làm lại ➡️
                </span>
              </Link>
            )
          })}
        </Panel>
      )}

      {summary.weakest.length > 0 && (
        <Panel>
          <div className="text-sm font-extrabold text-coral-700">💪 Câu bé hay sai nhất</div>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {summary.weakest.map((item) => {
              const info = infoFor(item.key)
              return (
                <li key={item.key}>
                  <Link
                    to={info.to}
                    className="inline-flex items-center gap-1 rounded-xl border-2 border-coral-200 bg-coral-50 px-2 py-1 text-[0.7rem] font-extrabold text-coral-700"
                  >
                    <span aria-hidden>{info.emoji}</span>
                    <span className="max-w-[12rem] truncate">{info.label}</span>
                    <span className="rounded-full bg-white px-1.5 text-[0.6rem]">×{item.lapses}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <p className="px-1 text-center text-[0.7rem] font-bold text-brand-400">
        🔁 Câu đúng sẽ quay lại sau 1 → 3 → 7 → 21 ngày · câu sai gặp lại sau 10 phút.
      </p>
    </div>
  )
}
