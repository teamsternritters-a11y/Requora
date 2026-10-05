import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type LoginFormData = z.infer<typeof loginSchema>

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '0.625rem 1rem', borderRadius: '0.75rem',
  backgroundColor: '#fff', border: '1px solid #e2e8f0',
  color: '#0f172a', fontSize: '0.875rem', outline: 'none',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)', cursor: 'text',
  WebkitTextFillColor: '#0f172a', caretColor: '#009688',
}

function forceInputStyles(el: HTMLInputElement | null) {
  if (!el) return
  el.style.setProperty('color', '#0f172a', 'important')
  el.style.setProperty('-webkit-text-fill-color', '#0f172a', 'important')
  el.style.setProperty('caret-color', '#009688', 'important')
  el.style.setProperty('background-color', '#ffffff', 'important')
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Fight Chrome autofill animation that fires ~2s after focus
  useEffect(() => {
    const id = setInterval(() => {
      forceInputStyles(emailRef.current)
      forceInputStyles(passwordRef.current)
    }, 100)
    return () => clearInterval(id)
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Destructure register so we can merge ref + onBlur
  const { ref: emailRegRef, onBlur: emailRegBlur, ...emailRest } = register('email')
  const { ref: passRegRef, onBlur: passRegBlur, ...passRest } = register('password')

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #00695c 0%, #004d40 50%, #00251a 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.15 }}>
          {[...Array(14)].map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: 20 + (i * 17) % 80, height: 20 + (i * 17) % 80,
                left: `${(i * 23) % 100}%`, top: `${(i * 31) % 100}%`,
                background: 'rgba(255,255,255,0.3)',
                animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${(i * 0.3) % 3}s`,
              }} />
          ))}
        </div>
        <div className="relative z-10 max-w-sm text-center">
          <Link to="/" className="flex items-center gap-3 justify-center mb-8">
            <img src="/favicon.jpg" alt="Logo" className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white/20" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>Requora</span>
          </Link>
          <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.875rem', lineHeight: 1.3, marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>
            Your needs, our network.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.125rem', lineHeight: 1.6 }}>
            Post what you need, receive competitive offers and choose the best provider.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 lg:p-12" style={{ background: '#f8fafc' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <img src="/favicon.jpg" alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.125rem', fontFamily: 'Outfit, sans-serif' }}>Requora</span>
          </Link>

          <h1 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#1e293b', marginBottom: '0.375rem' }} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="off"
                placeholder="Enter your email"
                style={INPUT_STYLE}
                onFocus={e => { e.currentTarget.style.borderColor = '#009688'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,150,136,0.15)' }}
                onBlur={e => { emailRegBlur(e); e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)' }}
                ref={el => { emailRegRef(el); (emailRef as React.MutableRefObject<HTMLInputElement | null>).current = el }}
                {...emailRest}
              />
              {errors.email && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }} htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ color: '#009688', fontSize: '0.75rem', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00695c')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#009688')}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="off"
                  placeholder="Enter your password"
                  style={{ ...INPUT_STYLE, padding: '0.625rem 2.75rem 0.625rem 1rem' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#009688'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,150,136,0.15)' }}
                  onBlur={e => { passRegBlur(e); e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)' }}
                  ref={el => { passRegRef(el); (passwordRef as React.MutableRefObject<HTMLInputElement | null>).current = el }}
                  {...passRest}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password.message}</p>}
            </div>

            <button id="login-submit" type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">Login <ArrowRight size={16} /></span>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>or continue with</span>
            <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary justify-center gap-2 text-sm py-2.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className="btn-secondary justify-center gap-2 text-sm py-2.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#24292e">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b', marginTop: '1.5rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#009688', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00695c')}
              onMouseLeave={e => (e.currentTarget.style.color = '#009688')}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
