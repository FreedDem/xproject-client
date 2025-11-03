import React from 'react'

const items = [
  { t:'Понятная программа', d:'Без лишних опций — только то, что действительно важно.', emoji:'📜' },
  { t:'Высокий комфорт', d:'Отели 4–5*, проверенные логистические партнёры.', emoji:'🛏️' },
  { t:'Поддержка 24/7', d:'Мы всегда на связи — в перелёте, на трансфере и во время экскурсий.', emoji:'🛟' },
  { t:'Малые группы', d:'Оптимальный размер для динамики и внимания к каждому.', emoji:'👥' }
]
export default function Features(){
  return (
    <section className="section">
      <div className="container">
        <h2>Почему с нами удобно</h2>
        <div className="features" style={{marginTop:14}}>
          {items.map((it,i)=>(
            <div className="card" key={i}><div className="pad stat">
              <div className="icon" aria-hidden>{it.emoji}</div>
              <div><strong>{it.t}</strong><div className="muted">{it.d}</div></div>
            </div></div>
          ))}
        </div>
      </div>
    </section>
  )
}
