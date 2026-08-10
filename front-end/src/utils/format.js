import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (date) => {
  if (!date) return '—'
  try { return format(parseISO(date), 'MMM d, yyyy') } catch { return date }
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  try { return format(parseISO(date), 'MMM d, yyyy · HH:mm') } catch { return date }
}

export const formatRelative = (date) => {
  if (!date) return '—'
  try { return formatDistanceToNow(parseISO(date), { addSuffix: true }) } catch { return date }
}

export const getRoleBadgeClass = (role) => {
  const map = {
    admin: 'badge-rose',
    teacher: 'badge-blue',
    parent: 'badge-green',
    driver: 'badge-amber',
  }
  return map[role] || 'badge-slate'
}

export const getPostStatusBadge = (status) => {
  const map = {
    approved: 'badge-green',
    pending: 'badge-amber',
    rejected: 'badge-rose',
    draft: 'badge-slate',
  }
  return map[status] || 'badge-slate'
}

export const getTripStatusBadge = (status) => {
  const map = {
    scheduled: 'badge-blue',
    in_progress: 'badge-amber',
    completed: 'badge-green',
    cancelled: 'badge-rose',
  }
  return map[status] || 'badge-slate'
}

export const downloadCSV = (data, filename) => {
  if (!data?.length) return
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}