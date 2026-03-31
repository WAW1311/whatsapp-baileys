import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

const navLinks = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/documentation', label: '📖 Dokumentasi API' },
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
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <img width={30} src="/favicon.svg" alt="wawbot" />
        <span className={styles.brandName}>WAWBOT</span>
      </div>

      <button
        className={styles.hamburger}
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {open ? '✕' : '☰'}
      </button>

      <div className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
        <div className={styles.links}>
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className={styles.userSection}>
          {user && (
            <span className={styles.userName}>
              {user.name || user.email}
            </span>
          )}
          <button className={`btn btn-danger btn-sm`} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
