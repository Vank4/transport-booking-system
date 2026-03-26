import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Transport Booking System',
  description: 'Hệ thống đặt vé máy bay và tàu hỏa trực tuyến',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  )
}
