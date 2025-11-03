import React, { useState } from 'react'
import { withS3 } from '../config'
import './tourGallery.css'

export default function TourGallery({ gallery = [] }) {
  const [active, setActive] = useState(null)

  if (!gallery?.length)
    return <div className="galleryPlaceholder">Галерея появится позже</div>

  const open = (i) => setActive(i)
  const close = () => setActive(null)
  const next = () => setActive((i) => (i + 1) % gallery.length)
  const prev = () => setActive((i) => (i - 1 + gallery.length) % gallery.length)

  const thumbs = gallery.slice(0, 5)

  return (
    <div className="tourGallery">
      <div className="grid">
        {thumbs.map((img, i) => (
          <div
            key={i}
            className={`cell ${i === 0 ? 'big' : ''}`}
            onClick={() => open(i)}
          >
            <img src={withS3(img)} alt={`tour-${i}`} loading="lazy" />
            {i === 4 && gallery.length > 5 && (
              <div className="more">+{gallery.length - 5}</div>
            )}
          </div>
        ))}
      </div>

      {active !== null && (
        <div className="lightbox" onClick={close}>
          <button className="nav prev" onClick={(e) => { e.stopPropagation(); prev() }}>‹</button>
          <img
            src={withS3(gallery[active])}
            alt={`photo-${active}`}
            className="full"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="nav next" onClick={(e) => { e.stopPropagation(); next() }}>›</button>
          <button className="close" onClick={close}>×</button>
        </div>
      )}
    </div>
  )
}
