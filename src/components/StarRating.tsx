import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  size?: number
  showValue?: boolean
}

export function StarRating({ rating, size = 16, showValue = true }: StarRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(s => (
          <Star
            key={s}
            size={size}
            className={s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
          />
        ))}
      </div>
      {showValue && <span className="font-semibold text-sm text-surface-50">{rating.toFixed(1)}</span>}
    </div>
  )
}

interface StarRatingInputProps {
  value: number
  onChange: (val: number) => void
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={36}
            className={
              s <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300 hover:text-yellow-300'
            }
          />
        </button>
      ))}
    </div>
  )
}
