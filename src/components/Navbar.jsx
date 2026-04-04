'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faRobot, faBook, faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import styles from './Navbar.module.css'

const navLinks = [
  { to: '/dashboard', icon: faHouse, label: 'Dashboard' },
  { to: '/make-a-bot', icon: faRobot, label: 'Make a Bot' },
  { to: '/documentation', icon: faBook, label: 'Dokumentasi API' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
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
        <FontAwesomeIcon icon={open ? faXmark : faBars} />
      </button>

      <div className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
        <div className={styles.links}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={link.to}
              className={`${styles.link} ${pathname === link.to ? styles.active : ''}`}
              onClick={() => setOpen(false)}
            >
              <FontAwesomeIcon icon={link.icon} /> {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.userSection}>
          {user && (
            <span className={styles.userName}>
              {user.name || user.email}
            </span>
          )}
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
