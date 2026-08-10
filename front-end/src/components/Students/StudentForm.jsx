import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApiMutation, useApiQuery } from '../../hooks/useApi'
import { studentService, classService } from '../../services/auth'
import { Modal, FormField, Spinner } from '../UI'

const schema = z.object({
  first_name: z.string().min(2, 'Prénom requis'),
  last_name: z.string().min(2, 'Nom requis'),
  class_id: z.string().min(1, 'Classe requise'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  is_active: z.boolean().optional(),
})

export default function StudentForm({ isOpen, onClose, student }) {
  const isEdit = !!student

  const { data: classesData } = useApiQuery(
    ['classes-for-student'],
    () => classService.getAll({ per_page: 100 }),
    { enabled: isOpen }
  )
  const classes = classesData?.data?.data || []

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { first_name: '', last_name: '', class_id: '', date_of_birth: '', gender: '', is_active: true },
  })

  useEffect(() => {
    if (student) {
      reset({
        first_name: student.first_name,
        last_name: student.last_name,
        class_id: student.class_id?.toString() || '',
        date_of_birth: student.date_of_birth || '',
        gender: student.gender || '',
        is_active: student.is_active,
      })
    } else {
      reset({ first_name: '', last_name: '', class_id: '', date_of_birth: '', gender: '', is_active: true })
    }
  }, [student, reset])

  const mutation = useApiMutation(
    (data) => isEdit ? studentService.update(student.id, data) : studentService.create(data),
    {
      successMessage: isEdit ? 'Étudiant modifié' : 'Étudiant créé',
      invalidateKeys: [['students']],
      onSuccess: () => { onClose(); reset() },
    }
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Modifier' : 'Nouvel étudiant'}>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Prénom" error={errors.first_name?.message} required>
            <input {...register('first_name')} className="input-field" placeholder="Ahmed" />
          </FormField>
          <FormField label="Nom" error={errors.last_name?.message} required>
            <input {...register('last_name')} className="input-field" placeholder="Hassan" />
          </FormField>
        </div>

        <FormField label="Classe" error={errors.class_id?.message} required>
          <select {...register('class_id')} className="input-field">
            <option value="">Sélectionner</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date de naissance" error={errors.date_of_birth?.message}>
            <input type="date" {...register('date_of_birth')} className="input-field" />
          </FormField>
          <FormField label="Genre" error={errors.gender?.message}>
            <select {...register('gender')} className="input-field">
              <option value="">Non spécifié</option>
              <option value="male">Masculin</option>
              <option value="female">Féminin</option>
              <option value="other">Autre</option>
            </select>
          </FormField>
        </div>

        {isEdit && (
          <div className="flex items-center gap-3 p-3 bg-navy-700/40 rounded-lg border border-slate-700/30">
            <input type="checkbox" id="is_active" {...register('is_active')} className="w-4 h-4 accent-blue-500" />
            <label htmlFor="is_active" className="text-sm text-slate-300 cursor-pointer">Étudiant actif</label>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner size="sm" />}
            {isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}