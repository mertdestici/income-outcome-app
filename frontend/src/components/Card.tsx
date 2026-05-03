import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 p-5 ${className}`}>
      {children}
    </div>
  )
}
