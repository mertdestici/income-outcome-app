import React from 'react'
export default function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-4">{children}</div>
}
