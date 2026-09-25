import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Bot, BookText, Menu, X, LogOut } from 'lucide-react'

const navLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/make-a-bot', icon: Bot, label: 'Make a Bot' },
  { to: '/documentation', icon: BookText, label: 'Dokumentasi API' },
]

const linkBase =
  'flex items-center gap-2 px-3 py-2 font-bold uppercase text-sm tracking-wide border-2 transition-transform duration-100'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const renderLinks = (onClick) =>
    navLinks.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          `${linkBase} ${
            isActive
              ? 'bg-neo-red border-neo-ink shadow-neo-xs'
              : 'bg-neo-white border-transparent hover:border-neo-ink hover:-translate-y-0.5'
          }`
        }
      >
        <Icon strokeWidth={3} className="h-4 w-4" />
        {label}
      </NavLink>
    ))

  return (
    <nav className="sticky top-0 z-50 border-b-4 border-neo-ink bg-neo-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center border-2 border-neo-ink bg-neo-yellow shadow-neo-xs">
            <Bot strokeWidth={3} className="h-5 w-5" />
          </span>
          <span className="font-display text-xl tracking-tight">WAWBOT</span>
        </NavLink>

        {/* Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          {renderLinks()}
          {user && (
            <span className="ml-1 max-w-[10rem] truncate border-2 border-neo-ink bg-neo-violet px-2 py-1 text-sm font-bold">
              {user.name || user.email}
            </span>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut strokeWidth={3} className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="btn btn-sm md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <X strokeWidth={3} className="h-5 w-5" /> : <Menu strokeWidth={3} className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div id="mobile-menu" className="border-t-4 border-neo-ink bg-neo-cream px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {renderLinks(() => setOpen(false))}
            {user && (
              <span className="truncate border-2 border-neo-ink bg-neo-violet px-3 py-2 text-sm font-bold">
                {user.name || user.email}
              </span>
            )}
            <button className="btn btn-danger w-full" onClick={handleLogout}>
              <LogOut strokeWidth={3} className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
