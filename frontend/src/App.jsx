import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './components/Landing'
import TicketGrid from './components/TicketGrid'
import TicketPage from './components/TicketPage'
import Admin from './components/Admin'
import Register from './components/Register'
import RegisterPending from './components/RegisterPending'
import VerifyEmail from './components/VerifyEmail'
import AdminRaffle from './components/AdminRaffle'
import AdminRaffleSettings from './components/AdminRaffleSettings'
import AdminRaffleDesign from './components/AdminRaffleDesign'
import SuperAdmin from './components/SuperAdmin'
import SellerLogin from './components/SellerLogin'
import SellerPanel from './components/SellerPanel'
import NotFound from './components/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import SellerProtectedRoute from './components/SellerProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/sorteo/:slug" element={<TicketGrid />} />
        <Route path="/ticket/:code" element={<TicketPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/registro/pendiente" element={<RegisterPending />} />
        <Route path="/verificar-correo" element={<VerifyEmail />} />
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
        <Route
          path="/admin/raffle/:id/ajustes/diseno"
          element={
            <ProtectedRoute>
              <AdminRaffleDesign />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin"
          element={
            <ProtectedRoute requireSuperAdmin>
              <SuperAdmin />
            </ProtectedRoute>
          }
        />
        <Route path="/vendedor/login" element={<SellerLogin />} />
        <Route
          path="/vendedor/panel"
          element={
            <SellerProtectedRoute>
              <SellerPanel />
            </SellerProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
