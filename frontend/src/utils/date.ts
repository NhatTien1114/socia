export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().slice(0, 10)) return 'Hôm nay'
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Hôm qua'

  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })
}
