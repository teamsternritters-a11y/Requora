import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatCurrency(amount: number, currency = '₹'): string {
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(0)}K`
  return `${currency}${amount.toLocaleString()}`
}

export function formatDate(date: string): string {
  const d = new Date(date)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMM yyyy')
}

export function formatRelativeTime(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDeadline(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return 'Overdue'
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `${diffDays} days left`
  return format(d, 'dd MMM yyyy')
}

export function daysUntilDeadline(deadline: string): number {
  const d = new Date(deadline)
  const now = new Date()
  return Math.max(0, Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
