import { RANKS } from '../data/ranks'
import { useKidProgress } from '../store/progress'

/** Thanh Ngôi Sao & Huy Chương: theo dõi ⭐ và danh hiệu của bé. */
export function StarHud({ compact = false }: { compact?: boolean }) {
  const { stars, rank, nextRank, progressToNext } = useKidProgress()

  return (
    <div className="card-pop flex items-center gap-3 p-2.5 sm:p-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-2xl shadow-inner sm:size-12">
        {rank.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="text-sm font-extrabold text-violet-900 sm:text-base">
            {rank.title}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-800">
            ⭐ {stars}
          </span>
        </div>
        {!compact && (
          <>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.round(progressToNext * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[0.7rem] font-bold text-violet-500">
              {nextRank
                ? `Còn ${nextRank.minStars - stars} ⭐ nữa để thành ${nextRank.emoji} ${nextRank.title}`
                : 'Bé đã đạt danh hiệu cao nhất! 🌟'}
            </p>
          </>
        )}
      </div>
      {compact && (
        <div className="hidden shrink-0 text-right text-[0.65rem] font-bold text-violet-400 sm:block">
          {RANKS.length} cấp
        </div>
      )}
    </div>
  )
}
