import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useApiMutation, useApiQuery } from '../../hooks/useApi'
import { classService, userService } from '../../services/auth'
import { Modal, FormField, Spinner } from '../UI'

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  grade: z.string().min(1, 'Niveau requis'),
  section: z.string().optional(),
  teacher_id: z.string().optional(),
  academic_year: z.string().min(4, 'Année scolaire requise'),
})

export default function ClassForm({ isOpen, onClose, class_ }) {
  const isEdit = !!class_

  const { data: teachersData } = useApiQuery(
    ['teachers-list'],
    () => userService.getAll({ role: 'teacher', per_page: 100 }),
    { enabled: isOpen }
  )
  const teachers = teachersData?.data?.data || []

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', grade: '', section: '', teacher_id: '', academic_year: '2024-2025' },
  })

  useEffect(() => {
    if (class_) {
      reset({
        name: class_.name, grade: class_.grade,
        section: class_.section || '', teacher_id: class_.teacher_id?.toString() || '',
        academic_year: class_.academic_year,
      })
    } else {
      reset({ name: '', grade: '', section: '', teacher_id: '', academic_year: '2024-2025' })
    }
  }, [class_, reset])

  const mutation = useApiMutation(
    (data) => isEdit ? classService.update(class_.id, data) : classService.create(data),
    {
      successMessage: isEdit ? 'Classe modifiée' : 'Classe créée',
      invalidateKeys: [['classes']],
      onSuccess: () => { onClose(); reset() },
    }
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Modifier la classe' : 'Nouvelle classe'}>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <FormField label="Nom de la classe" error={errors.name?.message} required>
          <input {...register('name')} className="input-field" placeholder="Ex: 6ème A" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Niveau" error={errors.grade?.message} required>
            <input {...register('grade')} className="input-field" placeholder="Ex: 6ème" />
          </FormField>
          <FormField label="Section" error={errors.section?.message}>
            <input {...register('section')} className="input-field" placeholder="Ex: A" />
          </FormField>
        </div>

        <FormField label="Année scolaire" error={errors.academic_year?.message} required>
          <input {...register('academic_year')} className="input-field" placeholder="2024-2025" />
        </FormField>

        <FormField label="Enseignant" error={errors.teacher_id?.message}>
          <select {...register('teacher_id')} className="input-field">
            <option value="">Non assigné</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </FormField>

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