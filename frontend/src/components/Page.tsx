import React from 'react'

type PageProps = { children: React.ReactNode; title: string; left?: React.ReactNode; right?: React.ReactNode }
export default function Page({ children, title, left, right }: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-28">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-md mx-auto flex items-center gap-2 px-4 h-14">
          <div className="w-8">{left}</div>
          <h1 className="flex-1 text-center font-semibold">{title}</h1>
          <div className="w-8 text-right">{right}</div>
        </div>
      </header>
      <main className="max-w-md mx-auto p-4">{children}</main>
    </div>
  )
}
