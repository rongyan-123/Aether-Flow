import type { Metadata } from "next"
import "./globals.css"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "修仙模拟器",
  description: "基于AI的高自由度文字修仙游戏",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC&wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {children}
      </body>
    </html>
  )
}
