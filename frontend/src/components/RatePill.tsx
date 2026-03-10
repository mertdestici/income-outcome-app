import React from 'react'
export default function RatePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-full bg-gray-100 px-3 py-2 text-center">
      <div className="font-mono text-[13px]">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}
