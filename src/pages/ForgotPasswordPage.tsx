import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const email = watch('email')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await resetPassword(data.email)
      setSent(true)
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center">
          <img src="/favicon.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-glow-brand" />
          <span className="font-display font-bold text-surface-50 text-xl">Requora</span>
        </Link>

        <div className="glass-card p-8">
          {!sent ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mb-6 mx-auto">
                <Mail size={28} className="text-brand-400" />
              </div>
              <h1 className="text-2xl font-display font-bold text-surface-50 text-center mb-2">
                Reset your password
              </h1>
              <p className="text-surface-300 text-sm text-center mb-8 leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="input-label" htmlFor="reset-email">Email address</label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    className={`input-field ${errors.email ? 'border-red-500/60' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <button id="reset-submit" type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={16} />
                      Send reset link
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-surface-400 mt-6">
                <Link to="/login" className="flex items-center justify-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors">
                  <ArrowLeft size={14} />
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6 mx-auto">
                <Send size={28} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-display font-bold text-surface-50">Check your email</h2>
              <p className="text-surface-300 text-sm leading-relaxed">
                We've sent a password reset link to{' '}
                <span className="text-surface-50 font-medium">{email}</span>
              </p>
              <p className="text-surface-400 text-xs">
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="text-brand-400 hover:text-brand-300 underline">
                  try again
                </button>
              </p>
              <Link to="/login" className="btn-secondary w-full justify-center mt-2 block">
                <ArrowLeft size={14} />
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
