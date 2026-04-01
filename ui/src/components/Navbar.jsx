import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faRobot, faBook, faBars, faXmark } from '@fortawesome/free-solid-svg-icons'

const navLinks = [
  { to: '/dashboard', icon: faHouse, label: 'Dashboard' },
  { to: '/make-a-bot', icon: faRobot, label: 'Make a Bot' },
  { to: '/documentation', icon: faBook, label: 'Dokumentasi API' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="flex flex-wrap items-center bg-white border-b border-gray-200 px-6 sticky top-0 z-[100] shadow-sm min-h-[60px]">
      <div className="flex items-center gap-2 mr-auto">
        <img width={30} src="/favicon.svg" alt="wawbot" />
        <span className="font-bold text-lg text-violet-600">WAWBOT</span>
      </div>

      <button
        className="md:hidden bg-transparent border-none text-2xl cursor-pointer text-gray-700 p-1"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <FontAwesomeIcon icon={open ? faXmark : faBars} />
      </button>

      <div className={`${open ? 'flex' : 'hidden'} md:flex items-center gap-4 flex-1 justify-between md:ml-8 w-full md:w-auto flex-col md:flex-row items-start md:items-center py-3 md:py-0 border-t md:border-t-0 border-gray-200 gap-2 md:gap-4`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-1 w-full md:w-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 md:py-1.5 rounded-md text-sm font-medium no-underline transition-all whitespace-nowrap w-full md:w-auto ${isActive ? 'bg-violet-50 text-violet-600' : 'text-gray-600 hover:bg-violet-50 hover:text-violet-600'}`
              }
              onClick={() => setOpen(false)}
            >
              <FontAwesomeIcon icon={link.icon} />
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
          {user && (
            <span className="text-sm text-gray-500 whitespace-nowrap">{user.name || user.email}</span>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

