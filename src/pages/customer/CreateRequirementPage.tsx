import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ChevronRight, ChevronLeft, Check, Upload, X,
  FileText, Tag, Calendar, Settings, Rocket
} from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { categoriesService } from '../../services/categoriesService'
import { requirementsService } from '../../services/requirementsService'
import { useAuth } from '../../hooks/useAuth'
import type { Category } from '../../types/database'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, label: 'Need', icon: FileText },
  { id: 2, label: 'Details', icon: Settings },
  { id: 3, label: 'Budget & Deadline', icon: Tag },
  { id: 4, label: 'Review', icon: Rocket },
]

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  requirement_type: z.enum(['Product', 'Service']),
  category_id: z.string().min(1, 'Please select a category'),
  description: z.string().min(1, 'Description is required'),
  budget_min: z.number().min(1, 'Minimum budget required').positive(),
  budget_max: z.number().min(1, 'Maximum budget required').positive(),
  deadline: z.string().min(1, 'Deadline is required'),
  preferences: z.string().optional(),
}).refine(d => d.budget_max >= d.budget_min, {
  message: 'Maximum budget must be ≥ minimum budget',
  path: ['budget_max'],
})

type FormData = z.infer<typeof schema>

export default function CreateRequirementPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    categoriesService.getAll().then(setCategories)
  }, [])

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      requirement_type: 'Service',
      budget_min: 0,
      budget_max: 0,
    },
  })

  const watchedType = watch('requirement_type')
  const watchedCategory = watch('category_id')
  const allValues = watch()

  const stepFields: Record<number, (keyof FormData)[]> = {
    1: ['title', 'requirement_type', 'category_id'],
    2: ['description'],
    3: ['budget_min', 'budget_max', 'deadline'],
  }

  const nextStep = async () => {
    const fields = stepFields[step]
    if (fields) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStep(s => Math.min(s + 1, 4))
  }

  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!profile) return
    setUploading(true)
    try {
      const req = await requirementsService.create({
        customer_id: profile.id,
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        requirement_type: data.requirement_type,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        deadline: data.deadline,
        preferences: data.preferences ? { notes: data.preferences } : {},
      })

      // Upload files
      if (files.length > 0 && req) {
        const urls: string[] = []
        for (const file of files) {
          try {
            const url = await requirementsService.uploadReferenceFile(file, req.id)
            urls.push(url)
          } catch {}
        }
        if (urls.length > 0) {
          await requirementsService.update(req.id, { reference_files: urls })
        }
      }

      toast.success('Requirement posted successfully!')
      navigate(`/dashboard/customer/requirements/${req.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create requirement')
    } finally {
      setUploading(false)
    }
  }

  const productCategorySlugs = [
    'electronics', 
    'clothing-apparel', 
    'home-furniture', 
    'health-beauty', 
    'toys-games', 
    'office-supplies'
  ]
  const filteredCategories = categories.filter(c => 
    watchedType === 'Product' 
      ? productCategorySlugs.includes(c.slug) 
      : !productCategorySlugs.includes(c.slug)
  )

  const selectedCategory = categories.find(c => c.id === watchedCategory)

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 transition-all duration-300 ${
                  step === s.id ? 'opacity-100' : step > s.id ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.id
                      ? 'bg-emerald-500 text-surface-50'
                      : step === s.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-surface-700 text-surface-400'
                  }`}
                >
                  {step > s.id ? <Check size={14} /> : s.id}
                </div>
                <span className="hidden sm:block text-xs font-medium text-surface-300">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px transition-all ${step > s.id ? 'bg-emerald-500' : 'bg-white/15'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-6 lg:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Need */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-bold text-surface-50 mb-1">What do you need?</h2>
                  <p className="text-surface-400 text-sm">Describe what you're looking for</p>
                </div>

                <div>
                  <label className="input-label" htmlFor="req-title">Requirement title</label>
                  <input
                    id="req-title"
                    placeholder="e.g. Need a modern portfolio website"
                    className={`input-field ${errors.title ? 'border-red-500/60' : ''}`}
                    {...register('title')}
                  />
                  {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="input-label">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Product', 'Service'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue('requirement_type', t)}
                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          watchedType === t
                            ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                            : 'border-surface-700 text-surface-300 hover:border-surface-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label" htmlFor="category-select">Select category</label>
                  <select
                    id="category-select"
                    className={`input-field ${errors.category_id ? 'border-red-500/60' : ''}`}
                    {...register('category_id')}
                  >
                    <option value="">Choose a category...</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-400 text-xs mt-1">{errors.category_id.message}</p>}
                </div>


              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Describe your requirements</h2>
                  <p className="text-surface-400 text-sm">The more detail you provide, the better offers you'll receive</p>
                </div>

                <div>
                  <label className="input-label" htmlFor="req-desc">Description</label>
                  <textarea
                    id="req-desc"
                    rows={6}
                    placeholder="Describe what you need in detail. Include specific features, technologies, style preferences, or any other important requirements..."
                    className={`input-field resize-none ${errors.description ? 'border-red-500/60' : ''}`}
                    {...register('description')}
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div>
                  <label className="input-label" htmlFor="preferences">Additional preferences (optional)</label>
                  <textarea
                    id="preferences"
                    rows={3}
                    placeholder="Any specific preferences, constraints, or nice-to-haves..."
                    className="input-field resize-none"
                    {...register('preferences')}
                  />
                </div>

                <div>
                  <label className="input-label">Reference files (optional)</label>
                  <div className="border-2 border-dashed border-white/15 rounded-xl p-6 text-center hover:border-brand-500/40 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      onChange={handleFileAdd}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload size={24} className="text-surface-400 mx-auto mb-2" />
                      <p className="text-sm text-surface-300">
                        <span className="text-brand-400 font-medium">Click to upload</span> or drag & drop
                      </p>
                      <p className="text-xs text-surface-500 mt-1">PDF, DOC, JPG, PNG up to 10MB</p>
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-surface-800 rounded-lg">
                          <FileText size={14} className="text-brand-400" />
                          <span className="text-xs text-surface-200 flex-1 truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                            className="text-surface-400 hover:text-red-400"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Budget & Deadline */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Budget & Deadline</h2>
                  <p className="text-surface-400 text-sm">Set your budget range and project deadline</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label" htmlFor="budget-min">Minimum budget (₹)</label>
                    <input
                      id="budget-min"
                      type="number"
                      placeholder="5000"
                      className={`input-field ${errors.budget_min ? 'border-red-500/60' : ''}`}
                      {...register('budget_min', { valueAsNumber: true })}
                    />
                    {errors.budget_min && <p className="text-red-400 text-xs mt-1">{errors.budget_min.message}</p>}
                  </div>
                  <div>
                    <label className="input-label" htmlFor="budget-max">Maximum budget (₹)</label>
                    <input
                      id="budget-max"
                      type="number"
                      placeholder="25000"
                      className={`input-field ${errors.budget_max ? 'border-red-500/60' : ''}`}
                      {...register('budget_max', { valueAsNumber: true })}
                    />
                    {errors.budget_max && <p className="text-red-400 text-xs mt-1">{errors.budget_max.message}</p>}
                  </div>
                </div>

                {allValues.budget_min > 0 && allValues.budget_max > 0 && (
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-sm text-brand-300">
                    Budget range: ₹{allValues.budget_min.toLocaleString()} – ₹{allValues.budget_max.toLocaleString()}
                  </div>
                )}

                <div>
                  <label className="input-label" htmlFor="deadline">Project deadline</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                    <input
                      id="deadline"
                      type="date"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      className={`input-field pl-9 ${errors.deadline ? 'border-red-500/60' : ''}`}
                      {...register('deadline')}
                    />
                  </div>
                  {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline.message}</p>}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h2 className="text-xl font-display font-bold text-surface-50 mb-1">Review & Post</h2>
                  <p className="text-surface-400 text-sm">Confirm your requirement before posting</p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Title', value: allValues.title },
                    { label: 'Type', value: allValues.requirement_type },
                    { label: 'Category', value: selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : '—' },
                    { label: 'Budget', value: `₹${(allValues.budget_min || 0).toLocaleString()} – ₹${(allValues.budget_max || 0).toLocaleString()}` },
                    { label: 'Deadline', value: allValues.deadline },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/8 last:border-0">
                      <span className="text-sm text-surface-400">{label}</span>
                      <span className="text-sm font-medium text-surface-50 text-right">{value || '—'}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-white/3 border border-white/8">
                  <p className="text-xs text-surface-400 mb-2 font-semibold uppercase tracking-wide">Description</p>
                  <p className="text-sm text-surface-200 leading-relaxed line-clamp-4">{allValues.description}</p>
                </div>

                {files.length > 0 && (
                  <p className="text-sm text-surface-300">
                    📎 {files.length} file(s) attached
                  </p>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="btn-secondary disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              {step < 4 ? (
                <button type="button" id={`step-${step}-next`} onClick={nextStep} className="btn-primary">
                  Next
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button id="submit-requirement" type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Rocket size={16} />
                      Post Requirement
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
