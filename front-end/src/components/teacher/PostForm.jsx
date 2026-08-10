import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useApiMutation, useApiQuery } from '../../hooks/useApi'
import { postService, classService } from '../../services/auth'
import { ArrowLeft, Save, Send, Image, File, X, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function PostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    class_id: '',
    status: 'draft'
  })
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading] = useState(false)

  // ✅ CORRECTION ICI - Utiliser getMyClasses() au lieu de getAll()
  const { data: classesData, isLoading: classesLoading } = useApiQuery(
    ['teacher-classes-form'],
    () => classService.getMyClasses()  // ← Méthode corrigée
  )
  
  // Extraire les classes correctement
  const classes = classesData?.data?.data || classesData?.data || []

  // Récupérer le post si édition
  const { data: postData, isLoading: postLoading } = useApiQuery(
    ['teacher-post-detail', id],
    () => postService.getOne(id),
    { enabled: isEdit }
  )

  // Mutation pour créer/modifier un post
  const mutation = useApiMutation(
    (data) => isEdit ? postService.update(id, data) : postService.create(data),
    {
      successMessage: isEdit ? 'Post modifié avec succès' : 'Post créé avec succès',
      onSuccess: (response) => {
        navigate('/teacher/posts')
      }
    }
  )

  // Remplir le formulaire si édition
  React.useEffect(() => {
    if (postData?.data) {
      const post = postData.data
      setFormData({
        title: post.title || '',
        body: post.body || '',
        class_id: post.class_id?.toString() || '',
        status: post.status || 'draft'
      })
      setAttachments(post.media || [])
    }
  }, [postData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleSaveDraft = () => {
    mutation.mutate({ ...formData, status: 'draft' })
  }

  if (isEdit && postLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link to="/teacher/posts" className="p-2 hover:bg-navy-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            {isEdit ? 'Modifier le post' : 'Nouveau post'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Partagez une information avec vos élèves et leurs parents
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Titre */}
        <div>
          <label className="label">Titre du post *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Sortie pédagogique du 15 mai"
            className="input-field"
            required
          />
        </div>

        {/* Classe cible */}
        <div>
          <label className="label">Classe cible</label>
          <select
            name="class_id"
            value={formData.class_id}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">📢 Toute l'école (publication générale)</option>
            {classesLoading ? (
              <option disabled>Chargement...</option>
            ) : classes.length === 0 ? (
              <option disabled>Aucune classe assignée</option>
            ) : (
              classes.map(cls => (
                <option key={cls.id} value={cls.id}>📚 {cls.name}</option>
              ))
            )}
          </select>
          <p className="text-[10px] text-slate-500 mt-1">
            Si vous sélectionnez une classe, seuls les parents de cette classe verront le post
          </p>
        </div>

        {/* Contenu */}
        <div>
          <label className="label">Contenu du post *</label>
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            rows={8}
            placeholder="Écrivez votre message ici..."
            className="input-field resize-none"
            required
          />
        </div>

        {/* Zone de fichiers joints (à implémenter plus tard) */}
        <div className="border border-dashed border-slate-600/50 rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            className="hidden"
            id="file-upload"
            disabled
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Image className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Glissez des fichiers ou cliquez pour ajouter</p>
            <p className="text-xs text-slate-500 mt-1">Images, PDF, documents (max 10MB)</p>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-700/30">
          <Link to="/teacher/posts" className="btn-secondary">
            Annuler
          </Link>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="btn-secondary"
            disabled={mutation.isPending}
          >
            <Save className="w-3.5 h-3.5" />
            Sauvegarder en brouillon
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isEdit ? 'Modifier' : 'Publier et soumettre'}
          </button>
        </div>
      </form>

      {/* Note sur le processus d'approbation */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
        <p className="text-xs text-amber-400">
          ⚠️ Note : Les posts sont soumis à l'approbation de l'administrateur avant publication.
          Vous pouvez suivre l'état de vos posts dans la liste "Mes Posts".
        </p>
      </div>
    </div>
  )
}