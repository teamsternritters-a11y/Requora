import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Eye, EyeOff, User, Briefcase, Check, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['customer', 'provider']),
  agree: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'customer', agree: true },
  })

  const role = watch('role')
  const password = watch('password')

  const passwordStrength = () => {
    if (!password) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  }
  const strength = passwordStrength()

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    try {
      await signUp(data.email, data.password, data.fullName, data.role)
      toast.success('Account created! Please check your email to verify.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col flex-1 bg-gradient-hero relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30 animate-float"
              style={{
                width: Math.random() * 120 + 40,
                height: Math.random() * 120 + 40,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-sm text-center space-y-6">
          <img src="/favicon.jpg" alt="Logo" className="w-16 h-16 rounded-3xl object-cover mx-auto shadow-xl border border-surface-700" />
          <h2 className="text-3xl font-display font-bold text-white leading-tight">
            Join thousands finding the best providers
          </h2>
          {[
            'Post requirements in seconds',
            'Receive competitive offers',
            'Smart AI matching scores',
            'Transparent comparison dashboard',
          ].map(f => (
            <div key={f} className="flex items-center gap-3 text-white/75">
              <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-emerald-400" />
              </div>
              <span className="text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 lg:max-w-md flex items-start justify-center p-6 lg:p-12 bg-surface-900 overflow-y-auto">
        <div className="w-full max-w-sm py-4">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/favicon.jpg" alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <span className="font-display font-bold text-surface-50 text-lg">Requora</span>
          </Link>

          <h1 className="text-2xl font-display font-bold text-surface-50 mb-2">Create your account</h1>
          <p className="text-surface-300 text-sm mb-6">Join Requora and start getting the best offers</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['customer', 'provider'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setValue('role', r)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  role === r
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                    : 'border-surface-700 bg-surface-800 text-surface-200 hover:border-surface-600 hover:bg-surface-950'
                }`}
              >
                {r === 'customer' ? <User size={24} /> : <Briefcase size={24} />}
                <span className="text-sm font-semibold capitalize">{r}</span>
                <span className={`text-xs ${role === r ? 'text-brand-600' : 'text-surface-300'}`}>
                  {r === 'customer' ? 'Post requirements' : 'Submit offers'}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                className={`input-field ${errors.fullName ? 'border-red-500/60' : ''}`}
                {...register('fullName')}
              />
              {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                className={`input-field ${errors.email ? 'border-red-500/60' : ''}`}
                {...register('email')}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  className={`input-field pr-11 ${errors.password ? 'border-red-500/60' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength
                            ? strength <= 1 ? '#ef4444' : strength <= 2 ? '#f59e0b' : strength <= 3 ? '#6366f1' : '#10b981'
                            : 'rgba(255,255,255,0.1)'
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-surface-400">
                    {strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong'} password
                  </p>
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                className={`input-field ${errors.confirmPassword ? 'border-red-500/60' : ''}`}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="agree"
                type="checkbox"
                {...register('agree')}
                className="mt-0.5 w-4 h-4 rounded border-surface-600 bg-surface-800 accent-brand-500"
                defaultChecked
              />
              <label htmlFor="agree" className="text-xs text-surface-400 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-brand-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-brand-400 hover:underline">Privacy Policy</a>
              </label>
            </div>
            {errors.agree && <p className="text-red-400 text-xs">{errors.agree.message}</p>}

            <button id="signup-submit" type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create account <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-400 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
