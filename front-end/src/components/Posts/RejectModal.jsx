import { useForm } from 'react-hook-form'
import { useApiMutation } from '../../hooks/useApi'
import { postService } from '../../services/auth'
import { Modal, FormField, Spinner } from '../UI'

export default function RejectModal({ post, onClose }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const mutation = useApiMutation(
    ({ id, reason }) => postService.reject(id, { reason }),
    {
      successMessage: 'Post rejeté',
      invalidateKeys: [['posts']],
      onSuccess: () => { onClose(); reset() },
    }
  )

  const onSubmit = ({ reason }) => mutation.mutate({ id: post.id, reason })

  if (!post) return null

  return (
    <Modal isOpen={!!post} onClose={onClose} title="Rejeter le post" size="sm">
      <div className="space-y-4">
        <div className="p-3 bg-navy-700/30 rounded-lg border border-slate-700/30">
          <p className="text-xs text-slate-400 mb-1">Post</p>
          <p className="text-sm font-medium text-slate-200">{post.title}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Raison du rejet" error={errors.reason?.message}>
            <textarea
              {...register('reason')}
              rows={3}
              className="input-field resize-none"
              placeholder="Expliquez pourquoi le post est rejeté (optionnel)..."
            />
          </FormField>
          <div className="flex gap-3 justify-end">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-danger" disabled={mutation.isPending}>
              {mutation.isPending && <Spinner size="sm" />}
              Rejeter
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}