import type { ReactNode } from 'react'

export function BrandLoading({ label = 'Đang kết nối Socia…', overlay = false }: { label?: string; overlay?: boolean }) {
  return <div className={`brand-loading ${overlay ? 'brand-loading-overlay' : ''}`} role="status" aria-live="polite">
    <div className="brand-loading-art" aria-hidden="true"><span className="brand-loading-halo" /><span className="brand-loading-orbit" /><img src="/Socia_Logo.png" alt="" /><i /><i /></div>
    <p className="brand-loading-title">{label}</p>
    <div className="brand-loading-dots" aria-hidden="true"><span /><span /><span /></div>
  </div>
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />
}

function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return <div role="status" aria-label={label} className="w-full"><span className="sr-only">{label}</span><div aria-hidden="true">{children}</div></div>
}

export function ListSkeleton({ count = 5, label = 'Đang tải danh sách…' }: { count?: number; label?: string }) {
  return <LoadingRegion label={label}>{Array.from({ length: count }, (_, i) => <div key={i} className="flex items-center gap-3 px-4 py-4"><Skeleton className="size-12 shrink-0 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className={i % 2 ? 'h-3 w-2/5' : 'h-3 w-3/5'} /><Skeleton className="h-2.5 w-4/5" /></div></div>)}</LoadingRegion>
}

export function MessagesSkeleton({ count = 5 }: { count?: number }) {
  return <LoadingRegion label="Đang tải tin nhắn…"><div className="space-y-6 py-5">{Array.from({ length: count }, (_, i) => <div key={i} className={`flex gap-3 ${i % 2 ? 'flex-row-reverse' : ''}`}><Skeleton className="size-8 shrink-0 rounded-full" /><Skeleton className={`h-16 rounded-2xl ${i % 2 ? 'w-2/5' : 'w-3/5'}`} /></div>)}</div></LoadingRegion>
}

export function ProfileSkeleton() {
  return <LoadingRegion label="Đang tải hồ sơ…"><div className="space-y-5 py-6">{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex justify-between gap-6"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-1/2" /></div>)}<Skeleton className="h-11 w-full rounded-xl" /></div></LoadingRegion>
}

export function GroupsSkeleton() {
  return <LoadingRegion label="Đang tải nhóm…"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="space-y-4 rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)' }}><Skeleton className="size-14 rounded-2xl" /><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-4/5" /></div>)}</div></LoadingRegion>
}
