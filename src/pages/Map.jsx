import { useState, useEffect } from 'react'
import Map, { Marker, Popup } from 'react-map-gl'
import axios from '../utils/axios'
import { MapPin, Calendar, User, Navigation, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const MapView = () => {
  const [reports, setReports] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const { user } = useAuth()
  const [viewport, setViewport] = useState({
    latitude: 28.6139, // New Delhi coordinates as default for India
    longitude: 77.2090,
    zoom: 12
  })

  useEffect(() => {
    fetchReports()
    fetchCampaigns()
    getCurrentLocation()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports')
      setReports(response.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns')
      setCampaigns(response.data)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const joinCampaign = async (campaignId) => {
    if (!user) {
      alert('Please login to join campaigns')
      return
    }
    
    try {
      await axios.post(`/api/campaigns/${campaignId}/join`)
      alert('Successfully joined the campaign!')
      fetchCampaigns() // Refresh campaigns
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join campaign')
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setUserLocation(coords)
          setViewport(prev => ({
            ...prev,
            ...coords,
            zoom: 15
          }))
        },
        (error) => {
          console.error('Location error:', error.message)
          // Try to get approximate location based on IP
          fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                const coords = {
                  latitude: data.latitude,
                  longitude: data.longitude
                }
                setUserLocation(coords)
                setViewport(prev => ({
                  ...prev,
                  ...coords,
                  zoom: 12
                }))
              }
            })
            .catch(() => {
              alert('Unable to get your location. Please enable location access or check your internet connection.')
            })
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  const getMarkerColor = (type) => {
    return type === 'pothole' ? '#ef4444' : '#22c55e'
  }

  const centerOnUserLocation = () => {
    if (userLocation) {
      setViewport(prev => ({
        ...prev,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        zoom: 15
      }))
    } else {
      getCurrentLocation()
    }
  }

  return (
    <div className="h-screen">
      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="center"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </Marker>
        )}

        {/* Report Markers */}
        {reports.map((report) => (
          <Marker
            key={report._id}
            latitude={report.location.latitude}
            longitude={report.location.longitude}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation()
              setSelectedReport(report)
              setSelectedCampaign(null)
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform flex items-center justify-center"
              style={{ backgroundColor: getMarkerColor(report.type) }}
            >
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </Marker>
        ))}

        {/* Campaign Markers */}
        {campaigns.map((campaign) => (
          <Marker
            key={campaign._id}
            latitude={campaign.location.latitude}
            longitude={campaign.location.longitude}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation()
              setSelectedCampaign(campaign)
              setSelectedReport(null)
            }}
          >
            <div className="w-10 h-10 bg-purple-500 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </Marker>
        ))}

        {selectedReport && (
          <Popup
            latitude={selectedReport.location.latitude}
            longitude={selectedReport.location.longitude}
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
              
              <p className="text-gray-600 mb-3">{selectedReport.description}</p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{selectedReport.reportedBy?.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedReport.status === 'resolved' 
                    ? 'bg-green-100 text-green-800'
                    : selectedReport.status === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedReport.status}
                </span>
              </div>
            </div>
          </Popup>
        )}

        {selectedCampaign && (
          <Popup
            latitude={selectedCampaign.location.latitude}
            longitude={selectedCampaign.location.longitude}
            anchor="top"
            onClose={() => setSelectedCampaign(null)}
            className="max-w-sm"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{selectedCampaign.title}</h3>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Campaign
                </span>
              </div>
              
              <p className="text-gray-600 mb-3">{selectedCampaign.description}</p>
              
              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedCampaign.date).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>By {selectedCampaign.createdBy?.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{selectedCampaign.participants?.length || 0} participants</span>
                </div>
              </div>
              
              {user && !selectedCampaign.participants?.includes(user._id) ? (
                <button
                  onClick={() => joinCampaign(selectedCampaign._id)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Join Campaign
                </button>
              ) : user && selectedCampaign.participants?.includes(user._id) ? (
                <div className="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-center">
                  Already Joined
                </div>
              ) : (
                <div className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg text-center">
                  Login to Join
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-sm">Your Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm">Potholes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">Garbage</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
              <Users className="h-2 w-2 text-white" />
            </div>
            <span className="text-sm">Campaigns</span>
          </div>
        </div>
      </div>

      {/* Current Location Button */}
      <button
        onClick={centerOnUserLocation}
        className="absolute bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Go to my location"
      >
        <Navigation className="h-5 w-5" />
      </button>
    </div>
  )
}

export default MapView