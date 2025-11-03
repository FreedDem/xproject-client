import React from 'react'
export default function Steps(){
  return (
    <section className="section">
      <div className="container">
        <h2>Как всё устроено</h2>
        <div className="steps" style={{marginTop:14}}>
          <div className="step">
            <div className="num">1</div>
            <strong>Выбираете тур</strong>
            <div className="muted">Фильтры по датам, стране, активности и комфорту.</div>
          </div>
          <div className="step">
            <div className="num">2</div>
            <strong>Бронируете место</strong>
            <div className="muted">Вносим предоплату, закрепляем место и детали перелёта.</div>
          </div>
          <div className="step">
            <div className="num">3</div>
            <strong>Путешествуете</strong>
            <div className="muted">Мы сопровождаем на всём маршруте — от трансфера до заселения.</div>
          </div>
        </div>
      </div>
    </section>
  )
}
