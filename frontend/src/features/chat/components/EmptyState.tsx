export function EmptyState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-8">
      {/* Illustration */}
      <div className="relative flex size-28 items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#2858cf]/5" />
        <div className="absolute inset-3 rounded-full bg-[#2858cf]/8" />
        <svg className="relative size-12 text-[#2858cf]/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>

      <div className="text-center">
        <h2 className="m-0 text-lg font-semibold text-[#273452]">Chọn một cuộc trò chuyện</h2>
        <p className="m-0 mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-[#8490aa]">
          Chọn một cuộc hội thoại từ danh sách bên trái hoặc bắt đầu một cuộc trò chuyện mới.
        </p>
      </div>
    </div>
  )
}
