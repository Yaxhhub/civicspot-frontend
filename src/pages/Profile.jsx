import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { Camera, Edit2, Save, X, Trash2, Heart, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user, setUser } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: ''
  })
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePreview, setProfilePreview] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || ''
      })
      setProfilePreview(user.profilePicture || '')
    }
    fetchUserPosts()
  }, [user])

  const fetchUserPosts = async () => {
    try {
      const response = await axios.get('/api/posts/my-posts')
      setPosts(response.data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => setProfilePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      if (formData.username) formDataToSend.append('username', formData.username)
      if (profilePicture) formDataToSend.append('profilePicture', profilePicture)

      const response = await axios.put('/api/auth/profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setUser(response.data.user)
      setEditing(false)
      setProfilePicture(null)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update profile')
    }
  }

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await axios.delete(`/api/posts/${postId}`)
      setPosts(posts.filter(p => p._id !== postId))
    } catch (error) {
      alert('Failed to delete post')
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
      <div className="max-w-4xl mx-auto px-2 sm:px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white text-xl sm:text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
              {editing && (
                <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-primary-500 focus:outline-none w-full"
                    placeholder="Your name"
                  />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="text-gray-600 bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary-500 w-full"
                    placeholder="@username (optional)"
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user?.name}</h1>
                  {user?.username && (
                    <p className="text-gray-600">@{user.username}</p>
                  )}
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">{user?.email}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setProfilePicture(null)
                      setProfilePreview(user?.profilePicture || '')
                      setFormData({
                        name: user?.name || '',
                        username: user?.username || ''
                      })
                    }}
                    className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              <p className="text-gray-600">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {posts.reduce((sum, post) => sum + post.likes.length, 0)}
              </p>
              <p className="text-gray-600">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {posts.reduce((sum, post) => sum + post.comments.length, 0)}
              </p>
              <p className="text-gray-600">Comments</p>
            </div>
          </div>
        </motion.div>

        {/* Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          {posts.map((post) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg sm:rounded-2xl shadow-lg overflow-hidden group relative"
            >
              <div className="aspect-square">
                <img
                  src={post.image}
                  alt={post.caption}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-4 text-white">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-5 w-5" />
                    <span>{post.likes.length}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments.length}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => deletePost(post._id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="p-2 sm:p-4">
                <p className="text-gray-900 text-xs sm:text-sm line-clamp-2">{post.caption}</p>
                {post.campaign && (
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">at {post.campaign.title}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Share your first post to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile