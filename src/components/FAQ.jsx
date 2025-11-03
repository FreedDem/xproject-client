import React from 'react'
export default function FAQ(){
  return (
    <section className="section tight">
      <div className="container">
        <h2>Вопросы и ответы</h2>
        <div style={{display:'grid', gap:12, marginTop:12}}>
          <details><summary>Что входит в стоимость?</summary><div className="muted">Проживание, трансферы по программе, сопровождение организатора. Авиабилеты и личные расходы обычно не включены.</div></details>
          <details><summary>Как оплатить?</summary><div className="muted">Оплата возможна банковской картой, рассрочкой или по счёту для юрлиц.</div></details>
          <details><summary>Какие группы по размеру?</summary><div className="muted">Обычно 8–16 человек, в зависимости от направления.</div></details>
        </div>
      </div>
    </section>
  )
}
