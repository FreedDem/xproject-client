import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './components/Home'
import Tours from './components/Tours'
import Admin from './components/Admin'
import TourPage from './components/TourPage'

export default function App(){
  return (
    <div className="site-wrap">
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/tour/:slug" element={<TourPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
