import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './components/Home'
import Tours from './components/Tours'
import Admin from './components/Admin'
import TourPage from './components/TourPage'

export default function App() {

  // ======= ЛОГИ для отладки окружения =======
  useEffect(() => {
    console.log('[APP] import.meta.env.MODE =', import.meta.env?.MODE)
    console.log('[APP] import.meta.env.VITE_API_BASE =', import.meta.env?.VITE_API_BASE)
    console.log('[APP] window.location.origin =', window.location.origin)
  }, [])
  // ==========================================

  return (
    <div className="site-wrap">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tour/:slug" element={<TourPage />} />
          <Route path="/admin" element={<Admin />} />
          {/* catch-all обязательно последним */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
