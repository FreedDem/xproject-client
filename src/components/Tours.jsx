import React, { useEffect, useState } from "react";
import TourCard from "./TourCard";
import { Link } from "react-router-dom";
import { fetchTours } from "../api"; // <-- путь исправлен

export default function Tours() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        setLoading(true);
        const list = await fetchTours({ limit: 200, expand: "urls" });
        if (ok) setTours(list);
      } catch (e) {
        if (ok) setError(e.message || "Ошибка загрузки");
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  return (
    <div className="section">
      <div className="container">
        <div className="section-head">
          <h1>Все туры</h1>
          <p className="subtitle muted">
            Выберите направление, которое вам по душе.
          </p>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : error ? (
          <p>Ошибка: {error}</p>
        ) : !tours.length ? (
          <p>Туры пока не добавлены.</p>
        ) : (
          <div className="grid" style={{ marginTop: 20 }}>
            {tours.map((t) => (
              <TourCard key={t._id} tour={t} />
            ))}
          </div>
        )}

        {!loading && tours.length > 6 && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link to="/" className="btn ghost">
              На главную
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
