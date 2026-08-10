import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { postService, classService } from '../../services/auth'
import { Image, Send, ArrowLeft, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PostForm() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [classId, setClassId] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])

  const { data: classesData } = useApiQuery(['admin-classes'], () => classService.getAll({ per_page: 100 }))
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
      
      const response = await postService.create(formData)
      return response
    },
    {
      successMessage: 'Post créé avec succès !',
      onSuccess: () => {
        setTimeout(() => navigate('/admin/posts'), 2000)
      }
    }
  )

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
    if (!title.trim()) {
      toast.error('Veuillez ajouter un titre')
      return
    }
    if (!body.trim()) {
      toast.error('Veuillez ajouter un contenu')
      return
    }
    createPostMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      class_id: classId,
      images: images
    })
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/posts')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Créer une nouvelle publication
          </h1>
          <p className="text-gray-500 text-sm">Partagez des annonces, photos ou informations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Prévisualisation des images */}
          {imagePreviews.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">{imagePreviews.length} image(s)</h3>
                <label className="text-xs text-pink-500 cursor-pointer hover:text-pink-600">
                  + Ajouter plus
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-28 rounded-xl object-cover shadow-sm" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Titre */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la publication"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
            />
            
            {/* Contenu */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Contenu de la publication..."
              rows="6"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition resize-none"
            />
            
            {/* Sélection de la classe */}
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none transition"
            >
              <option value="">📢 Toute l'école</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>📚 {cls.name}</option>
              ))}
            </select>

            {/* Zone d'upload d'images */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-pink-300 transition-colors">
              <label htmlFor="image-upload" className="cursor-pointer block">
                <Image className="w-10 h-10 text-gray-400 mx-auto mb-2 hover:text-pink-400 transition" />
                <p className="text-sm text-gray-500">Cliquez pour ajouter des images (max 5)</p>
                <p className="text-xs text-gray-400 mt-1">Formats acceptés: JPG, PNG, GIF (max 5MB)</p>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/posts')}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={createPostMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
          >
            {createPostMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Publication...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Publier
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}