import { useMemo, useState } from 'react'
import { Panel, SectionTitle } from '../components/ui'
import { clearBlunders, groupBlunders, loadBlunders } from '../lib/coach'
import { AREA_LABEL, allRatings, attemptCount, ratingBand, resetRatings } from '../lib/rating'
import type { RatingArea } from '../lib/rating'

const AREA_ORDER: RatingArea[] = ['opening', 'tactics', 'endgame']

/**
 * Tab **Tiến bộ** - đúng hai thứ chủ dự án chọn: **sổ lỗi** (lỗi hay lặp lại, bấm
 * luyện lại) và **Elo ước lượng theo từng mảng**. Không biểu đồ chuyên cần, không
 * bộ sưu tập huy hiệu.
 */
export function ProgressPage() {
  // Đọc sổ lỗi + điểm ước lượng MỘT lần khi mở tab, rồi đọc lại khi bé bấm
  // “Cập nhật” / “Xoá”. Giữ trong state để không phải đọc localStorage mỗi lần render.
  const [data, setData] = useState(() => ({ blunders: loadBlunders(), ratings: allRatings() }))
  const blunders = data.blunders
  const groups = useMemo(() => groupBlunders(blunders), [blunders])
  const ratings = data.ratings

  const refresh = () => setData({ blunders: loadBlunders(), ratings: allRatings() })

  return (
    <div className="lesson-reader mx-auto flex w-full max-w-[900px] flex-col gap-2 overflow-y-auto">
      <Panel className="grid gap-2">
        <SectionTitle
          icon="📈"
          title="Tiến bộ của bé"
          subtitle="Sổ lỗi và mức ước lượng của ba mảng đang luyện"
        />

        <div className="grid gap-1.5">
          {AREA_ORDER.map((area) => {
            const value = ratings[area]
            const width = Math.max(8, Math.min(100, ((value - 1200) / 800) * 100))
            return (
              <div key={area} data-rating-area={area} className="grid gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-extrabold text-brand-800">{AREA_LABEL[area]}</span>
                  <span className="text-[0.7rem] font-bold text-brand-500">
                    <b className="text-brand-900">{value}</b> · {ratingBand(value)} ·{' '}
                    {attemptCount(area)} bài
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-sand-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-leaf-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[0.65rem] font-bold text-brand-400">
          Ước lượng chỉ để biết mảng nào cần luyện thêm - bé không thấy con số này khi chơi.
        </p>
      </Panel>

      <Panel id="kid-blunder-book" className="grid gap-1.5">
        <SectionTitle
          icon="📓"
          title="Sổ lỗi"
          subtitle={
            blunders.length === 0
              ? 'Chưa có lỗi nào - bé cứ vào Đấu Máy chơi một ván nhé'
              : `${blunders.length} lỗi đã ghi · ${groups.length} kiểu lỗi`
          }
        />

        {groups.length === 0 ? (
          <p className="rounded-xl bg-brand-50 px-2.5 py-2 text-xs font-bold text-brand-600">
            HLV sẽ ghi lại mỗi khi bé mất từ 1 điểm trở lên, rồi nhóm lại thành “kiểu lỗi” để
            lần sau luyện đúng chỗ yếu.
          </p>
        ) : (
          <div className="grid gap-1.5">
            {groups.slice(0, 3).map((group) => (
              <div
                key={group.key}
                data-blunder-group={group.key}
                className="grid gap-1 rounded-xl border-2 border-sand-200 bg-white px-2 py-1.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-extrabold text-brand-900">{group.label}</span>
                  <span className="shrink-0 text-[0.65rem] font-bold text-coral-600">
                    {group.count} lần · nặng nhất {(group.worst.lossCp / 100).toFixed(1)} điểm
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {[...new Set([group.worst, group.latest])].slice(0, 3).map((item) => (
                    <a
                      key={`${item.fen}-${item.san}`}
                      href={`/free-play?fen=${encodeURIComponent(item.fen)}`}
                      className="rounded-lg bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-extrabold text-brand-700 hover:bg-brand-100"
                    >
                      ▶ Luyện lại · {item.san} ({(item.lossCp / 100).toFixed(1)} điểm)
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={refresh}
            className="min-h-8 rounded-xl border border-sand-200 bg-white px-2.5 text-[0.7rem] font-extrabold text-brand-600"
          >
            ↻ Cập nhật
          </button>
          <button
            type="button"
            onClick={() => {
              clearBlunders()
              resetRatings()
              refresh()
            }}
            className="min-h-8 rounded-xl border border-coral-200 bg-white px-2.5 text-[0.7rem] font-extrabold text-coral-600"
          >
            🗑 Xoá sổ lỗi & điểm ước lượng
          </button>
        </div>
      </Panel>
    </div>
  )
}
