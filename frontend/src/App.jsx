import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import TicketGrid from './components/TicketGrid'
import Admin from './components/Admin'
import AdminRaffle from './components/AdminRaffle'
import AdminRaffleSettings from './components/AdminRaffleSettings'
import NotFound from './components/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sorteo/:id" element={<TicketGrid />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/admin/raffle/:id"
          element={
            <ProtectedRoute>
              <AdminRaffle />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/raffle/:id/ajustes"
          element={
            <ProtectedRoute>
              <AdminRaffleSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
