import './globals.css'
import { AuthProvider } from '../components/AuthContext'

export const metadata = {
  title: 'wawbot | WhatsApp Api',
  description: 'WhatsApp Bot API powered by Baileys',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
