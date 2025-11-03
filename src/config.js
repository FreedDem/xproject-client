// client/src/config.js

// Универсальный доступ к переменным окружения (Vite + CRA)
const ENV = (() => {
  const vite = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const cra  = (typeof process !== 'undefined' && process.env) || {};
  return new Proxy({}, {
    get: (_, k) => (k in vite ? vite[k] : cra[k]),
  });
})();

// Базовый публичный домен для раздачи файлов S3/YOС.
// Поддерживаем несколько имён переменных для удобства:
//   VITE_S3_PUBLIC_BASE (рекомендуется)
//   VITE_S3_URL (старый вариант)
//   REACT_APP_S3_URL (CRA)
export const S3_BASE =
  (ENV.VITE_S3_PUBLIC_BASE || ENV.VITE_S3_URL || ENV.REACT_APP_S3_URL || '').toString();

// Необязательный префикс-папка внутри бакета (например: "tours/2025/10")
export const S3_PREFIX =
  (ENV.VITE_S3_PREFIX || ENV.REACT_APP_S3_PREFIX || '').toString();

/** Склейка путей без двойных/пропавших слешей */
export function joinUrl(...parts) {
  return parts
    .filter(Boolean)
    .map((p, i) =>
      i === 0
        ? String(p).replace(/\/+$/, '')
        : String(p).replace(/^\/+|\/+$/g, '')
    )
    .join('/');
}

/**
 * Ключ/URL → публичный URL.
 * - Если пришёл абсолютный http(s)/data — возвращаем как есть.
 * - Если пришёл ключ S3 — приклеиваем S3_BASE и (опционально) S3_PREFIX.
 * - Пробелы кодируем как %20.
 */
export function s3url(pathOrUrl = '') {
  const raw = String(pathOrUrl || '').trim().replace(/^["']|["']$/g, '');
  if (!raw) return '';
  if (/^(https?:)?\/\//i.test(raw) || /^data:image\//i.test(raw)) return raw;

  const path = S3_PREFIX ? joinUrl(S3_PREFIX, raw) : raw;
  if (S3_BASE) return joinUrl(S3_BASE, path).replace(/ /g, '%20');
  return path.replace(/ /g, '%20'); // фолбэк, если базовый домен не задан
}

/** Обратная совместимость: старое имя функции */
export const withS3 = s3url;

// На всякий случай экспортнём isDev — бывает полезно
export const isDev =
  (ENV.MODE || ENV.NODE_ENV || '').toString() !== 'production';
