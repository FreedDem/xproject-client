import React from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container nav-inner">
        {/* ==== Логотип + бренд ==== */}
        <Link to="/" className="logoWrap">
          <span className="logoMark">
            <img src="/logo-mark.png" alt="Логотип" />
          </span>
          <span className="brandName">XProject</span>
        </Link>

        {/* ==== Навигация ==== */}
        <nav style={{ display: 'flex', gap: 16 }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Главная
          </NavLink>
          <NavLink
            to="/tours"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Туры
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
