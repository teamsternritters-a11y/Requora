import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ArrowRight, Star, Zap, TrendingUp, Check } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { ScoreRing } from '../components/ScoreRing'

const CATEGORIES = [
  { icon: '💻', name: 'Web Development', count: 124 },
  { icon: '🎨', name: 'Logo & Branding', count: 89 },
  { icon: '📱', name: 'Mobile App', count: 67 },
  { icon: '✍️', name: 'Content Writing', count: 203 },
  { icon: '🛒', name: 'Physical Products', count: 45 },
  { icon: '🖥️', name: 'Computer Services', count: 78 },
  { icon: '📷', name: 'Photography', count: 56 },
  { icon: '🔧', name: 'Software & Tech', count: 112 },
]

const HOW_IT_WORKS = [
  { step: 1, title: 'Post Your Need', desc: 'Tell us what you\'re looking for, set your budget & deadline.', icon: '📋' },
  { step: 2, title: 'Receive Offers', desc: 'Get competitive offers from vetted providers in your category.', icon: '📨' },
  { step: 3, title: 'Compare & Shortlist', desc: 'Use our smart matching scores to compare and shortlist the best.', icon: '⚖️' },
  { step: 4, title: 'Choose & Get It Done', desc: 'Select the winning offer and start your project.', icon: '🚀' },
]

const SAMPLE_PROVIDERS = [
  { name: 'DesignGo', score: 92, rating: 4.9, reviews: 140, days: 3, badge: 'Best Match', price: '₹1,200' },
  { name: 'CreativeStudi', score: 78, rating: 4.7, reviews: 98, days: 4, badge: 'Top Rated', price: '₹900' },
  { name: 'PixelCraft', score: 85, rating: 4.8, reviews: 64, days: 2, badge: 'Great Value', price: '₹1,600' },
]

const badgeColors: Record<string, string> = {
  'Best Match': 'badge-brand',
  'Top Rated': 'badge-yellow',
  'Great Value': 'badge-green',
}

export default function LandingPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  
  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (profile) {
      navigate(profile.role === 'customer' ? '/dashboard/customer' : '/dashboard/provider')
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-accent-600/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-xs font-medium mb-6">
                <Zap size={12} className="fill-brand-400 text-brand-400" />
                Smart AI Matching System
              </div>

              <h1 className="text-4xl lg:text-6xl font-display font-bold text-surface-50 leading-tight mb-4">
                Don't search.
                <br />
                <span className="gradient-text">Post what you need.</span>
              </h1>

              <p className="text-surface-300 text-lg leading-relaxed mb-8 max-w-lg">
                Describe what you're looking for, set your budget & deadline, and receive offers from vetted providers. Our AI matches you with the best.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                {user ? (
                  <>
                    <button onClick={handleDashboardClick} className="btn-primary text-base px-6 py-3 justify-center">
                      Go to Dashboard
                      <ArrowRight size={18} />
                    </button>
                    <Link to="/explore" id="hero-explore-cta" className="btn-secondary text-base px-6 py-3 justify-center">
                      Explore Requirements
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/requirements/create" id="hero-post-cta" className="btn-primary text-base px-6 py-3 justify-center">
                      Post a Requirement
                      <ArrowRight size={18} />
                    </Link>
                    <Link to="/explore" id="hero-explore-cta" className="btn-secondary text-base px-6 py-3 justify-center">
                      Explore Requirements
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-surface-400">
                {['Free to post', 'No subscription', 'Best price guarantee'].map(f => (
                  <div key={f} className="flex items-center gap-1.5">
                    <Check size={14} className="text-emerald-400" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-slide-up hidden lg:block">
              <div className="glass-card p-6 space-y-4 max-w-sm mx-auto">
                <div className="flex items-center gap-3 pb-3 border-b border-white/8">
                  <img src="/favicon.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <p className="text-xs font-bold text-surface-50">Offers for: Logo Design</p>
                    <p className="text-xs text-surface-400">Budget: ₹5K–₹15K · 7 days</p>
                  </div>
                </div>

                {SAMPLE_PROVIDERS.map((p, i) => (
                  <div
                    key={p.name}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === 0 ? 'bg-brand-500/10 border border-brand-500/20' : 'hover:bg-white/3'}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-surface-50">{p.name}</span>
                        <span className={`badge text-xs ${badgeColors[p.badge] || 'badge-gray'}`}>{p.badge}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-400">
                        <span className="flex items-center gap-0.5">
                          <Star size={10} className="fill-yellow-400 text-yellow-400" />
                          {p.rating}
                        </span>
                        <span>{p.days} days</span>
                        <span className="text-surface-50 font-medium">{p.price}</span>
                      </div>
                    </div>
                    <ScoreRing score={p.score} size={40} />
                  </div>
                ))}

                <div className="pt-2 border-t border-white/8">
                  <p className="text-xs text-surface-400 text-center">Powered by Smart Matching System</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-16 bg-surface-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-surface-50 mb-3">What can you get?</h2>
            <p className="text-surface-300 max-w-xl mx-auto">
              From logo design to website development — post any type of requirement and get competitive offers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                to={`/explore?category=${cat.name}`}
                className="glass-card-hover flex flex-col items-center gap-2 p-4 text-center"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-sm font-medium text-surface-50">{cat.name}</span>
                <span className="text-xs text-surface-400">{cat.count}+ open</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-surface-50 mb-3">How it works</h2>
            <p className="text-surface-300">Simple 4-step process to get exactly what you need</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon }, i) => (
              <div key={step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-500/50 to-transparent z-10" />
                )}
                <div className="glass-card p-5 space-y-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-2xl mx-auto">
                    {icon}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center mx-auto -mt-8 relative">
                    {step}
                  </div>
                  <h3 className="font-display font-semibold text-surface-50">{title}</h3>
                  <p className="text-sm text-surface-300 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Matching */}
      <section id="features" className="py-16 bg-surface-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-500/15 border border-accent-500/30 text-accent-300 text-xs font-medium">
                <TrendingUp size={12} />
                Our Smart Matching System
              </div>
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-surface-50">
                AI-powered matching scores for every offer
              </h2>
              <p className="text-surface-300 leading-relaxed">
                Our intelligent algorithm scores each offer against your budget, timeline, and requirements — so you can choose with confidence.
              </p>

              <div className="space-y-4">
                {[
                  { label: 'Budget Fit', desc: 'Matches within your budget range', weight: '40%', color: '#6366f1', score: 95 },
                  { label: 'Delivery Fit', desc: 'Providers that meet your deadline', weight: '25%', color: '#10b981', score: 80 },
                  { label: 'Requirement Relevance', desc: 'Skills and portfolio match', weight: '35%', color: '#d946ef', score: 88 },
                ].map(({ label, desc, weight, color, score }) => (
                  <div key={label} className="glass-card p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-surface-50">{label}</p>
                        <p className="text-xs text-surface-400">{desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-surface-400">{weight} weight</p>
                        <p className="text-sm font-bold" style={{ color }}>{score}</p>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 space-y-5">
              <p className="text-sm font-semibold text-surface-300 uppercase tracking-wide">Example: Logo Design Requirement</p>
              {SAMPLE_PROVIDERS.map(p => (
                <div key={p.name} className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-surface-800 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm">
                    {p.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-50">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-surface-400 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        {p.rating}
                      </span>
                      <span>{p.days} days · {p.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${badgeColors[p.badge] || 'badge-gray'}`}>{p.badge}</span>
                    <ScoreRing score={p.score} size={44} showLabel />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="glass-card p-10 lg:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 via-transparent to-transparent" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-surface-50">
                Ready to get started?
              </h2>
              <p className="text-surface-300 text-lg max-w-lg mx-auto leading-relaxed">
                Post your requirement today and receive the best offers from trusted providers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/requirements/create" id="footer-cta" className="btn-primary text-base px-8 py-3">
                  Post a Requirement
                  <ArrowRight size={18} />
                </Link>
                <Link to="/signup?role=provider" className="btn-secondary text-base px-8 py-3">
                  Join as Provider
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/favicon.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-cover" />
              <span className="font-display font-bold text-surface-50">Requora</span>
            </div>
            <p className="text-sm text-surface-500">© 2025 Requora. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-surface-400">
              <a href="#" className="hover:text-surface-50 transition-colors">Privacy</a>
              <a href="#" className="hover:text-surface-50 transition-colors">Terms</a>
              <a href="#" className="hover:text-surface-50 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
