import React from 'react'
import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section
      className="hero"
      style={{
        padding: '72px 0 48px',
        background:
          'radial-gradient(1200px 400px at 50% -150px, rgba(255,255,255,0.9), rgba(255,255,255,0))',
      }}
    >
      <div className="container" style={{ display: 'grid', justifyItems: 'center' }}>
        {/* Центрируем и ограничиваем ширину текстового блока */}
        <div style={{ maxWidth: 960, width: '100%', textAlign: 'center' }}>
          <h1
            className="heroTitle"
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 4.2vw, 56px)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Путешествия, которые запоминаются
          </h1>

          <p
            className="heroSubtitle"
            style={{
              maxWidth: 760,
              margin: '14px auto 0',
              fontSize: 'clamp(14px, 1.2vw, 18px)',
              lineHeight: 1.5,
              opacity: 0.9,
            }}
          >
            Собираем программы с высоким уровнем комфорта. Прозрачные условия,
            понятные маршруты и внимание к деталям.
          </p>

          {/* Кнопки: центр + перенос на новую строку при нехватке ширины */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
              rowGap: 10,
              marginTop: 22,
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
      </div>
    </section>
  )
}
