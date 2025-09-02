import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { Heart, MessageCircle, Camera, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Explore = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/posts')
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId) => {
    if (!user) return
    
    try {
      const response = await axios.post(`/api/posts/${postId}/like`)
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, likes: response.data.liked 
              ? [...post.likes, user._id || user.id] 
              : post.likes.filter(id => id !== user._id && id !== user.id) }
          : post
      ))
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleComment = async (postId, text) => {
    if (!user || !text.trim()) return
    
    try {
      const response = await axios.post(`/api/posts/${postId}/comment`, { text })
      setPosts(posts.map(post => 
        post._id === postId 
          ? { ...post, comments: [...post.comments, response.data] }
          : post
      ))
    } catch (error) {
      console.error('Error commenting:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore</h1>
          {user && (
            <button
              onClick={() => {
                console.log('Share button clicked')
                setShowCreatePost(true)
              }}
              className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-1 sm:space-x-2 hover:bg-primary-700 text-sm sm:text-base"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              user={user}
              onLike={handleLike}
              onComment={handleComment}
            />
          ))}
        </div>

        {showCreatePost && (
          <CreatePostModal 
            onClose={() => {
              console.log('Closing modal')
              setShowCreatePost(false)
            }}
            onPostCreated={fetchPosts}
          />
        )}
        
        {/* Debug info */}
        <div className="text-xs text-gray-500 mt-4">
          User: {user ? user.name : 'Not logged in'} | Modal: {showCreatePost ? 'Open' : 'Closed'}
        </div>
      </div>
    </div>
  )
}

const PostCard = ({ post, user, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const isLiked = user && (post.likes.includes(user._id) || post.likes.includes(user.id))

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    onComment(post._id, commentText)
    setCommentText('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
    >
      <div className="p-3 sm:p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm sm:text-base">
              {post.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">{post.user.name}</h3>
            {post.campaign && (
              <p className="text-xs sm:text-sm text-gray-500">at {post.campaign.title}</p>
            )}
          </div>
        </div>
      </div>

      <img 
        src={post.image} 
        alt={post.caption}
        className="w-full h-64 sm:h-96 object-cover"
        onError={(e) => {
          console.log('Image failed to load:', post.image)
          e.target.src = 'https://picsum.photos/400/300?random=2'
        }}
        onLoad={() => console.log('Image loaded successfully:', post.image)}
      />

      <div className="p-3 sm:p-4">
        <div className="flex items-center space-x-4 mb-3">
          <button
            onClick={() => onLike(post._id)}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm sm:text-base">{post.likes.length}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-gray-600"
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-base">{post.comments.length}</span>
          </button>
        </div>

        <p className="text-gray-900 mb-2 text-sm sm:text-base">
          <span className="font-semibold">{post.user.name}</span> {post.caption}
        </p>

        {showComments && (
          <div className="space-y-2 mb-3">
            {post.comments.map((comment, index) => (
              <div key={index} className="text-xs sm:text-sm">
                <span className="font-semibold">{comment.user.name}</span>{' '}
                <span className="text-gray-700">{comment.text}</span>
              </div>
            ))}
          </div>
        )}

        {user && (
          <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="text-primary-600 disabled:text-gray-400 p-1"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </form>
        )}
      </div>
    </motion.div>
  )
}

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [caption, setCaption] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns')
      setCampaigns(response.data)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    console.log('File selected:', file)
    if (file) {
      setImage(file)
      console.log('Image state set to:', file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!caption.trim()) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('caption', caption)
      if (selectedCampaign) formData.append('campaignId', selectedCampaign)
      if (image) formData.append('image', image)

      console.log('Sending FormData with image:', !!image)
      console.log('Image file:', image)
      
      // Log FormData contents
      for (let [key, value] of formData.entries()) {
        console.log('FormData entry:', key, value)
      }

      await axios.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      onPostCreated()
      onClose()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
      >
        <h2 className="text-xl font-bold mb-4">Share Your Experience</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded mb-2" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null)
                      setImagePreview('')
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <label className="cursor-pointer text-primary-600 hover:text-primary-700">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Or share without a photo</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Share your story..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Campaign (Optional)
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a campaign</option>
              {campaigns.map(campaign => (
                <option key={campaign._id} value={campaign._id}>
                  {campaign.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !caption.trim()}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default Explore