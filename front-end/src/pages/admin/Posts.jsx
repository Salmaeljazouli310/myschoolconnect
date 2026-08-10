import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PostList from '../../components/Posts/PostList'

export default function Posts() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            Modération des Posts
          </h2>
          <p className="text-sm text-rose-500 mt-1">
            Approuvez ou rejetez les posts des enseignants avant publication.
          </p>
        </div>
        
        <button
          onClick={() => navigate('/admin/posts/new')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nouvelle publication
        </button>
      </div>
      
      <PostList />
    </div>
  )
}