import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { postService, classService } from '../../services/auth'
import { Image, Send, Trash2, ArrowLeft, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PostForm({ isEdit = false, initialData = null }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initialData?.title || '')
  const [body, setBody] = useState(initialData?.body || '')
  const [classId, setClassId] = useState(initialData?.class_id || '')
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState(initialData?.media || [])

  const { data: classesData } = useApiQuery(['classes'], () => classService.getAll({ per_page: 100 }))
  const classes = classesData?.data?.data || []

  const createPostMutation = useApiMutation(
    async (data) => {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('body', data.body)
      if (data.class_id) formData.append('class_id', data.class_id)
      
      data.images.forEach((image) => {
        formData.append('media[]', image)
      })
      
      const response = await postService.store(formData)
      return response
    },
    {
      successMessage: 'Post créé avec succès !',
      onSuccess: () => {
        setTimeout(() => navigate(-1), 2000)
      }
    }
  )

  const updatePostMutation = useApiMutation(
    async (data) => {
      const response = await postService.update(initialData.id, {
        title: data.title,
        body: data.body,
        class_id: data.class_id
      })
      return response
    },
    {
      successMessage: 'Post modifié avec succès !',
      onSuccess: () => {
        setTimeout(() => navigate(-1), 2000)
      }
    }
  )

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images par post')
      return
    }
    setImages([...images, ...files])
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageId) => {
    try {
      await postService.deleteMedia(initialData.id, imageId)
      setExistingImages(existingImages.filter(img => img.id !== imageId))
      toast.success('Image supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Veuillez ajouter un titre')
      return
    }
    
    if (!body.trim()) {
      toast.error('Veuillez ajouter un contenu')
      return
    }
    
    if (isEdit) {
      updatePostMutation.mutate({
        title: title.trim(),
        body: body.trim(),
        class_id: classId
      })
    } else {
      createPostMutation.mutate({
        title: title.trim(),
        body: body.trim(),
        class_id: classId,
        images: images
      })
    }
  }

  const isPending = createPostMutation.isPending || updatePostMutation.isPending

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Modifier la publication' : 'Créer une nouvelle publication'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEdit ? 'Modifiez les informations de votre post' : 'Partagez des annonces, photos ou informations'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Images existantes (pour édition) */}
          {isEdit && existingImages.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-pastel-blue/10 to-pastel-lavender/10 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Images actuelles</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img 
                      src={image.url} 
                      alt=""
                      className="w-full h-28 rounded-xl object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles images à uploader */}
          {images.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-pastel-blue/10 to-pastel-lavender/10 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">
                  {images.length} nouvelle{images.length > 1 ? 's' : ''} image{images.length > 1 ? 's' : ''}
                </h3>
                <label className="text-xs text-pastel-blue cursor-pointer hover:underline">
                  + Ajouter plus
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="hidden" 
                    onChange={handleImageUpload} 
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Aperçu ${index + 1}`}
                      className="w-full h-28 rounded-xl object-cover border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire */}
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Sortie scolaire au parc..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pastel-blue focus:ring-2 focus:ring-pastel-blue/20 outline-none transition-all"
                maxLength="100"
              />
              <p className="text-xs text-gray-400 mt-1">{title.length}/100</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenu <span className="text-red-500">*</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Détails de l'annonce..."
                rows="6"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pastel-blue focus:ring-2 focus:ring-pastel-blue/20 outline-none transition-all resize-none"
                maxLength="2000"
              />
              <p className="text-xs text-gray-400 mt-1">{body.length}/2000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diffuser à
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pastel-blue focus:ring-2 focus:ring-pastel-blue/20 outline-none transition-all bg-white"
              >
                <option value="">📢 Toute l'école</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    📚 {cls.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {classId ? 'Seule la classe sélectionnée verra ce post' : 'Tous les parents et enseignants verront ce post'}
              </p>
            </div>

            {/* Upload d'images (uniquement pour création) */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Images (optionnel)
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-pastel-blue transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer block">
                    <Image className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cliquez pour ajouter des images</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (max 5 images)</p>
                  </label>
                </div>
              </div>
            )}

            {/* Ajouter des images en mode édition */}
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajouter des images
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-pastel-blue transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload-edit"
                  />
                  <label htmlFor="image-upload-edit" className="cursor-pointer block">
                    <Image className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Cliquez pour ajouter des images</p>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pastel-blue to-pastel-lavender text-white font-medium hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEdit ? 'Modification...' : 'Publication...'}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isEdit ? 'Modifier' : 'Publier'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}