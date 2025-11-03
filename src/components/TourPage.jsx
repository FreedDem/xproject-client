import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { s3url as withS3 } from '../config'
import './tourPage.css'
import TourGallery from './TourGallery'
import BookingDialog from '../components/BookingDialog' // модалка бронирования

/* ===== утилиты ===== */
const translitMap = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' }
const slugify = (s='') => String(s).toLowerCase()
  .replace(/[а-яё]/g, ch => translitMap[ch] ?? ch)
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/--+/g, '-') || 'tour'

const rub = (n) => {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? ` ${v.toLocaleString('ru-RU')} ₽` : 'Цена по запросу'
}

const fmtRange = (slot) => {
  if (!slot?.start || !slot?.end) return ''
  const s = new Date(slot.start), e = new Date(slot.end)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const d = (x) => x.toLocaleDateString('ru-RU', { day: '2-digit' })
  const my = (x) => x.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  return sameMonth
    ? `${d(s)} — ${d(e)} ${my(e)}`
    : `${s.toLocaleDateString('ru-RU', { day:'2-digit', month:'long' })} — ${my(e)}`
}

const stripHtml = (html='') => {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return (div.textContent || '').replace(/\s+/g, ' ').trim()
}
const clip = (s='', n=140) => (s.length <= n ? s : s.slice(0, n).replace(/\s[^\s]*$/, '') + '…')

/* ===== страница ===== */
export default function TourPage() {
  const { slug } = useParams()
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [descOpen, setDescOpen] = useState(false)
  const [incOpen, setIncOpen] = useState(false)
  const [excOpen, setExcOpen] = useState(false)

  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    let ok = true
    ;(async () => {
      try {
        setLoading(true)
        // Берём с expand=urls, чтобы сразу получить абсолютные ссылки
        const r = await fetch('/api/tours?limit=200&expand=urls')
        const j = await r.json()
        const items = j?.items || []
        const t = items.find(x => x.slug === slug) || items.find(x => slugify(x.title) === slug)
        if (ok) setTour(t || null)
      } catch {
        if (ok) setError('Ошибка загрузки')
      } finally {
        if (ok) setLoading(false)
      }
    })()
    return () => { ok = false }
  }, [slug])

  if (loading) return <div className="wrap"><p>Загрузка…</p></div>
  if (error || !tour) return (
    <div className="wrap">
      <h1>Тур не найден</h1>
      <p><Link className="btnSecondary" to="/tours">← Все туры</Link></p>
    </div>
  )

  const price = rub(tour.priceFromRUB)
  const slots = tour.dateSlots || []
  const firstDate = slots[0] ? fmtRange(slots[0]) : ''

  // Склеиваем hero + gallery, убираем дубли
  const gallery = Array.from(new Set([...(tour.heroImages || []), ...(tour.gallery || [])]))
  const hasAccommodation = (tour.accommodationText && tour.accommodationText.trim()) || (tour.accommodationImages?.length)

  return (
    <div className="tourp">
      {/* ===== ГАЛЕРЕЯ СВЕРХУ (в пределах .wrap) ===== */}
      <div className="wrap">
        <TourGallery gallery={gallery} />
      </div>

      <div className="wrap">
        {/* ===== Основной контент ===== */}

        {/* Заголовок и краткие параметры */}
        <section className="tourHeader">
          <h1 className="tourTitle">{tour.title}</h1>
          <div className="tags">
            {tour.durationDays ? <span>{tour.durationDays} дней</span> : null}
            {tour.language ? <span>{tour.language}</span> : null}
            {tour.activity ? <span>{tour.activity}</span> : null}
            {tour.comfort ? <span>{tour.comfort}</span> : null}
            {firstDate ? <span>{firstDate}</span> : null}
          </div>
        </section>

        {/* Бронирование: цена + ВСЕ даты + кнопка */}
        <div className="bookRow">
          <span className="priceTag">{price}</span>

          {slots.length > 0 && (
            <div className="dateChips" aria-label="Доступные даты">
              {slots.map((s, i) => (
                <span className={`dateChip${Number(s.seatsAvailable) > 0 && Number(s.seatsAvailable) <= 3 ? ' low' : ''}`} key={i}>
                  <span className="rng">{fmtRange(s)}</span>
                  {Number(s.seatsAvailable) > 0 && (
                    <span className="seats">мест: {s.seatsAvailable}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            className="btnBook"
            onClick={() => setBookingOpen(true)}
          >
            Забронировать
          </button>
        </div>

        {/* Описание */}
        {tour.description && (
          <section className="card">
            <h2>Описание</h2>
            <p className={`lead ${descOpen ? 'open' : 'clamp'}`}>{tour.description}</p>
            <button className="linkBtn" type="button" onClick={()=>setDescOpen(v=>!v)}>
              {descOpen ? 'Свернуть' : 'Развернуть описание'}
            </button>
          </section>
        )}

        {/* Программа по дням */}
        {!!(tour.itinerary?.length) && (
          <section className="card">
            <h2>Программа по дням</h2>
            <div className="acc">
              {tour.itinerary.map(d=>{
                const preview = clip(stripHtml(d.details||''), 110)
                return (
                  <details className="accItem" key={d.day}>
                    <summary>
                      <span className="dnum">День {d.day}</span>
                      <span className="dttl">{d.title}</span>
                      <span className="prev">{preview}</span>
                    </summary>
                    <div className="dhtml" dangerouslySetInnerHTML={{__html: d.details || ''}}/>
                    {d.photos?.length ? (
                      <div className="thumbGrid" style={{padding:'0 12px 12px'}}>
                        {d.photos.map((p, i) => (
                          <div className="thumb" key={i}>
                            <img src={withS3(p)} alt="" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </details>
                )
              })}
            </div>
          </section>
        )}

        {/* Где живём */}
        {hasAccommodation ? (
          <section className="card">
            <h2>Где мы будем жить</h2>
            {tour.accommodationText ? (<p className="lead">{tour.accommodationText}</p>) : null}
            {tour.accommodationImages?.length ? (
              <div className="thumbGrid" style={{marginTop:8}}>
                {tour.accommodationImages.map((k,i)=>(
                  <div key={i} className="thumb">
                    <img src={withS3(k)} alt="" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Карта маршрута */}
        {tour.mapImage ? (
          <section className="card">
            <h2>Карта маршрута</h2>
            <div className="mediaMain" style={{aspectRatio:'16/9'}}>
              <img src={withS3(tour.mapImage)} alt="Карта маршрута" />
            </div>
          </section>
        ) : null}

        {/* Условия */}
        {(tour.paymentTerms || tour.cancellationPolicy || tour.importantInfo || tour.faq) && (
          <section className="card">
            <h2>Условия</h2>
            {tour.paymentTerms ? (
              <>
                <h3>Оплата</h3>
                <p className="lead">{tour.paymentTerms}</p>
              </>
            ) : null}
            {tour.cancellationPolicy ? (
              <>
                <h3>Отмена</h3>
                <p className="lead">{tour.cancellationPolicy}</p>
              </>
            ) : null}
            {tour.importantInfo ? (
              <>
                <h3>Важно знать</h3>
                <p className="lead">{tour.importantInfo}</p>
              </>
            ) : null}
            {tour.faq ? (
              <>
                <h3>FAQ</h3>
                <p className="lead">{tour.faq}</p>
              </>
            ) : null}
          </section>
        )}

        {/* Что включено */}
        {tour.includes?.length ? (
          <section className="card listWide">
            <h3>Что включено</h3>
            <ul className="list">
              {(incOpen ? tour.includes : tour.includes.slice(0,8)).map((x,i)=><li key={i}>{x}</li>)}
            </ul>
            {tour.includes.length > 8 && (
              <button className="linkBtn" type="button" onClick={()=>setIncOpen(v=>!v)}>
                {incOpen ? 'Свернуть' : 'Показать полностью'}
              </button>
            )}
          </section>
        ) : null}

        {/* Что не включено */}
        {tour.excludes?.length ? (
          <section className="card listWide">
            <h3>Что не включено</h3>
            <ul className="list">
              {(excOpen ? tour.excludes : tour.excludes.slice(0,8)).map((x,i)=><li key={i}>{x}</li>)}
            </ul>
            {tour.excludes.length > 8 && (
              <button className="linkBtn" type="button" onClick={()=>setExcOpen(v=>!v)}>
                {excOpen ? 'Свернуть' : 'Показать полностью'}
              </button>
            )}
          </section>
        ) : null}
      </div>

      {/* Модалка бронирования */}
      <BookingDialog
        open={bookingOpen}
        onClose={()=>setBookingOpen(false)}
        tour={tour}
      />
    </div>
  )
}
