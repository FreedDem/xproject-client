import React, { useEffect, useRef, useState } from "react";
import { adminLogin, createTour, updateTour, deleteTour, uploadImages, getTour, fetchTours as apiFetchTours } from "../api";
import TourCard from "./TourCard";
import { s3url as withS3 } from "../config";
import "./Admin.css";

/* ========== Utils ========== */
function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function arrayToListHtml(arr = []) {
  const items = (arr || []).map((s) => String(s).trim()).filter(Boolean);
  if (!items.length) return "";
  return `<ul>${items.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`;
}
function listHtmlToArray(html = "") {
  const out = [];
  const div = document.createElement("div");
  div.innerHTML = html || "";
  div.querySelectorAll("li,p").forEach((el) => {
    const t = el.textContent?.trim();
    if (t) out.push(t);
  });
  if (!out.length)
    div.textContent.split(/\n+/).forEach((s) => s.trim() && out.push(s.trim()));
  return out;
}

/* ========== Default tour ========== */
const DEFAULT_TOUR = {
  title: "",
  slug: "",
  durationDays: 0,
  priceFromRUB: 0,
  activity: "",
  ageRange: "",
  comfort: "",
  language: "Русский",
  categories: [],
  location: [],
  heroImages: [],
  gallery: [],
  livingPhotos: [],
  mapImage: "",
  summary: "",
  description: "",
  livingInfo: "",
  paymentTerms: "",
  cancelTerms: "",
  importantInfo: "",
  faq: "",
  includes: [],
  excludes: [],
  includesHtml: "",
  excludesHtml: "",
  itinerary: [],
  dateSlots: [],
};

/* ========== Main Admin ========== */
export default function Admin() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState([]);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [initialFormData, setInitialFormData] = useState(DEFAULT_TOUR);

  const fetchTours = async () => {
    try {
      setLoading(true);
      // api.fetchTours уже приводит ответ к МАССИВУ туров
      const list = await apiFetchTours({ limit: 200, expand: "urls" });
      setTours(Array.isArray(list) ? list : (list?.items || []));
      setError(null);
    } catch (e) {
      setError(e?.message || "Ошибка загрузки туров");
    } finally {
      setLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    try {
      const { token } = await adminLogin(password);
      setToken(token);
      setPassword("");
      setMsg(null);
    } catch {
      setMsg("❌ Неверный пароль или ошибка сервера");
    }
  };

  useEffect(() => {
    if (token) fetchTours(); // грузим только после логина
  }, [token]);

  const openCreate = () => {
    setEditId(null);
    setInitialFormData(DEFAULT_TOUR);
    setFormOpen(true);
  };
  const openEdit = (tour) => {
    const itinerary = (tour.itinerary || []).map((d) => ({
      day: d.day,
      title: d.title || "",
      html: d.details || "",
      photos: d.photos || [],
    }));
    setEditId(tour._id);
    setInitialFormData({
      ...tour,
      // сервер → форма (проживание/отмена)
      livingPhotos: tour.accommodationImages || [],
      livingInfo: tour.accommodationText || "",
      cancelTerms: tour.cancellationPolicy || "",
      includesHtml: arrayToListHtml(tour.includes || []),
      excludesHtml: arrayToListHtml(tour.excludes || []),
      itinerary,
      dateSlots: tour.dateSlots || [],
    });
    setFormOpen(true);
  };

  const onSaved = async () => {
    setFormOpen(false);
    await fetchTours();
    setMsg("✅ Сохранено");
    setTimeout(() => setMsg(null), 2500);
  };
  const onDelete = async (tour) => {
    if (!token) return alert("Нет прав: войди как админ");
    if (!confirm(`Удалить тур «${tour.title}»?`)) return;
    try {
      await deleteTour(tour._id, token);
      await fetchTours();
      setMsg("🗑️ Удалено");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      alert("Ошибка удаления: " + e.message);
    }
  };

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: 680, margin: "40px auto" }}>
        <h1>Админка туров</h1>
        <form onSubmit={login} className="form">
          <label>
            Пароль администратора
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn" type="submit">
            Войти
          </button>
        </form>
        {msg && <p>{msg}</p>}
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ maxWidth: 1100, margin: "24px auto", padding: "0 12px" }}
    >
      <div className="header-row">
        <h1>Туры</h1>
        <button className="btn" onClick={openCreate}>
          + Добавить тур
        </button>
      </div>
      {msg && <p>{msg}</p>}

      {loading ? (
        <p>Загрузка…</p>
      ) : error ? (
        <p>Ошибка: {error}</p>
      ) : tours.length ? (
        <div className="grid grid-3">
          {tours.map((t) => (
            <div key={t._id} className="admin-tour-wrapper">
              <TourCard tour={t} />
              <div className="admin-actions">
                <button
                  className="btn-secondary"
                  onClick={() => openEdit(t)}
                >
                  Редактировать
                </button>
                <button
                  className="btn-danger"
                  onClick={() => onDelete(t)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Туров пока нет.</p>
      )}

      {formOpen && (
        <TourFormDialog
          token={token}
          initial={initialFormData}
          editId={editId}
          onClose={() => setFormOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

/* ========== RichEditor ========== */
function RichEditor({ label, html, onChange, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html)
      ref.current.innerHTML = html || "";
  }, [html]);
  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    ref.current && onChange(ref.current.innerHTML);
  };
  const makeLink = () => {
    const url = prompt("Ссылка (http...)", "https://");
    if (url) exec("createLink", url);
  };
  return (
    <div>
      <label>{label}</label>
      <div
        className="toolbar"
        style={{
          display: "flex",
          gap: 6,
          margin: "6px 0",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exec("bold")}
        >
          B
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exec("italic")}
        >
          <i>i</i>
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exec("insertUnorderedList")}
        >
          •
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exec("insertOrderedList")}
        >
          1.
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => exec("formatBlock", "<h4>")}
        >
          H4
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={makeLink}
        >
          Ссылка
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current?.innerHTML || "")}
        className="ce"
        data-placeholder={placeholder || "Можно форматировать текст…"}
        style={{ minHeight: 120, lineHeight: 1.5 }}
        suppressContentEditableWarning
      />
    </div>
  );
}

/* ========== Photo Dialog ========== */
function ImageDialog({ open, onClose, label, images, single, onChange, token, folder = "tours" }) {
  const [busy, setBusy] = useState(false);
  const dropRef = useRef(null);

  if (!open) return null;

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    await handleUpload(files);
  };
  const handleUpload = async (files = []) => {
    const list = Array.isArray(files) ? files : Array.from(files || []);
    if (!list.length) return;
    try {
      setBusy(true);
      const { keys } = await uploadImages(list, token, folder);
      if (single) onChange(keys[0]);
      else onChange([...(images || []), ...keys]);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (i) => {
    if (single) onChange("");
    else onChange((images || []).filter((_, idx) => idx !== i));
  };

  return (
    <div className="modal" onClick={() => !busy && onClose()}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div className="modal-header">
          <h3>{label}</h3>
          <button className="btn-secondary" onClick={onClose}>
            ✕
          </button>
        </div>
        <div
          className={`dropzone ${busy ? "busy" : ""}`}
          ref={dropRef}
        >
          <p>
            Перетащите файлы сюда или{" "}
            <label style={{ color: "#5c6cff", cursor: "pointer" }}>
              выберите
              <input
                type="file"
                multiple={!single}
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleUpload(Array.from(e.target.files || []))}
              />
            </label>
          </p>
        </div>
        <div className="grid grid-4" style={{ marginTop: 10 }}>
          {(single ? [images].filter(Boolean) : images || []).map((key, i) => (
            <div key={i} className="thumb">
              <img src={withS3(key)} alt="" />
              <button onClick={() => handleRemove(i)}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== Tour Form Dialog ========== */
function TourFormDialog({ token, initial, editId, onClose, onSaved }) {
  const [form, setForm] = useState(initial || DEFAULT_TOUR);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [photoDialog, setPhotoDialog] = useState(null);

  useEffect(() => {
    setForm(initial || DEFAULT_TOUR);
  }, [initial]);

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  // helpers для дат
  const setDateSlot = (idx, patch) => {
    setForm((p) => ({
      ...p,
      dateSlots: (p.dateSlots || []).map((s, i) =>
        i === idx ? { ...s, ...patch } : s
      ),
    }));
  };
  const addDateSlot = () => {
    setForm((p) => ({
      ...p,
      dateSlots: [...(p.dateSlots || []), { start: "", end: "", seatsAvailable: 0 }],
    }));
  };
  const removeDateSlot = (idx) => {
    setForm((p) => ({
      ...p,
      dateSlots: (p.dateSlots || []).filter((_, i) => i !== idx),
    }));
  };

  const onDelete = async (tour) => {
    if (!token) return alert("Нет прав: войди как админ");
    if (!confirm(`Удалить тур «${tour.title}»?`)) return;
    try {
      await deleteTour(tour._id, token);
      await fetchTours();
      setMsg("🗑️ Удалено");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      alert("Ошибка удаления: " + e.message);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        includes: listHtmlToArray(form.includesHtml),
        excludes: listHtmlToArray(form.excludesHtml),
        itinerary: (form.itinerary || []).map((d, i) => ({
          day: i + 1,
          title: d.title,
          details: d.html,
          photos: d.photos || [],
        })),
        // форма → сервер (проживание/отмена)
        accommodationImages: form.livingPhotos || [],
        accommodationText: form.livingInfo || "",
        cancellationPolicy: form.cancelTerms || "",
        // даты: отправляем как есть (сервер нормализует)
        dateSlots: (form.dateSlots || []).map((s) => ({
          start: String(s.start || "").trim(),
          end: String(s.end || "").trim(),
          seatsAvailable:
            s.seatsAvailable === "" || s.seatsAvailable == null
              ? 0
              : Number(s.seatsAvailable) || 0,
        })),
      };
      delete payload.includesHtml;
      delete payload.excludesHtml;
      // не отправляем дубли в API
      delete payload.livingPhotos;
      delete payload.livingInfo;
      delete payload.cancelTerms;

     if (editId) {
      await updateTour(editId, payload, token);
    } else {
      await createTour(payload, token);
    }
      setMsg("✅ Сохранено");
      onSaved && onSaved();
    } catch (err) {
      setMsg("❌ " + (err?.message || "Ошибка"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal" onClick={() => !saving && onClose()}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editId ? "Редактирование тура" : "Добавление тура"}</h3>
          <button className="btn-secondary" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="form" onSubmit={onSubmit}>
          {/* Основное */}
<fieldset>
  <legend>Основное</legend>

  <label>
    Название
    <input
      value={form.title}
      onChange={(e) => setField("title", e.target.value)}
      required
    />
  </label>

  <label>
    Slug
    <input
      value={form.slug}
      onChange={(e) => setField("slug", e.target.value)}
    />
  </label>

  {/* Новые поля */}
    <label>
      Цена от (₽)
      <input
        type="number"
        min="0"
        step="1"
        value={
          form.priceFromRUB === 0 || form.priceFromRUB
            ? String(form.priceFromRUB)
            : ""
        }
        onChange={(e) =>
          setField(
            "priceFromRUB",
            e.target.value === "" ? 0 : Number(e.target.value)
          )
        }
        placeholder="Например, 45000"
      />
    </label>

    <label>
      Продолжительность (дней)
      <input
        type="number"
        min="0"
        step="1"
        value={
          form.durationDays === 0 || form.durationDays
            ? String(form.durationDays)
            : ""
        }
        onChange={(e) =>
          setField(
            "durationDays",
            e.target.value === "" ? 0 : Number(e.target.value)
          )
        }
        placeholder="Например, 7"
      />
    </label>

    <label>
      Тип активности
      <input
        value={form.activity}
        onChange={(e) => setField("activity", e.target.value)}
        placeholder="Треккинг / экскурсии / рафтинг …"
      />
    </label>

    <label>
      Уровень комфорта
      <input
        value={form.comfort}
        onChange={(e) => setField("comfort", e.target.value)}
        placeholder="Базовый / Средний / Высокий"
      />
    </label>

    <label>
      Краткое описание
      <textarea
        rows={3}
        value={form.summary}
        onChange={(e) => setField("summary", e.target.value)}
      />
    </label>

    <label>
      Полное описание
      <textarea
        rows={6}
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
      />
    </label>
  </fieldset>

          {/* Фотографии */}
          <fieldset>
            <legend>Фотографии</legend>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setPhotoDialog({
                  field: "heroImages",
                  label: "Главные фото (Hero Images)",
                  folder: "tours/hero",
                })
              }
            >
              Редактировать обложки
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setPhotoDialog({
                  field: "gallery",
                  label: "Галерея тура",
                  folder: "tours/gallery",
                })
              }
            >
              Редактировать галерею
            </button>
          </fieldset>

          {/* Где живём */}
          <fieldset>
            <legend>Где мы будем жить</legend>
            <textarea
              rows={4}
              value={form.livingInfo}
              onChange={(e) => setField("livingInfo", e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setPhotoDialog({
                  field: "livingPhotos",
                  label: "Фото проживания",
                  folder: "tours/living",
                })
              }
            >
              Редактировать фото проживания
            </button>
          </fieldset>

          {/* Карта */}
          <fieldset>
            <legend>Карта путешествия</legend>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setPhotoDialog({
                  field: "mapImage",
                  label: "Карта маршрута (одно изображение)",
                  single: true,
                  folder: "tours/map",
                })
              }
            >
              Загрузить карту
            </button>
            {form.mapImage && (
              <img
                src={withS3(form.mapImage)}
                alt="Карта маршрута"
                style={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  marginTop: 8,
                  borderRadius: 8,
                }}
              />
            )}
          </fieldset>

          {/* Программа по дням */}
          <fieldset>
            <legend>Программа по дням</legend>
            {form.itinerary.map((day, i) => (
              <div key={i} className="day-row">
                <strong>День {i + 1}</strong>
                <div className="day-actions">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() =>
                      setField(
                        "itinerary",
                        form.itinerary.filter((_, j) => j !== i)
                      )
                    }
                  >
                    Удалить день
                  </button>
                </div>
                <label>
                  Название дня
                  <input
                    value={day.title}
                    onChange={(e) =>
                      setField(
                        "itinerary",
                        form.itinerary.map((d, j) =>
                          j === i ? { ...d, title: e.target.value } : d
                        )
                      )
                    }
                  />
                </label>
                <RichEditor
                  label="Описание"
                  html={day.html}
                  onChange={(h) =>
                    setField(
                      "itinerary",
                      form.itinerary.map((d, j) =>
                        j === i ? { ...d, html: h } : d
                      )
                    )
                  }
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    setPhotoDialog({
                      field: `itinerary_${i}`,
                      label: `Фото дня ${i + 1}`,
                      images: day.photos || [],
                      folder: `tours/itinerary/day-${i + 1}`,
                      onChange: (v) =>
                        setField(
                          "itinerary",
                          form.itinerary.map((d, j) =>
                            j === i ? { ...d, photos: v } : d
                          )
                        ),
                    })
                  }
                >
                  Редактировать фото дня
                </button>
                {day.photos?.length > 0 && (
                  <div className="grid grid-4" style={{ marginTop: 8 }}>
                    {day.photos.map((key, j) => (
                      <div key={j} className="thumb">
                        <img src={withS3(key)} alt="" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn"
              onClick={() =>
                setField("itinerary", [
                  ...form.itinerary,
                  { title: "", html: "", photos: [] },
                ])
              }
            >
              + Добавить день
            </button>
          </fieldset>

          {/* Даты и места */}
          <fieldset>
            <legend>Даты и места</legend>

            {(form.dateSlots || []).map((s, i) => (
              <div key={i} className="row3" style={{ alignItems: "end" }}>
                <label>
                  Начало тура
                  <input
                    type="date"
                    value={s.start || ""}
                    onChange={(e) => setDateSlot(i, { start: e.target.value })}
                  />
                </label>
                <label>
                  Конец тура
                  <input
                    type="date"
                    value={s.end || ""}
                    onChange={(e) => setDateSlot(i, { end: e.target.value })}
                  />
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  <label style={{ flex: 1 }}>
                    Свободных мест
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        s.seatsAvailable === 0 || s.seatsAvailable
                          ? String(s.seatsAvailable)
                          : ""
                      }
                      onChange={(e) =>
                        setDateSlot(i, {
                          seatsAvailable:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => removeDateSlot(i)}
                    style={{ height: 42, alignSelf: "end" }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary"
              onClick={addDateSlot}
              style={{ marginTop: 10 }}
            >
              + Добавить дату
            </button>
            <small>
              Формат дат: YYYY-MM-DD. Пустые строки будут проигнорированы на
              сервере.
            </small>
          </fieldset>

          {/* Условия */}
          <fieldset>
            <legend>Условия</legend>
            <label>
              Условия оплаты
              <textarea
                rows={3}
                value={form.paymentTerms}
                onChange={(e) => setField("paymentTerms", e.target.value)}
              />
            </label>
            <label>
              Условия отмены
              <textarea
                rows={3}
                value={form.cancelTerms}
                onChange={(e) => setField("cancelTerms", e.target.value)}
              />
            </label>
            <label>
              Важно знать
              <textarea
                rows={3}
                value={form.importantInfo}
                onChange={(e) => setField("importantInfo", e.target.value)}
              />
            </label>
            <label>
              Часто задаваемые вопросы
              <textarea
                rows={3}
                value={form.faq}
                onChange={(e) => setField("faq", e.target.value)}
              />
            </label>
          </fieldset>

          {/* Что включено */}
          <fieldset>
            <legend>Что включено / не включено</legend>
            <RichEditor
              label="Что включено"
              html={form.includesHtml || ""}
              onChange={(h) => setField("includesHtml", h)}
            />
            <RichEditor
              label="Что не включено"
              html={form.excludesHtml || ""}
              onChange={(h) => setField("excludesHtml", h)}
            />
          </fieldset>

          <div className="actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
            {msg && <p>{msg}</p>}
          </div>
        </form>
      </div>

      {photoDialog && (
        <ImageDialog
          open={!!photoDialog}
          onClose={() => setPhotoDialog(null)}
          label={photoDialog.label}
          single={photoDialog.single}
          images={
            photoDialog.images ??
            (photoDialog.field.startsWith("itinerary_")
              ? form.itinerary[Number(photoDialog.field.split("_")[1])]?.photos
              : form[photoDialog.field])
          }
          onChange={(v) => {
            if (photoDialog.onChange) photoDialog.onChange(v);
            else setField(photoDialog.field, v);
          }}
          token={token}
          folder={photoDialog.folder || "tours"}
        />
      )}
    </div>
  );
}
