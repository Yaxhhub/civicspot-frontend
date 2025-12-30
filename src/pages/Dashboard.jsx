import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import { Plus, MapPin, Calendar, AlertTriangle, Users, Camera, Trash2, Heart, MessageCircle } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const [reportsRes, campaignsRes, postsRes] = await Promise.all([
        axios.get('/api/reports/my-reports'),
        axios.get('/api/campaigns'),
        axios.get('/api/posts/my-posts')
      ])
      setReports(reportsRes.data)
      setCampaigns(campaignsRes.data.filter(c => c.participants.some(p => p._id === user.id)))
      setPosts(postsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await axios.delete(`/api/posts/${postId}`)
      setPosts(posts.filter(p => p._id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Here's your civic engagement overview</p>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link
            to="/report"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12" />
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">Report Issue</h3>
                <p className="opacity-90 text-sm sm:text-base">Found a pothole or garbage?</p>
              </div>
            </div>
          </Link>

          <Link
            to="/create-campaign"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Plus className="h-8 w-8 sm:h-12 sm:w-12" />
              <div>
                <h3 className="text-lg sm:text-xl font-semibold">Create Campaign</h3>
                <p className="opacity-90 text-sm sm:text-base">Organize a cleanup event</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/70 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Reports</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">{reports.length}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Campaigns</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">{campaigns.length}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-xl">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Resolved</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  {reports.filter(r => r.status === 'resolved').length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-xl">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-2 sm:mb-0">
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Posts</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{posts.length}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-xl">
                <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Recent Reports</h2>
            {reports.length > 0 ? (
              <div className="space-y-4">
                {reports.slice(0, 3).map((report) => (
                  <div key={report._id} className="border-l-4 border-primary-500 pl-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'resolved' 
                          ? 'bg-green-100 text-green-800'
                          : report.status === 'approved'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reports yet</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Campaigns</h2>
            {campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign._id} className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{campaign.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(campaign.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{campaign.participants.length} participants</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No campaigns joined yet</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">My Posts</h2>
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.slice(0, 3).map((post) => (
                  <div key={post._id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <img 
                            src={post.image} 
                            alt={post.caption}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {post.caption}
                            </p>
                            {post.campaign && (
                              <p className="text-xs text-gray-500">at {post.campaign.title}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{post.likes.length}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{post.comments.length}</span>
                          </div>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deletePost(post._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {posts.length > 3 && (
                  <Link 
                    to="/explore" 
                    className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all posts
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No posts shared yet</p>
                <Link 
                  to="/explore" 
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Share your first post
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard