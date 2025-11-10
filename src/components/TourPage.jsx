import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { s3url as withS3 } from '../config'
import './tourPage.css'
import TourGallery from './TourGallery'
import BookingDialog from '../components/BookingDialog'
import { fetchTours } from '../api'

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
const clip = (s='', n=110) => (s.length <= n ? s : s.slice(0, n).replace(/\s[^\s]*$/, '') + '…')

/* ===== страница ===== */
export default function TourPage() {
  const { slug: rawSlug } = useParams()
  const slug = decodeURIComponent(rawSlug || '')
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // модалки
  const [descOpen, setDescOpen] = useState(false)
  const [incOpen, setIncOpen] = useState(false)
  const [excOpen, setExcOpen] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)

  // лайтбокс для фото дня
  const [lb, setLb] = useState({ open: false, list: [], index: 0 })
  const openLightbox = (list, index=0) => setLb({ open: true, list, index })
  const closeLightbox = () => setLb({ open: false, list: [], index: 0 })
  const prevLightbox = () =>
    setLb(p => ({ ...p, index: (p.index - 1 + p.list.length) % p.list.length }))
  const nextLightbox = () =>
    setLb(p => ({ ...p, index: (p.index + 1) % p.list.length }))

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const items = await fetchTours({ limit: 500, expand: 'urls' })
        const wanted = items.find(x => x?.slug === slug)
          || items.find(x => slugify(x?.title) === slug)
          || items.find(x => x?._id === slug)
        if (alive) setTour(wanted || null)
      } catch (e) {
        if (alive) setError(e?.message || 'Ошибка загрузки')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [slug])

  /* 🔧 выносим выше ранних return, с безопасной опциональной цепочкой */
  const gallery = useMemo(
    () => Array.from(new Set([...(tour?.heroImages || []), ...(tour?.gallery || [])])),
    [tour]
  )

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
  const hasAccommodation =
    (tour.accommodationText && tour.accommodationText.trim()) ||
    (tour.accommodationImages?.length)

  return (
    <div className="tourp">
      {/* ===== ГАЛЕРЕЯ СВЕРХУ ===== */}
      <div className="wrap">
        <TourGallery gallery={gallery} />
      </div>

      <div className="wrap">
        {/* Заголовок и параметры */}
        <section className="tourHeader">
          <h1 className="tourTitle">{tour.title}</h1>
          <div className="tags">
            {tour.durationDays ? <span><b>Длительность:</b> {tour.durationDays} дней</span> : null}
            {tour.language ?     <span><b>Язык:</b> {tour.language}</span> : null}
            {tour.comfort ?      <span><b>Комфорт:</b> {tour.comfort}</span> : null}
            {tour.activity ?     <span><b>Активность:</b> {tour.activity}</span> : null}
            {firstDate ?         <span><b>Ближайшая дата:</b> {firstDate}</span> : null}
          </div>
        </section>

        {/* Бронирование: цена + даты + кнопка */}
        <div className="bookRow">
          <span className="priceTag">{price}</span>

          {slots.length > 0 && (
            <div className="dateChips" aria-label="Доступные даты">
              {slots.map((s, i) => {
                const seats = Number(s.seatsAvailable ?? 0)
                const low = seats > 0 && seats <= 3
                const soldout = seats === 0
                return (
                  <span
                    className={`dateChip${low ? ' low' : ''}${soldout ? ' soldout' : ''}`}
                    key={i}
                    title={soldout ? 'Нет мест' : seats ? `Свободных мест: ${seats}` : ''}
                  >
                    <span className="rng">{fmtRange(s)}</span>
                    {soldout ? (
                      <span className="seats">Нет мест</span>
                    ) : seats > 0 ? (
                      <span className="seats">мест: {seats}</span>
                    ) : null}
                  </span>
                )
              })}
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
              {tour.itinerary.map(d => {
                const preview = clip(stripHtml(d.details||''), 110)
                const dayPhotos = (d.photos || []).map(k => withS3(k))
                return (
                  <details className="accItem" key={d.day}>
                    <summary>
                      {/* неразрывный пробел между словом и цифрой */}
                      <span className="dnum">{`День\u00A0${d.day}`}</span>
                      <span className="dttl">{d.title}</span>
                      <span className="prev">{preview}</span>
                    </summary>
                    <div className="dhtml" dangerouslySetInnerHTML={{__html: d.details || ''}}/>
                    {dayPhotos.length ? (
                      <div className="thumbGrid" style={{padding:'0 12px 12px'}}>
                        {dayPhotos.map((url, i) => (
                          <button
                            type="button"
                            className="thumb asBtn"
                            key={i}
                            onClick={() => openLightbox(dayPhotos, i)}
                            aria-label={`Открыть фото ${i+1}`}
                          >
                            <img src={url} alt="" />
                          </button>
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
            {tour.accommodationText ? (<p className="lead text-pre">{tour.accommodationText}</p>) : null}
            {tour.accommodationImages?.length ? (
              <div className="thumbGrid" style={{marginTop:8}}>
                {tour.accommodationImages.map((k,i)=>{
                  const url = withS3(k)
                  return (
                    <button
                      key={i}
                      type="button"
                      className="thumb asBtn"
                      onClick={() => openLightbox(tour.accommodationImages.map(withS3), i)}
                      aria-label={`Открыть фото проживания ${i+1}`}
                    >
                      <img src={url} alt="" />
                    </button>
                  )
                })}
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
                <h3>Оплаты</h3>
                <p className="lead text-pre">{tour.paymentTerms}</p>
              </>
            ) : null}
            {tour.cancellationPolicy ? (
              <>
                <h3>Отмены</h3>
                <p className="lead text-pre">{tour.cancellationPolicy}</p>
              </>
            ) : null}
            {tour.importantInfo ? (
              <>
                <h3>Важно знать</h3>
                <p className="lead text-pre">{tour.importantInfo}</p>
              </>
            ) : null}
            {tour.faq ? (
              <>
                <h3>FAQ</h3>
                <p className="lead text-pre">{tour.faq}</p>
              </>
            ) : null}
          </section>
        )}
      </div>

      {/* ===== Лайтбокс (простая модалка) ===== */}
      {lb.open && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lb-close" type="button" onClick={closeLightbox} aria-label="Закрыть">×</button>
          <button className="lb-nav left"  type="button" onClick={(e)=>{e.stopPropagation();prevLightbox()}} aria-label="Предыдущее">‹</button>
          <img className="lb-img" src={lb.list[lb.index]} alt="" onClick={(e)=>e.stopPropagation()} />
          <button className="lb-nav right" type="button" onClick={(e)=>{e.stopPropagation();nextLightbox()}} aria-label="Следующее">›</button>
        </div>
      )}

      {/* Модалка бронирования */}
      <BookingDialog
        open={bookingOpen}
        onClose={()=>setBookingOpen(false)}
        tour={tour}
      />
    </div>
  )
}
