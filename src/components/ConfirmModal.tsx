interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  confirmDanger?: boolean
}

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  confirmDanger = false,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative glass-card w-full max-w-sm p-6 animate-slide-up space-y-5">
        <h3 className="text-lg font-display font-bold text-surface-50">{title}</h3>
        <p className="text-sm text-surface-300 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button id="confirm-cancel" onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            id="confirm-action"
            onClick={onConfirm}
            className={confirmDanger ? 'btn-danger flex-1' : 'btn-primary flex-1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
