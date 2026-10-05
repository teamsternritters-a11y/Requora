import type { OfferWithDetails, RequirementWithDetails } from '../types/database'

interface ScoreExplanation {
  budget: string
  delivery: string
  relevance: string
}

interface ScoreResult {
  budget_score: number
  delivery_score: number
  relevance_score: number
  total_score: number
  explanation: ScoreExplanation
}

/**
 * Calculate budget score for an offer against a requirement.
 * 100 if within budget, decreasing as it goes above.
 */
function calcBudgetScore(offerPrice: number, budgetMin: number, budgetMax: number): { score: number; explanation: string } {
  if (offerPrice <= budgetMax) {
    // Within or at budget — scale within range for better granularity
    const range = budgetMax - budgetMin || 1
    const proximity = Math.max(0, budgetMax - offerPrice) / range
    const score = Math.min(100, 70 + proximity * 30)
    return {
      score: Math.round(score),
      explanation: `Price ₹${offerPrice.toLocaleString()} is within budget range of ₹${budgetMin.toLocaleString()}–₹${budgetMax.toLocaleString()}`,
    }
  }
  // Over budget — linear decrease, 0 at 50% over
  const overBy = offerPrice - budgetMax
  const penalty = (overBy / budgetMax) * 2 // 0→0%, 0.5→100% penalty
  const score = Math.max(0, Math.round(100 - penalty * 100))
  return {
    score,
    explanation: `Price ₹${offerPrice.toLocaleString()} exceeds budget max of ₹${budgetMax.toLocaleString()} by ₹${overBy.toLocaleString()}`,
  }
}

/**
 * Calculate delivery score based on how well delivery meets the deadline.
 */
function calcDeliveryScore(deliveryDays: number, deadlineDays: number): { score: number; explanation: string } {
  if (deliveryDays <= deadlineDays) {
    const buffer = deadlineDays - deliveryDays
    const bufferRatio = buffer / Math.max(deadlineDays, 1)
    const score = Math.min(100, Math.round(70 + bufferRatio * 30))
    return {
      score,
      explanation: `Delivery in ${deliveryDays} days meets the deadline of ${deadlineDays} days with ${buffer} days buffer`,
    }
  }
  const overDays = deliveryDays - deadlineDays
  const penalty = (overDays / Math.max(deadlineDays, 1)) * 1.5
  const score = Math.max(0, Math.round(100 - penalty * 100))
  return {
    score,
    explanation: `Delivery in ${deliveryDays} days misses the deadline of ${deadlineDays} days by ${overDays} days`,
  }
}

/**
 * Calculate relevance score via category match and keyword overlap.
 */
function calcRelevanceScore(
  requirement: RequirementWithDetails,
  offer: OfferWithDetails
): { score: number; explanation: string } {
  let score = 0
  const explanations: string[] = []

  // Category match (50 points)
  const reqSlug = requirement.categories?.slug || ''
  const providerSkills = offer.profiles?.skills || []
  
  // Slugify helper: lowercases, replaces non-alphanumeric with hyphens, trims hyphens
  const toSlug = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  
  const categoryMatch = providerSkills.some(skill => toSlug(skill) === reqSlug)
  
  if (categoryMatch) {
    score += 50
    explanations.push('Category matches provider specialty')
  } else {
    score += 20
    explanations.push('Partial category relevance')
  }

  // Keyword overlap (50 points)
  const reqWords = new Set(
    `${requirement.title} ${requirement.description}`
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 3)
  )
  const propWords = offer.proposal
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 3)
  
  const overlap = propWords.filter(w => reqWords.has(w)).length
  const keywordScore = Math.min(50, overlap * 5)
  score += keywordScore
  explanations.push(`${overlap} keyword matches in proposal`)

  // Provider rating bonus (up to 10 pts absorbed into relevance)
  const ratingBonus = Math.round((offer.profiles?.rating || 0) / 5 * 10)
  score = Math.min(100, score + ratingBonus)
  if (ratingBonus > 0) {
    explanations.push(`Provider rating: ${offer.profiles?.rating?.toFixed(1)}/5`)
  }

  return {
    score: Math.round(Math.min(100, score)),
    explanation: explanations.join('. '),
  }
}

/**
 * Main matching engine — computes weighted total score.
 * Total = Budget×0.40 + Delivery×0.25 + Relevance×0.35
 */
export function calculateMatchScore(
  requirement: RequirementWithDetails,
  offer: OfferWithDetails,
  deadlineDays?: number
): ScoreResult {
  const daysUntilDeadline = deadlineDays ?? Math.ceil(
    (new Date(requirement.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const budget = calcBudgetScore(offer.price, requirement.budget_min, requirement.budget_max)
  const delivery = calcDeliveryScore(offer.delivery_days, Math.max(1, daysUntilDeadline))
  const relevance = calcRelevanceScore(requirement, offer)

  const total = Math.round(
    budget.score * 0.4 +
    delivery.score * 0.25 +
    relevance.score * 0.35
  )

  return {
    budget_score: budget.score,
    delivery_score: delivery.score,
    relevance_score: relevance.score,
    total_score: Math.min(100, Math.max(0, total)),
    explanation: {
      budget: budget.explanation,
      delivery: delivery.explanation,
      relevance: relevance.explanation,
    },
  }
}

/** Get badge for offer based on scores and comparisons */
export function getOfferBadge(
  offer: OfferWithDetails,
  allOffers: OfferWithDetails[]
): 'Best Match' | 'Lowest Price' | 'Fastest Delivery' | null {
  if (allOffers.length < 2) return null

  const thisScore = offer.offer_scores?.total_score ?? 0
  const maxScore = Math.max(...allOffers.map(o => o.offer_scores?.total_score ?? 0))
  if (thisScore === maxScore && thisScore > 0) return 'Best Match'

  const minPrice = Math.min(...allOffers.map(o => o.price))
  if (offer.price === minPrice) return 'Lowest Price'

  const minDays = Math.min(...allOffers.map(o => o.delivery_days))
  if (offer.delivery_days === minDays) return 'Fastest Delivery'

  return null
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981' // green
  if (score >= 60) return '#6366f1' // brand
  if (score >= 40) return '#f59e0b' // yellow
  return '#ef4444' // red
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}
