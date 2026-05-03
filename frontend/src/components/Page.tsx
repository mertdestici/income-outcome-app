import React from 'react'

type PageProps = { children: React.ReactNode; title: string; left?: React.ReactNode; right?: React.ReactNode }
export default function Page({ children, title, left, right }: PageProps) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 pb-28">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-md mx-auto flex items-center gap-2 px-4 h-14">
          <div className="w-10 flex items-center">{left}</div>
          <h1 className="flex-1 text-center font-semibold tracking-tight">{title}</h1>
          <div className="w-10 flex items-center justify-end">{right}</div>
        </div>
      </header>
      <main className="max-w-md mx-auto p-4">{children}</main>
    </div>
  )
}
