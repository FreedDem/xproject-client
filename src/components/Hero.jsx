import React from 'react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="hero">
      <div className="container" style={{ textAlign: 'center' }}>
        <h1 className="heroTitle">Путешествия, которые запоминаются</h1>
        <p className="heroSubtitle">
          Собираем программы с высоким уровнем комфорта. Прозрачные условия,
          понятные маршруты и внимание к деталям.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            marginTop: 20,
          }}
        >
          <Link to="/tours" className="btn">
            Смотреть туры
          </Link>
          <a href="#categories" className="btn ghost">
            Категории
          </a>
        </div>
      </div>
    </section>
  )
}
