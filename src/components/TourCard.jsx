import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { withS3 } from '../config'

function formatDates(slot) {
  if (!slot?.start || !slot?.end) return ''
  const s = new Date(slot.start)
  const e = new Date(slot.end)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const day = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit' })
  const monthYear = (d) => d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  return sameMonth
    ? `${day(s)} — ${day(e)} ${monthYear(e)}`
    : `${s.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })} — ${monthYear(e)}`
}

function shortText(tour) {
  const s = (tour.summary || tour.description || '').replace(/\s+/g, ' ').trim()
  if (s.length <= 240) return s
  return s.slice(0, 240).replace(/\s[^\s]*$/, '') + '…'
}

function formatPriceRUB(n) {
  if (!Number.isFinite(Number(n)) || Number(n) <= 0) return ''
  return `${Number(n).toLocaleString('ru-RU')} ₽`
}

export default function TourCard({ tour }) {
  // Универсальный резолвер: принимает как ключи S3, так и абсолютные URL
  const toUrl = (x) => {
    if (!x) return ''
    return /^https?:\/\//i.test(x) ? x : (typeof withS3 === 'function' ? withS3(x) : x)
  }

  // Берём первую доступную картинку: hero → gallery → map
  const imgKey =
    (tour.heroImages && tour.heroImages[0]) ||
    (tour.gallery && tour.gallery[0]) ||
    tour.mapImage ||
    ''

  const cover = imgKey ? toUrl(imgKey) : null

  const firstSlot = tour.dateSlots?.[0]
  const when = useMemo(() => formatDates(firstSlot), [firstSlot])
  const price = formatPriceRUB(tour.priceFromRUB)

  // Бейдж показываем только при малом остатке мест (1..5). 0 — ничего не показываем.
  const seats = Number(firstSlot?.seatsAvailable ?? 0)
  const seatsBadge =
    seats > 0 && seats <= 5
      ? `осталось ${seats} ${seats === 1 ? 'место' : seats < 5 ? 'места' : 'мест'}`
      : ''

  return (
    <Link to={`/tour/${tour.slug}`} className="tcard">
      <div className="media">
        {cover ? (
          <img src={cover} alt={tour.title} loading="lazy" />
        ) : (
          <div className="ph">Фото тура</div>
        )}
        {seatsBadge ? <div className="badge-seats">{seatsBadge}</div> : null}
        <div className="title">
          <div className="t1">{tour.title}</div>
          {tour.durationDays ? <div className="t2">{tour.durationDays} дней</div> : null}
        </div>
      </div>

      <div className="panel">
        {price ? <div className="badge-price">{price}</div> : null}

        {when && (
          <div className="date">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 7H5v9h14V9ZM8 7V5a1 1 0 1 0-2 0v2h2Zm10 0V5a1 1 0 1 0-2 0v2h2Z" fill="currentColor"/>
            </svg>
            <span>{when}</span>
          </div>
        )}

        {shortText(tour) && <p className="desc">{shortText(tour)}</p>}
      </div>

      <style jsx>{`
        :global(:root) {
          --primary: #5c6cff;
          --panel-bg: #f7f8ff;
          --ink: #0f1115;
          --muted: #6b7280;
          --shadow: 0 6px 18px rgba(0,0,0,.10);
        }

        .tcard {
          display: block;
          color: inherit;
          text-decoration: none;
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,.08);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .tcard:hover { transform: translateY(-4px); box-shadow: var(--shadow); }

        .media { position: relative; aspect-ratio: 16/10; background: #eaeefb; overflow: hidden; }
        .media img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ph { width: 100%; height: 100%; display:flex; align-items:center; justify-content:center; color:#97a1c0; }
        .media::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,.45) 90%);
          pointer-events: none;
        }

        .title { position: absolute; left: 16px; bottom: 14px; right: 16px; color: #fff; z-index: 2; }
        .t1 { font-weight: 800; font-size: 20px; line-height: 1.2; text-shadow: 0 2px 6px rgba(0,0,0,.35); text-transform: uppercase; letter-spacing: .3px; }
        .t2 { margin-top: 2px; font-weight: 600; opacity: .95; text-shadow: 0 1px 3px rgba(0,0,0,.35); }

        .badge-seats {
          position: absolute; top: 12px; right: 12px; z-index: 3;
          background: var(--primary); color: #fff; font-weight: 700; font-size: 12px;
          padding: 8px 10px; border-radius: 6px; text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(92,108,255,.35);
        }

        .panel {
          position: relative;
          background: var(--panel-bg);
          padding: 28px 18px 18px;
        }
        .badge-price {
          position: absolute;
          right: 18px;
          top: -16px;
          z-index: 4;
          background: #ffd84a;
          color: #111;
          font-weight: 800;
          padding: 10px 12px;
          border-radius: 6px;
          box-shadow: 0 6px 14px rgba(0,0,0,.18);
          display: inline-flex;
          white-space: nowrap;
        }

        .date { display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--ink); margin-bottom: 10px; }
        .date svg { color: var(--ink); flex: 0 0 auto; }
        .desc { margin: 0; color: var(--muted); line-height: 1.6; font-size: 15px; }

        @media (max-width: 640px) {
          .t1 { font-size: 18px; }
          .badge-price {
            top: -14px;
            right: 16px;
            left: auto;
            max-width: 75%;
            font-size: 14px;
            padding: 8px 10px;
          }
        }
      `}</style>
    </Link>
  )
}
