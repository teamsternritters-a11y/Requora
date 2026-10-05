import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Save, Plus, X } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { useAuth } from '../hooks/useAuth'
import { profilesService } from '../services/categoriesService'
import { getInitials } from '../utils/formatters'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name: z.string().min(2, 'Name too short'),
  bio: z.string().max(500, 'Bio too long').optional(),
  location: z.string().max(100).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  years_experience: z.number().int().min(0).max(50).optional(),
})

type FormData = z.infer<typeof schema>

interface ProfileEditPageProps {
  role?: 'customer' | 'provider'
}

export default function ProfileEditPage({ role }: ProfileEditPageProps) {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [skills, setSkills] = useState<string[]>(profile?.skills || [])
  const [newSkill, setNewSkill] = useState('')
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>(profile?.portfolio_urls || [''])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.website || '',
      years_experience: profile?.years_experience || undefined,
    },
  })

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (s: string) => setSkills(prev => prev.filter(x => x !== s))

  const updatePortfolioUrl = (i: number, val: string) => {
    setPortfolioUrls(prev => prev.map((u, j) => j === i ? val : u))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    try {
      const url = await profilesService.uploadAvatar(profile.id, file)
      await profilesService.update(profile.id, { avatar_url: url })
      await refreshProfile()
      toast.success('Avatar updated!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!profile) return
    setSaving(true)
    try {
      await profilesService.update(profile.id, {
        ...data,
        skills,
        portfolio_urls: portfolioUrls.filter(u => u.trim()),
        website: data.website || null,
        bio: data.bio || null,
        location: data.location || null,
      })
      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-surface-50">Edit Profile</h1>
          <p className="text-surface-300 text-sm mt-1">Update your public profile information</p>
        </div>

        {/* Avatar */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
                ) : getInitials(profile.full_name)}
              </div>
              <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center cursor-pointer hover:bg-brand-400 transition-colors">
                <Camera size={14} className="text-surface-50" />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <p className="font-semibold text-surface-50">{profile.full_name}</p>
              <p className="text-sm text-surface-400 capitalize">{profile.role}</p>
              <p className="text-xs text-surface-500 mt-1">Click the camera icon to change your avatar</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-base font-semibold text-surface-50">Basic Info</h2>

            <div>
              <label className="input-label" htmlFor="full-name">Full name</label>
              <input id="full-name" className={`input-field ${errors.full_name ? 'border-red-500/60' : ''}`} {...register('full_name')} />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="input-label" htmlFor="bio">Bio</label>
              <textarea id="bio" rows={4} placeholder="Tell people about yourself..." className="input-field resize-none" {...register('bio')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label" htmlFor="location">Location</label>
                <input id="location" placeholder="City, Country" className="input-field" {...register('location')} />
              </div>
              <div>
                <label className="input-label" htmlFor="website">Website</label>
                <input id="website" type="url" placeholder="https://yoursite.com" className={`input-field ${errors.website ? 'border-red-500/60' : ''}`} {...register('website')} />
                {errors.website && <p className="text-red-400 text-xs mt-1">{errors.website.message}</p>}
              </div>
            </div>

            {role === 'provider' && (
              <div>
                <label className="input-label" htmlFor="years-exp">Years of experience</label>
                <input id="years-exp" type="number" min={0} max={50} placeholder="5" className="input-field" {...register('years_experience', { valueAsNumber: true })} />
              </div>
            )}
          </div>

          {/* Skills (Provider) */}
          {role === 'provider' && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-surface-50">Skills</h2>
              <div className="flex gap-2">
                <input
                  id="new-skill"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="e.g. React, Figma, Node.js"
                  className="input-field flex-1"
                />
                <button type="button" onClick={addSkill} className="btn-secondary">
                  <Plus size={16} />
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s} className="badge badge-brand text-xs flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-300">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Portfolio URLs (Provider) */}
          {role === 'provider' && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-surface-50">Portfolio Links</h2>
              <div className="space-y-2">
                {portfolioUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={e => updatePortfolioUrl(i, e.target.value)}
                      placeholder="https://your-project.com"
                      className="input-field flex-1 text-sm"
                    />
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => setPortfolioUrls(prev => prev.filter((_, j) => j !== i))}
                        className="p-2.5 text-surface-400 hover:text-red-400 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {portfolioUrls.length < 8 && (
                  <button type="button" onClick={() => setPortfolioUrls(prev => [...prev, ''])} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <Plus size={14} />
                    Add portfolio link
                  </button>
                )}
              </div>
            </div>
          )}

          <button id="save-profile" type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}
