import React, { useEffect, useMemo, useState } from 'react';
import { bookTour } from '../api'; // <-- добавили

function escapeHtml(s='') {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

export default function BookingDialog({ open, onClose, tour }) {
  const slots = useMemo(() => Array.isArray(tour?.dateSlots) ? tour.dateSlots : [], [tour]);
  const selectableSlots = useMemo(() => slots.filter(s => Number(s.seatsAvailable) > 0), [slots]);

  const [fio, setFio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [slotIdx, setSlotIdx] = useState(0);
  const [seats, setSeats] = useState(1);
  const [comment, setComment] = useState('');

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setFio(''); setPhone(''); setEmail('');
      setSlotIdx(0); setSeats(1); setComment('');
      setSending(false); setDone(false); setError('');
    }
  }, [open]);

  const currentSlot = selectableSlots[slotIdx] || null;
  const maxSeats = currentSlot ? Math.max(1, Number(currentSlot.seatsAvailable) || 1) : 1;

  function fmtRange(slot) {
    if (!slot?.start || !slot?.end) return '';
    const s = new Date(slot.start), e = new Date(slot.end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const d = (x) => x.toLocaleDateString('ru-RU', { day: '2-digit' });
    const my = (x) => x.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    return sameMonth
      ? `${d(s)} — ${d(e)} ${my(e)}`
      : `${s.toLocaleDateString('ru-RU', { day:'2-digit', month:'long' })} — ${my(e)}`;
  }

  const disabled = !fio.trim() || !phone.trim() || !currentSlot || sending;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;
    setSending(true); setError('');

    try {
      const persons = Math.min(Math.max(1, Number(seats) || 1), maxSeats);
      const dateRange = fmtRange(currentSlot);

      const payload = {
        tourId: tour?._id,
        tourTitle: tour?.title,
        // прокинем всё полезное по слоту
        slotId: currentSlot?._id,
        start: currentSlot?.start,
        end: currentSlot?.end,
        dateRange,
        name: fio.trim(),
        phone: phone.trim(),
        adults: persons,
        children: 0,
        comment: [comment.trim(), email.trim() ? `Email: ${email.trim()}` : '']
          .filter(Boolean).join('\n').slice(0, 800),
      };

      const res = await bookTour(payload); // <-- теперь POST через общий клиент
      if (!res || res.ok === false) throw new Error(res?.error || 'Не удалось отправить бронирование');

      setDone(true);
    } catch (err) {
      setError(err?.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e)=>e.stopPropagation()}>
        {!done ? (
          <>
            <h3 style={{margin:'0 0 8px'}}>Бронирование тура</h3>
            <p style={{margin:'0 0 12px', color:'#4b5563'}}>
              Тур: <b>{tour?.title || '—'}</b>
            </p>

            {selectableSlots.length === 0 ? (
              <p style={{color:'#B91C1C', fontWeight:700}}>Нет доступных дат для бронирования.</p>
            ) : (
              <form onSubmit={onSubmit} className="bookForm">
                <label>
                  Даты
                  <select
                    value={slotIdx}
                    onChange={(e)=>{ setSlotIdx(Number(e.target.value)||0); setSeats(1); }}
                    required
                  >
                    {selectableSlots.map((s, i) => (
                      <option key={i} value={i}>
                        {fmtRange(s)} • мест: {s.seatsAvailable}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  ФИО
                  <input type="text" placeholder="Иванов Иван Иванович" value={fio} onChange={(e)=>setFio(e.target.value)} required />
                </label>

                <label>
                  Телефон
                  <input type="tel" placeholder="+7 900 000-00-00" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
                </label>

                <label>
                  Email (необязательно)
                  <input type="email" placeholder="example@mail.ru" value={email} onChange={(e)=>setEmail(e.target.value)} />
                </label>

                <label>
                  Мест
                  <input
                    type="number"
                    min={1}
                    max={maxSeats}
                    value={seats}
                    onChange={(e)=>setSeats(Math.min(Math.max(1, Number(e.target.value)||1), maxSeats))}
                    required
                  />
                  <span className="hint">доступно: {maxSeats}</span>
                </label>

                <label>
                  Комментарий (необязательно)
                  <textarea rows={3} placeholder="Пожелания к размещению, вопросы и т.п." value={comment} onChange={(e)=>setComment(e.target.value)} />
                </label>

                {error ? <div className="formError">{escapeHtml(error)}</div> : null}

                <div className="formActions">
                  <button type="button" className="btnSecondary" onClick={onClose} disabled={sending}>Отмена</button>
                  <button type="submit" className="btnPrimary" disabled={disabled}>
                    {sending ? 'Отправляем…' : 'Забронировать'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="successBlock">
            <h3 style={{margin:'0 0 8px'}}>Заявка отправлена ✅</h3>
            <p className="lead">Тур предварительно забронирован. Туроператор скоро свяжется с вами по указанным контактам.</p>
            <div className="formActions">
              <button className="btnPrimary" onClick={onClose}>Ок</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
