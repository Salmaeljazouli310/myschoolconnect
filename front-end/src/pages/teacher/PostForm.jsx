import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useApiMutation, useApiQuery } from '../../hooks/useApi'
import { postService, classService } from '../../services/auth'
import { ArrowLeft, Save, Send, Image, Loader2, X } from 'lucide-react'
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
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingMedia, setExistingMedia] = useState([])
  const [uploading, setUploading] = useState(false)

  // Récupérer les classes de l'enseignant
  const { data: classesData, isLoading: classesLoading } = useApiQuery(
    ['teacher-classes-form'],
    () => classService.getMyClasses()
  )
  
  const classes = classesData?.data?.data || classesData?.data || []

  // Récupérer le post si édition
  const { data: postData, isLoading: postLoading } = useApiQuery(
    ['teacher-post-detail', id],
    () => postService.getOne(id),
    { enabled: isEdit }
  )

  // Mutation pour créer/modifier un post
  const mutation = useApiMutation(
    async (data) => {
      let requestData;
      
      if (isEdit) {
        // Pour l'édition, on envoie du JSON
        requestData = {
          title: data.title,
          body: data.body,
          class_id: data.class_id || null,
          status: data.status
        };
        return postService.update(id, requestData);
      } else {
        // ✅ Pour la création, on utilise FormData pour les images
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('body', data.body);
        if (data.class_id) formData.append('class_id', data.class_id);
        
        // Ajouter les images
        data.images.forEach((image) => {
          formData.append('media[]', image);
        });
        
        return postService.create(formData);
      }
    },
    {
      successMessage: isEdit ? 'Post modifié avec succès' : 'Post créé avec succès',
      onSuccess: () => {
        navigate('/teacher/posts')
      }
    }
  )

  // Remplir le formulaire si édition
  useEffect(() => {
    if (postData?.data) {
      const post = postData.data
      setFormData({
        title: post.title || '',
        body: post.body || '',
        class_id: post.class_id?.toString() || '',
        status: post.status || 'draft'
      })
      setExistingMedia(post.media || [])
    }
  }, [postData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images par post')
      return
    }
    
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])
    setImages([...images, ...files])
  }

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Veuillez ajouter un titre')
      return
    }
    if (!formData.body.trim()) {
      toast.error('Veuillez ajouter un contenu')
      return
    }
    
    mutation.mutate({
      ...formData,
      images: images
    })
  }

  const handleSaveDraft = () => {
    mutation.mutate({
      ...formData,
      status: 'draft',
      images: images
    })
  }

  if (isEdit && postLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link to="/teacher/posts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {isEdit ? 'Modifier le post' : 'Nouveau post'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Partagez une information avec vos élèves et leurs parents
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre du post *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Sortie pédagogique du 15 mai"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
            required
          />
        </div>

        {/* Classe cible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Classe cible</label>
          <select
            name="class_id"
            value={formData.class_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
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
          <p className="text-xs text-gray-400 mt-1">
            Si vous sélectionnez une classe, seuls les parents de cette classe verront le post
          </p>
        </div>

        {/* Contenu */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du post *</label>
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            rows={8}
            placeholder="Écrivez votre message ici..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none resize-none"
            required
          />
        </div>

        {/* Prévisualisation des images */}
        {imagePreviews.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Images à ajouter</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone de fichiers joints */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition">
          <label htmlFor="file-upload" className="cursor-pointer block">
            <Image className="w-10 h-10 text-gray-400 mx-auto mb-2 hover:text-pink-400 transition" />
            <p className="text-sm text-gray-500">Cliquez pour ajouter des images</p>
            <p className="text-xs text-gray-400 mt-1">Images uniquement (max 5, 5MB chacune)</p>
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            id="file-upload"
            onChange={handleImageUpload}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <Link to="/teacher/posts" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
            Annuler
          </Link>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
            disabled={mutation.isPending}
          >
            <Save className="w-4 h-4" />
            Sauvegarder en brouillon
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:scale-105 transition flex items-center gap-2"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isEdit ? 'Modifier' : 'Publier et soumettre'}
          </button>
        </div>
      </form>

      {/* Note sur le processus d'approbation */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-xs text-amber-600">
          ⚠️ Note : Les posts sont soumis à l'approbation de l'administrateur avant publication.
          Vous pouvez suivre l'état de vos posts dans la liste "Mes Posts".
        </p>
      </div>
    </div>
  )
}