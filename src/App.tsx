import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PageLoader, ToastProvider } from './components/ui'
import { PublicLayout } from './pages/public/PublicLayout'
import Home from './pages/public/Home'
import NotFound from './pages/public/NotFound'

const Booking = lazy(() => import('./pages/public/Booking'))
const Registration = lazy(() => import('./pages/public/Registration'))
const Tour = lazy(() => import('./pages/public/Tour'))
const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="tempah" element={<Booking />} />
              <Route path="borang/:token" element={<Registration />} />
              <Route path="tour" element={<Tour />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  )
}
