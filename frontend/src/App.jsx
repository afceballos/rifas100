import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import TicketGrid from './components/TicketGrid'
import AdminRaffles from './components/AdminRaffles'
import AdminRaffle from './components/AdminRaffle'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sorteo/:id" element={<TicketGrid />} />
        <Route path="/admin" element={<AdminRaffles />} />
        <Route path="/admin/raffle/:id" element={<AdminRaffle />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
