import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src="/logo-mark.png" alt="Логотип" />
            <span>XProject</span>
          </Link>
          <p className="muted small">
            Путешествия, которые запоминаются.  
            <br />Организация, комфорт и вдохновение.
          </p>
        </div>

        <nav className="footer-nav">
          <Link to="/tours">Туры</Link>
          <a href="#categories">Категории</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="footer-copy">
          © {new Date().getFullYear()} XProject. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
