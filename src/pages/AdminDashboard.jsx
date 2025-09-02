import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import Map, { Marker, Popup } from 'react-map-gl'
import { 
  Users, AlertTriangle, CheckCircle, Calendar, 
  MapPin, Settings, Moon, Sun, Star, Image, Clock,
  TrendingUp, Activity, BarChart3, Bell, Send
} from 'lucide-react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const AdminDashboard = () => {
  const [stats, setStats] = useState({})
  const [reports, setReports] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [notifications, setNotifications] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    isGlobal: true
  })
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [mapViewport, setMapViewport] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 10
  })

  useEffect(() => {
    fetchAdminData()
  }, [])

  useEffect(() => {
    if (activeTab === 'map' && reports && reports.length > 0) {
      centerMapOnReports()
    }
  }, [activeTab, reports])

  const fetchAdminData = async () => {
    try {
      const [statsRes, reportsRes, campaignsRes, usersRes, postsRes, analyticsRes, notificationsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/reports'),
        axios.get('/api/admin/campaigns'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/posts'),
        axios.get('/api/admin/analytics'),
        axios.get('/api/notifications/admin/all')
      ])
      
      setStats(statsRes.data)
      setReports(reportsRes.data)
      setCampaigns(campaignsRes.data)
      setUsers(usersRes.data)
      setPosts(postsRes.data)
      setAnalytics(analyticsRes.data)
      setNotifications(notificationsRes.data)
      setError('')
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError(error.response?.data?.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const updateReportStatus = async (reportId, status) => {
    try {
      await axios.patch(`/api/admin/reports/${reportId}/status`, { status })
      fetchAdminData()
    } catch (error) {
      console.error('Error updating report status:', error)
    }
  }

  const toggleCampaignFeature = async (campaignId, isFeatured) => {
    try {
      await axios.patch(`/api/admin/campaigns/${campaignId}/feature`, { isFeatured })
      fetchAdminData()
    } catch (error) {
      console.error('Error updating campaign:', error)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/toggle-status`)
      fetchAdminData()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const updatePostStatus = async (postId, status) => {
    try {
      await axios.patch(`/api/admin/posts/${postId}/status`, { status })
      setPosts(posts.map(post => 
        post._id === postId ? { ...post, status } : post
      ))
    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }

  const deletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await axios.delete(`/api/admin/posts/${postId}`)
      setPosts(posts.filter(post => post._id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const sendNotification = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/notifications/admin/create', notificationForm)
      setNotificationForm({ title: '', message: '', type: 'announcement', isGlobal: true })
      fetchAdminData()
      alert('Notification sent successfully!')
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification')
    }
  }

  const centerMapOnReports = () => {
    if (reports && reports.length > 0) {
      const validReports = reports.filter(r => r.location?.latitude && r.location?.longitude)
      if (validReports.length > 0) {
        const avgLat = validReports.reduce((sum, r) => sum + r.location.latitude, 0) / validReports.length
        const avgLng = validReports.reduce((sum, r) => sum + r.location.longitude, 0) / validReports.length
        setMapViewport({
          latitude: avgLat,
          longitude: avgLng,
          zoom: 12
        })
      }
    }
  }

  const chartData = [
    { name: 'Potholes', value: reports.filter(r => r.type === 'pothole').length },
    { name: 'Garbage', value: reports.filter(r => r.type === 'garbage').length }
  ]

  const COLORS = ['#ef4444', '#22c55e']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Admin Panel</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={fetchAdminData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className="flex">
        <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-screen fixed flex flex-col`}>
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Admin Panel</h2>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'posts', label: 'Content Moderation', icon: Image },
                { id: 'map', label: 'Live Map', icon: MapPin },
                { id: 'reports', label: 'Reports', icon: AlertTriangle },
                { id: 'campaigns', label: 'Campaigns', icon: Calendar },
                { id: 'users', label: 'Users', icon: Users },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === id
                      ? 'bg-blue-600 text-white'
                      : darkMode
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
          

        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-8">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {[
                  { label: 'Total Reports', value: stats.totalReports, icon: AlertTriangle, color: 'blue' },
                  { label: 'Resolved Reports', value: stats.resolvedReports, icon: CheckCircle, color: 'green' },
                  { label: 'Active Campaigns', value: stats.activeCampaigns, icon: Calendar, color: 'purple' },
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'orange' },
                  { label: 'Total Posts', value: stats.totalPosts, icon: Image, color: 'pink' },
                  { label: 'Pending Posts', value: stats.pendingPosts, icon: Clock, color: 'yellow' }
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                        <p className="text-2xl font-bold">{value || 0}</p>
                      </div>
                      <Icon className={`h-8 w-8 text-${color}-500`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Report Types</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Monthly Reports</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[{ name: 'This Month', reports: reports.length }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="reports" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Live Reports Map</h1>
              
              <div className="h-96 rounded-2xl overflow-hidden border">
                <Map
                  {...mapViewport}
                  onMove={evt => setMapViewport(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {reports && reports.map((report) => (
                    <Marker
                      key={report._id}
                      latitude={report.location?.latitude || 0}
                      longitude={report.location?.longitude || 0}
                      anchor="bottom"
                      onClick={e => {
                        e.originalEvent.stopPropagation()
                        setSelectedReport(report)
                      }}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
                          report.status === 'resolved' ? 'bg-green-500' :
                          report.status === 'approved' ? 'bg-blue-500' :
                          report.status === 'rejected' ? 'bg-gray-500' :
                          report.type === 'pothole' ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                      />
                    </Marker>
                  ))}

                  {selectedReport && (
                    <Popup
                      latitude={selectedReport.location?.latitude || 0}
                      longitude={selectedReport.location?.longitude || 0}
                      anchor="top"
                      onClose={() => setSelectedReport(null)}
                      className="max-w-sm"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{selectedReport.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedReport.type === 'pothole' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {selectedReport.type}
                          </span>
                        </div>
                        
                        {selectedReport.image && (
                          <img
                            src={selectedReport.image}
                            alt={selectedReport.title}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        
                        <p className="text-gray-600 mb-3">{selectedReport.description || 'No description'}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>By {selectedReport.reportedBy?.name || 'Unknown'}</span>
                          <span>{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {['approved', 'rejected', 'resolved'].map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                updateReportStatus(selectedReport._id, status)
                                setSelectedReport(null)
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                selectedReport.status === status
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </Popup>
                  )}
                </Map>
              </div>
              
              {/* Map Legend */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-2xl shadow-sm`}>
                <h4 className="font-semibold mb-3">Map Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-sm">Approved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-sm">Resolved</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                    <span className="text-sm">Rejected</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              
              {/* Engagement Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Likes', value: analytics.engagement?.totalLikes, icon: Activity, color: 'red' },
                  { label: 'Total Comments', value: analytics.engagement?.totalComments, icon: Users, color: 'blue' },
                  { label: 'New Users (7d)', value: analytics.engagement?.recentUsers, icon: Users, color: 'green' },
                  { label: 'New Posts (7d)', value: analytics.engagement?.recentPosts, icon: Image, color: 'purple' }
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                        <p className="text-2xl font-bold">{value || 0}</p>
                      </div>
                      <Icon className={`h-8 w-8 text-${color}-500`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Monthly Reports Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.charts?.monthlyReports || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="reports" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Monthly Posts Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.charts?.monthlyPosts || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="posts" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Users */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                <h3 className="text-lg font-semibold mb-4">Top Active Users</h3>
                <div className="space-y-4">
                  {analytics.topUsers?.map((user, index) => (
                    <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{user.postCount} posts</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.totalLikes} likes</p>
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Notification Center</h1>
              
              {/* Send Notification Form */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                <h3 className="text-lg font-semibold mb-4">Send Announcement</h3>
                <form onSubmit={sendNotification} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Notification title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Notification message"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationForm.isGlobal}
                        onChange={(e) => setNotificationForm({...notificationForm, isGlobal: e.target.checked})}
                        className="mr-2"
                      />
                      Send to all users
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send Notification</span>
                  </button>
                </form>
              </div>

              {/* Notification History */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                <h3 className="text-lg font-semibold mb-4">Notification History</h3>
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification._id} className={`border rounded-lg p-4 ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{notification.message}</p>
                          <div className={`flex items-center space-x-4 mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>By {notification.createdBy?.name}</span>
                            <span>•</span>
                            <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{notification.readBy.length} read</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          notification.type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'report_update' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {notification.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Content Moderation</h1>
              
              <div className="space-y-4">
                {posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                      <div className="flex items-start space-x-4">
                        <img 
                          src={post.image} 
                          alt={post.caption}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold">{post.user.name}</p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.user.email}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              post.status === 'approved' ? 'bg-green-100 text-green-800' :
                              post.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{post.caption}</p>
                          {post.campaign && (
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Campaign: {post.campaign.title}</p>
                          )}
                          <div className={`flex items-center space-x-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>{post.likes.length} likes</span>
                            <span>•</span>
                            <span>{post.comments.length} comments</span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {post.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updatePostStatus(post._id, 'approved')}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updatePostStatus(post._id, 'rejected')}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deletePost(post._id)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                    <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Posts Found</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No posts have been submitted yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Manage Reports</h1>
              
              <div className="space-y-4">
                {reports && reports.length > 0 ? (
                  reports.map((report) => (
                    <div key={report._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h3 className="text-lg font-semibold">{report.title || 'Untitled Report'}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              report.type === 'pothole' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {report.type}
                            </span>
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
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                            {report.description || 'No description provided'}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            By {report.reportedBy?.name || 'Unknown'} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          {['approved', 'rejected', 'resolved'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateReportStatus(report._id, status)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                report.status === status
                                  ? 'bg-blue-600 text-white'
                                  : darkMode
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                    <p className="text-gray-600">No reports have been submitted yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'campaigns' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Manage Campaigns</h1>
              
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.title}</h3>
                          {campaign.isFeatured && (
                            <Star className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{campaign.description}</p>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} space-y-1`}>
                          <p>By {campaign.createdBy.name} • {campaign.participants.length} participants</p>
                          <p>{new Date(campaign.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleCampaignFeature(campaign._id, !campaign.isFeatured)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          campaign.isFeatured
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {campaign.isFeatured ? 'Unfeature' : 'Feature'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Manage Users</h1>
              
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.email}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => toggleUserStatus(user._id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            user.isActive
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard