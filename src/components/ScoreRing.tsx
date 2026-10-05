import { getScoreColor, getScoreLabel } from '../utils/matchingEngine'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  className?: string
}

export function ScoreRing({ score, size = 64, strokeWidth = 5, showLabel = false, className = '' }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)

  return (
    <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-surface-50">{score}</span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>{getScoreLabel(score)}</span>
      )}
    </div>
  )
}

interface ScoreBreakdownProps {
  budgetScore: number
  deliveryScore: number
  relevanceScore: number
  totalScore: number
  explanation?: { budget: string; delivery: string; relevance: string } | null
}

export function ScoreBreakdown({ budgetScore, deliveryScore, relevanceScore, totalScore, explanation }: ScoreBreakdownProps) {
  const bars = [
    { label: 'Budget Fit', score: budgetScore, weight: '40%', detail: explanation?.budget },
    { label: 'Delivery Fit', score: deliveryScore, weight: '25%', detail: explanation?.delivery },
    { label: 'Relevance', score: relevanceScore, weight: '35%', detail: explanation?.relevance },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-surface-200">Match Score</span>
        <ScoreRing score={totalScore} size={52} showLabel />
      </div>
      {bars.map(({ label, score, weight, detail }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-surface-300">{label} <span className="text-surface-400">({weight})</span></span>
            <span className="font-semibold" style={{ color: getScoreColor(score) }}>{score}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${score}%`, background: getScoreColor(score) }} />
          </div>
          {detail && <p className="text-xs text-surface-400">{detail}</p>}
        </div>
      ))}
    </div>
  )
}
