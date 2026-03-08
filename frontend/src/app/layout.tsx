import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Transport Booking System',
  description: 'Transport Booking System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
