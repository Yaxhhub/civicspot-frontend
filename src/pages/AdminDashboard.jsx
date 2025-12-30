import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import Map, { Marker, Popup } from 'react-map-gl'
import { 
  Users, AlertTriangle, CheckCircle, Calendar, 
  MapPin, Settings, Moon, Sun, Star, Image, Clock,
  TrendingUp, Activity, BarChart3, Bell, Send, Trash2,
  Filter, Search, Download, Eye, MoreVertical, Menu, Navigation
} from 'lucide-react'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const AdminDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({})
  const [reportAddresses, setReportAddresses] = useState({})
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
  const [rewardsData, setRewardsData] = useState({})
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportFilters, setReportFilters] = useState({ type: '', priority: '', search: '' })
  const [selectedReportDetails, setSelectedReportDetails] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [mapViewport, setMapViewport] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 10
  })

  useEffect(() => {
    if (user) {
      fetchAdminData()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'map' && reports && reports.length > 0) {
      setTimeout(() => centerMapOnReports(), 100)
    }
  }, [activeTab, reports])

  const fetchAdminData = async () => {
    try {
      const basicRequests = [
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/reports'),
        axios.get('/api/admin/campaigns'),
        axios.get('/api/admin/posts'),
        axios.get('/api/admin/analytics')
      ]
      
      const [statsRes, reportsRes, campaignsRes, postsRes, analyticsRes] = await Promise.all(basicRequests)
      
      setStats(statsRes.data)
      setReports(reportsRes.data)
      setCampaigns(campaignsRes.data)
      setPosts(postsRes.data)
      setAnalytics(analyticsRes.data)
      
      // Fetch addresses for reports with coordinates
      const addressPromises = {}
      reportsRes.data.forEach(report => {
        if (report.location?.latitude && report.location?.longitude && 
            (!report.location.address || report.location.address === 'Selected Location' || report.location.address === 'Current Location')) {
          addressPromises[report._id] = fetchAddressFromCoordinates(
            report.location.latitude, 
            report.location.longitude
          )
        }
      })
      
      if (Object.keys(addressPromises).length > 0) {
        const addresses = await Promise.allSettled(
          Object.entries(addressPromises).map(async ([reportId, promise]) => {
            const address = await promise
            return { reportId, address }
          })
        )
        
        const addressMap = {}
        addresses.forEach(result => {
          if (result.status === 'fulfilled') {
            addressMap[result.value.reportId] = result.value.address
          }
        })
        setReportAddresses(addressMap)
      }
      
      // Try to fetch optional data based on user permissions
      const optionalRequests = []
      
      // Only super admins can access users endpoint
      if (user?.adminType === 'super') {
        optionalRequests.push(axios.get('/api/admin/users'))
      }
      
      // Try to get notifications for all admins
      optionalRequests.push(axios.get('/api/admin/notifications'))
      
      if (optionalRequests.length > 0) {
        const optionalResults = await Promise.allSettled(optionalRequests)
        
        let resultIndex = 0
        
        // Handle users result (only if super admin)
        if (user?.adminType === 'super') {
          if (optionalResults[resultIndex]?.status === 'fulfilled') {
            setUsers(optionalResults[resultIndex].value.data)
          } else {
            setUsers([])
          }
          resultIndex++
        } else {
          setUsers([])
        }
        
        // Handle notifications result
        if (optionalResults[resultIndex]?.status === 'fulfilled') {
          setNotifications(optionalResults[resultIndex].value.data)
        } else {
          setNotifications([])
        }
      } else {
        setUsers([])
        setNotifications([])
      }
      
      setError('')
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError(error.response?.data?.message || 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/reports/${reportId}`)
        setReports(reports.filter(report => report._id !== reportId))
      } catch (error) {
        console.error('Error deleting report:', error)
        alert('Failed to delete report')
      }
    }
  }

  const updateReportStatus = async (reportId, status) => {
    try {
      await axios.patch(`/api/admin/reports/${reportId}/status`, { status })
      setReports(reports.map(report => 
        report._id === reportId ? { ...report, status } : report
      ))
    } catch (error) {
      console.error('Error updating report status:', error)
    }
  }

  const exportReports = () => {
    const filteredReports = reports.filter(report => {
      const matchesSearch = !reportFilters.search || 
        report.title?.toLowerCase().includes(reportFilters.search.toLowerCase()) ||
        report.description?.toLowerCase().includes(reportFilters.search.toLowerCase()) ||
        report.reportedBy?.name?.toLowerCase().includes(reportFilters.search.toLowerCase())
      
      const matchesType = !reportFilters.type || report.type === reportFilters.type
      const matchesPriority = !reportFilters.priority || report.priority === reportFilters.priority
      
      return matchesSearch && matchesType && matchesPriority
    })

    const csvContent = [
      ['Title', 'Type', 'Status', 'Priority', 'Reporter', 'Date', 'Location', 'Description'].join(','),
      ...filteredReports.map(report => [
        `"${report.title || ''}",`,
        `"${report.type || ''}",`,
        `"${report.status || ''}",`,
        `"${report.priority || ''}",`,
        `"${report.reportedBy?.name || ''}",`,
        `"${new Date(report.createdAt).toLocaleDateString()}",`,
        `"${reportAddresses[report._id] || report.location?.address || ''}",`,
        `"${report.description || ''}"`
      ].join(''))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reports-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi`
      )
      const data = await response.json()
      return data.features[0]?.place_name || `${lat}, ${lng}`
    } catch (error) {
      console.error('Error fetching address:', error)
      return `${lat}, ${lng}`
    }
  }

  const centerMapOnReports = () => {
    if (reports && reports.length > 0) {
      const validReports = reports.filter(r => r.location?.latitude && r.location?.longitude)
      if (validReports.length > 0) {
        const gridSize = 0.01
        const clusters = {}
        
        validReports.forEach(report => {
          const gridLat = Math.floor(report.location.latitude / gridSize) * gridSize
          const gridLng = Math.floor(report.location.longitude / gridSize) * gridSize
          const key = `${gridLat},${gridLng}`
          
          if (!clusters[key]) {
            clusters[key] = { lat: gridLat, lng: gridLng, count: 0, reports: [] }
          }
          clusters[key].count++
          clusters[key].reports.push(report)
        })
        
        const maxCluster = Object.values(clusters).reduce((max, cluster) => 
          cluster.count > max.count ? cluster : max
        )
        
        setMapViewport({
          latitude: maxCluster.lat + gridSize/2,
          longitude: maxCluster.lng + gridSize/2,
          zoom: 13
        })
      }
    }
  }

  const chartData = useMemo(() => {
    const types = ['pothole', 'garbage', 'streetlight', 'drainage', 'graffiti', 'traffic', 'sidewalk', 'park', 'noise', 'water', 'other']
    return types.map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: reports.filter(r => r.type === type).length
    })).filter(item => item.value > 0)
  }, [reports])

  const COLORS = ['#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f97316', '#6366f1', '#14b8a6', '#64748b']

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
      <div className="flex">
        <div className={`w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg h-screen fixed flex flex-col z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 overflow-y-auto`}>
          <div className="flex-1 flex flex-col p-6">
            <div className="flex flex-col mb-8">
              <div className="flex items-center justify-between mb-2">
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
              {stats.department && (
                <div className="text-xs text-blue-600 font-medium">
                  {stats.department === 'All Departments' ? '🔧 Super Admin' : `📋 ${stats.department}`}
                </div>
              )}
            </div>
            <nav className="space-y-2 flex-1 overflow-y-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'reports', label: 'Reports', icon: AlertTriangle },
                { id: 'map', label: 'Live Map', icon: MapPin },
                { id: 'campaigns', label: 'Campaigns', icon: Calendar },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'posts', label: 'Moderation', icon: Image },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                { id: 'rewards', label: 'Rewards', icon: Star },
                ...(user?.adminType === 'super' ? [{ id: 'users', label: 'Users', icon: Users }] : []),
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id)
                    setMobileMenuOpen(false)
                  }}
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

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        <div className="lg:ml-64 flex-1 p-4 lg:p-8">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Dashboard Overview</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Reports</p>
                      <p className="text-2xl font-bold">{stats.totalReports || 0}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resolved</p>
                      <p className="text-2xl font-bold">{stats.resolvedReports || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Campaigns</p>
                      <p className="text-2xl font-bold">{stats.activeCampaigns || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                      <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                </div>
              </div>
              
              {chartData.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Reports by Type</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'map' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Live Reports Map</h1>
                <div className="text-sm text-gray-600">
                  {reports.filter(r => r.location?.latitude && r.location?.longitude).length} of {reports.length} reports have location data
                </div>
              </div>
              
              {reports.filter(r => r.location?.latitude && r.location?.longitude).length === 0 ? (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reports with Location Data</h3>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reports need location data to be displayed on the map.</p>
                </div>
              ) : (
                <div className="h-96 rounded-2xl overflow-hidden border relative">
                  <Map
                    {...mapViewport}
                    onMove={evt => setMapViewport(evt.viewState)}
                    style={{ width: '100%', height: '100%' }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    mapboxAccessToken={MAPBOX_TOKEN}
                  >
                    {reports && reports
                      .filter(report => report.location?.latitude && report.location?.longitude)
                      .map((report) => (
                      <Marker
                        key={report._id}
                        latitude={parseFloat(report.location.latitude)}
                        longitude={parseFloat(report.location.longitude)}
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

                    {selectedReport && selectedReport.location?.latitude && selectedReport.location?.longitude && (
                      <Popup
                        latitude={parseFloat(selectedReport.location.latitude)}
                        longitude={parseFloat(selectedReport.location.longitude)}
                        anchor="top"
                        onClose={() => setSelectedReport(null)}
                        style={{ maxWidth: 'none' }}
                      >
                        <div className="p-3 overflow-hidden" style={{ width: '300px', minWidth: '300px' }}>
                          <div className="mb-2">
                            <h3 className="font-semibold text-sm text-gray-900 truncate mb-2">{selectedReport.title}</h3>
                            
                            <div className="flex gap-3 mb-2">
                              {selectedReport.image && (
                                <img
                                  src={selectedReport.image}
                                  alt={selectedReport.title}
                                  className="w-40 h-32 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex flex-col space-y-1 flex-shrink-0">
                                <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                  selectedReport.type === 'pothole' ? 'bg-red-100 text-red-700' :
                                  selectedReport.type === 'garbage' ? 'bg-green-100 text-green-700' :
                                  selectedReport.type === 'streetlight' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {selectedReport.type}
                                </span>
                                {selectedReport.priority && (
                                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                    selectedReport.priority === 'urgent' ? 'bg-red-500 text-white' :
                                    selectedReport.priority === 'high' ? 'bg-orange-500 text-white' :
                                    'bg-yellow-500 text-white'
                                  }`}>
                                    {selectedReport.priority}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="overflow-hidden">
                              <p className="text-gray-600 text-xs mb-2 break-words overflow-hidden line-clamp-2">
                                {selectedReport.description?.slice(0, 80) || 'No description'}{selectedReport.description?.length > 80 ? '...' : ''}
                              </p>
                              <div className="text-xs text-gray-500 space-y-0.5">
                                <div className="truncate">By {selectedReport.reportedBy?.name || 'Unknown'}</div>
                                <div className="truncate">{new Date(selectedReport.createdAt).toLocaleDateString()}</div>
                                {selectedReport.assignedDepartment && (
                                  <div className="text-indigo-600 truncate">{selectedReport.assignedDepartment.name}</div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1 mb-2">
                            <button
                              onClick={() => {
                                setActiveTab('reports')
                                setSelectedReportDetails(selectedReport)
                                setSelectedReport(null)
                              }}
                              className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              View Full Report
                            </button>
                          </div>
                          <div className="flex gap-1">
                            {['approved', 'rejected', 'resolved'].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  updateReportStatus(selectedReport._id, status)
                                  setSelectedReport(null)
                                }}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
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
              )}
              
              {reports.filter(r => r.location?.latitude && r.location?.longitude).length > 0 && (
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
              )}
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Manage Reports</h1>
                  <p className="text-gray-600 mt-1">Review, filter, and manage all civic reports</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={exportReports}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={reportFilters.search}
                      onChange={(e) => setReportFilters({...reportFilters, search: e.target.value})}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                <select
                  value={reportFilters.type}
                  onChange={(e) => setReportFilters({...reportFilters, type: e.target.value})}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Types</option>
                  <option value="pothole">Pothole</option>
                  <option value="garbage">Garbage</option>
                  <option value="streetlight">Street Light</option>
                  <option value="drainage">Drainage</option>
                  <option value="graffiti">Graffiti</option>
                  <option value="traffic">Traffic</option>
                  <option value="sidewalk">Sidewalk</option>
                  <option value="park">Park</option>
                  <option value="noise">Noise</option>
                  <option value="water">Water</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={reportFilters.priority}
                  onChange={(e) => setReportFilters({...reportFilters, priority: e.target.value})}
                  className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="space-y-4">
                {reports && reports.length > 0 ? (
                  reports
                    .filter(report => {
                      const matchesSearch = !reportFilters.search || 
                        report.title?.toLowerCase().includes(reportFilters.search.toLowerCase()) ||
                        report.description?.toLowerCase().includes(reportFilters.search.toLowerCase()) ||
                        report.reportedBy?.name?.toLowerCase().includes(reportFilters.search.toLowerCase())
                      
                      const matchesType = !reportFilters.type || report.type === reportFilters.type
                      const matchesPriority = !reportFilters.priority || report.priority === reportFilters.priority
                      
                      return matchesSearch && matchesType && matchesPriority
                    })
                    .map((report) => (
                    <motion.div 
                      key={report._id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${darkMode ? 'bg-gray-800/50' : 'bg-white/70'} backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 group`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                report.priority === 'urgent' ? 'bg-red-500 animate-pulse' :
                                report.priority === 'high' ? 'bg-orange-500' :
                                report.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></div>
                              <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors">{report.title || 'Untitled Report'}</h3>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 mb-3 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                              report.type === 'pothole' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                              report.type === 'garbage' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                              report.type === 'streetlight' ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' :
                              report.type === 'drainage' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                              report.type === 'traffic' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' :
                              'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                            }`}>
                              {report.type.toUpperCase()}
                            </span>
                            {report.assignedDepartment && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 shadow-sm">
                                {report.assignedDepartment.name}
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                              report.status === 'resolved' 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                                : report.status === 'approved'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
                            }`}>
                              {report.status.toUpperCase()}
                            </span>
                          </div>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                            {report.description || 'No description provided'}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            By {report.reportedBy?.name || 'Unknown'} • {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button 
                            onClick={() => setSelectedReportDetails(report)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button 
                            onClick={() => deleteReport(report._id)}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2 shadow-lg text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                          <button 
                            onClick={() => {
                              console.log('Report location:', report.location)
                              if (report.location?.latitude && report.location?.longitude) {
                                setActiveTab('map')
                                setMapViewport({
                                  latitude: parseFloat(report.location.latitude),
                                  longitude: parseFloat(report.location.longitude),
                                  zoom: 16
                                })
                                setTimeout(() => setSelectedReport(report), 500)
                              } else {
                                alert('This report does not have location data')
                              }
                            }}
                            className={`px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 shadow-lg text-sm ${
                              report.location?.latitude && report.location?.longitude 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            }`}
                            disabled={!report.location?.latitude || !report.location?.longitude}
                          >
                            <MapPin className="h-4 w-4" />
                            <span>View on Map</span>
                          </button>
                          {['approved', 'rejected', 'resolved'].map((status) => (
                            <button
                              key={status}
                              onClick={() => updateReportStatus(report._id, status)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg ${
                                report.status === status
                                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white transform scale-105'
                                  : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200'
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                    <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No Reports Found</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No reports have been submitted yet.</p>
                  </div>
                )}
              </div>
              
              {selectedReportDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedReportDetails.title}</h2>
                        <button 
                          onClick={() => setSelectedReportDetails(null)}
                          className={`${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} text-2xl`}
                        >
                          ×
                        </button>
                      </div>
                      
                      {selectedReportDetails.image && (
                        <img 
                          src={selectedReportDetails.image} 
                          alt={selectedReportDetails.title}
                          className="w-full h-64 object-cover rounded-lg mb-4"
                        />
                      )}
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Description</h3>
                          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedReportDetails.description || 'No description provided'}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Type</h3>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>{selectedReportDetails.type}</p>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Priority</h3>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>{selectedReportDetails.priority || 'Medium'}</p>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Status</h3>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>{selectedReportDetails.status}</p>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Reported By</h3>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedReportDetails.reportedBy?.name || 'Unknown'}</p>
                          </div>
                        </div>
                        
                        {selectedReportDetails.location && (
                          <div>
                            <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Location</h3>
                            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {reportAddresses[selectedReportDetails._id] || 
                               selectedReportDetails.location.address || 
                               `${selectedReportDetails.location.latitude}, ${selectedReportDetails.location.longitude}`}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                              📍 {selectedReportDetails.location.latitude}, {selectedReportDetails.location.longitude}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>Reported On</h3>
                          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{new Date(selectedReportDetails.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'users' && user?.adminType === 'super' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">User Management</h1>
              
              <div className="space-y-4">
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <div key={user._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Points: {user.points || 0}</p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No users have registered yet.</p>
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
              <h1 className="text-3xl font-bold">Campaign Management</h1>
              
              <div className="space-y-4">
                {campaigns && campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <div key={campaign._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{campaign.title}</h3>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>{campaign.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              📅 {new Date(campaign.date).toLocaleDateString()}
                            </span>
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              👥 {campaign.participants?.length || 0} participants
                            </span>
                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              By {campaign.createdBy?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {campaign.isFeatured && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ Featured
                            </span>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await axios.patch(`/api/admin/campaigns/${campaign._id}/toggle-feature`)
                                fetchAdminData()
                              } catch (error) {
                                console.error('Error toggling feature:', error)
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              campaign.isFeatured
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {campaign.isFeatured ? 'Unfeature' : 'Feature'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                    <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Campaigns Found</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No cleanup campaigns have been created yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Notification Management</h1>
              
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Notification title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <textarea
                    placeholder="Notification message"
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    rows={3}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <div className="flex gap-4">
                    <select
                      value={notificationForm.type}
                      onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                      className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="announcement">Announcement</option>
                      <option value="report_update">Report Update</option>
                      <option value="campaign_reminder">Campaign Reminder</option>
                    </select>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={notificationForm.isGlobal}
                        onChange={(e) => setNotificationForm({...notificationForm, isGlobal: e.target.checked})}
                        className="rounded"
                      />
                      <span>Send to all users</span>
                    </label>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await axios.post('/api/admin/notifications', notificationForm)
                        setNotificationForm({ title: '', message: '', type: 'announcement', isGlobal: true })
                        fetchAdminData()
                      } catch (error) {
                        console.error('Error creating notification:', error)
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Send Notification
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Notifications</h3>
                {notifications && notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div key={notification._id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-sm`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{notification.message}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Type: {notification.type}</span>
                            <span>{notification.isGlobal ? 'Global' : `${notification.recipients?.length || 0} recipients`}</span>
                            <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await axios.delete(`/api/admin/notifications/${notification._id}`)
                              fetchAdminData()
                            } catch (error) {
                              console.error('Error deleting notification:', error)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-2xl shadow-sm text-center`}>
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Notifications</h3>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No notifications have been sent yet.</p>
                  </div>
                )}
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
                      <div className="flex justify-between items-start">
                        <div className="flex space-x-4 flex-1">
                          {post.image && (
                            <img src={post.image} alt="Post" className="w-20 h-20 object-cover rounded-lg" />
                          )}
                          <div className="flex-1">
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>{post.caption}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {post.user?.name || 'Unknown'}</span>
                              <span>{post.likes?.length || 0} likes</span>
                              <span>{post.comments?.length || 0} comments</span>
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              {post.isFlagged && <span className="text-red-500 font-medium">🚩 Flagged</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={async () => {
                              try {
                                await axios.patch(`/api/admin/moderation/post/${post._id}/flag`, { isFlagged: !post.isFlagged })
                                fetchAdminData()
                              } catch (error) {
                                console.error('Error flagging post:', error)
                              }
                            }}
                            className={`px-3 py-1 rounded text-sm ${
                              post.isFlagged ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}
                          >
                            {post.isFlagged ? 'Unflag' : 'Flag'}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await axios.delete(`/api/admin/posts/${post._id}`)
                                fetchAdminData()
                              } catch (error) {
                                console.error('Error deleting post:', error)
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
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
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>No posts have been created yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              
              {analytics.engagement && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Likes</p>
                        <p className="text-2xl font-bold">{analytics.engagement.totalLikes || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-pink-500" />
                    </div>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Comments</p>
                        <p className="text-2xl font-bold">{analytics.engagement.totalComments || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>New Users (7d)</p>
                        <p className="text-2xl font-bold">{analytics.engagement.recentUsers || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>New Reports (7d)</p>
                        <p className="text-2xl font-bold">{analytics.engagement.recentReports || 0}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>
                </div>
              )}
              
              {analytics.charts && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h3 className="text-lg font-semibold mb-4">Monthly Reports</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.charts.monthlyReports}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="reports" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                    <h3 className="text-lg font-semibold mb-4">Monthly Posts</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.charts.monthlyPosts}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="posts" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              
              {analytics.topUsers && analytics.topUsers.length > 0 && (
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <h3 className="text-lg font-semibold mb-4">Top Active Users</h3>
                  <div className="space-y-3">
                    {analytics.topUsers.map((user, index) => (
                      <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{user.postCount} posts</p>
                          <p className="text-sm text-gray-500">{user.totalLikes} likes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          
          {activeTab === 'rewards' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Rewards Management</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Points Awarded</p>
                      <p className="text-2xl font-bold">{stats.totalUsers * 50 || 0}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Users</p>
                      <p className="text-2xl font-bold">{users.filter(u => u.isActive).length || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Points/User</p>
                      <p className="text-2xl font-bold">{users.length > 0 ? Math.round((users.reduce((sum, u) => sum + (u.points || 0), 0) / users.length)) : 0}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm`}>
                <h3 className="text-lg font-semibold mb-4">Top Users by Points</h3>
                <div className="space-y-3">
                  {users
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .slice(0, 10)
                    .map((user, index) => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>#{index + 1}</span>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">{user.points || 0} pts</span>
                        <button
                          onClick={async () => {
                            const points = prompt('Award points:', '10')
                            const description = prompt('Description:', 'Admin bonus')
                            if (points && description) {
                              try {
                                await axios.post(`/api/admin/users/${user._id}/award-points`, {
                                  points: parseInt(points),
                                  description
                                })
                                fetchAdminData()
                              } catch (error) {
                                console.error('Error awarding points:', error)
                              }
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Award Points
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard