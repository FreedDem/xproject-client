import React, { useEffect, useState } from 'react'
import Hero from './Hero'
import Features from './Features'
import Steps from './Steps'
import FAQ from './FAQ'
import TourCard from './TourCard'
import { Link } from 'react-router-dom'
import { fetchTours } from '../api' // ✅ используем общий клиент API

export default function Home(){
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const list = await fetchTours({ limit: 12, expand: 'urls' })
        if (alive) setTours(list)
      } catch (e) {
        if (alive) setError(e?.message || 'Ошибка загрузки')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return (
    <>
      <Hero />

      {/* === Для кого наши путешествия (3 плитки) === */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-head">
            <h2>Для кого наши путешествия</h2>
            <p className="subtitle muted">Если хочется перезагрузки, заботы об организации и компании по духу — это к нам.</p>
          </div>

          <div className="tiles3" style={{marginTop:14}}>
            <article className="tile">
              <div className="tile__media"><div className="skelet" aria-hidden /></div>
              <div className="tile__body">
                <strong>Хочется сменить обстановку</strong>
                <p className="muted">Продуманные маршруты без толп туристов, чтобы просто дышать и наслаждаться.</p>
              </div>
            </article>
            <article className="tile">
              <div className="tile__media"><div className="skelet" aria-hidden /></div>
              <div className="tile__body">
                <strong>Организация — на нас</strong>
                <p className="muted">Логистика, отели, трансферы и сопровождение — всё закрываем под ключ.</p>
              </div>
            </article>
            <article className="tile">
              <div className="tile__media"><div className="skelet" aria-hidden /></div>
              <div className="tile__body">
                <strong>Нужна классная компания</strong>
                <p className="muted">Небольшие группы и близкие по духу попутчики. Удобно ехать даже в одиночку.</p>
              </div>
            </article>
          </div>

          <div style={{marginTop:16}}>
            <Link to="/tours" className="btn">Все путешествия</Link>
          </div>
        </div>
      </section>

      {/* === Ближайшие туры === */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Ближайшие туры</h2>
            <div className="cta-row">
              <Link to="/tours" className="btn">Все направления</Link>
              <a href="/tours?tab=calendar" className="btn ghost">Календарь туров</a>
            </div>
          </div>

          {loading ? (
            <div className="muted" style={{marginTop:8}}>Загружаем список…</div>
          ) : error ? (
            <div className="muted" style={{marginTop:8}}>Ошибка: {error}</div>
          ) : tours?.length ? (
            <div className="grid" style={{marginTop:14}}>
              {tours.slice(0,6).map(t => <TourCard key={t._id} tour={t} />)}
            </div>
          ) : (
            <div className="muted" style={{marginTop:8}}>Туры скоро появятся — следите за обновлениями.</div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Отзывы наших участников</h2>
          </div>
          <div className="reviews" style={{marginTop:14}}>
            <article className="review-card">
              <p className="review-text">«Ирландия оказалась сказочной: не было ни единого дня без вау-момента. Организация — на высоте!»</p>
              <div className="review-meta"><div className="avatar" aria-hidden>М</div><div><strong>Марина</strong><div className="muted small">Ирландия</div></div></div>
            </article>
            <article className="review-card">
              <p className="review-text">«Японию увидели без толп и очередей. Программа плотная, но очень комфортная. Хочется снова!»</p>
              <div className="review-meta"><div className="avatar" aria-hidden>Г</div><div><strong>Георгий</strong><div className="muted small">Япония</div></div></div>
            </article>
            <article className="review-card">
              <p className="review-text">«ЮАР полностью перевернула представление о стране. Каждый день — лучше предыдущего!»</p>
              <div className="review-meta"><div className="avatar" aria-hidden>Т</div><div><strong>Татьяна</strong><div className="muted small">Южная Африка</div></div></div>
            </article>
          </div>
        </div>
      </section>

      <Features />
      <Steps />
      <FAQ />
    </>
  )
}
