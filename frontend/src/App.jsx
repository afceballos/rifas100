import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import TicketGrid from './components/TicketGrid'
import Admin from './components/Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TicketGrid />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
