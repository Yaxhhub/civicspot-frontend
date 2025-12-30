import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { MapPin, Calendar, CheckCircle, Navigation } from 'lucide-react'
import Map, { Marker } from 'react-map-gl'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const CreateCampaign = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    latitude: '',
    longitude: '',
    address: '',
    date: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [mapViewport, setMapViewport] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 12
  })
  
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentLocation()
    // Set minimum date to today
    const today = new Date().toISOString().slice(0, 16)
    setFormData(prev => ({ ...prev, date: today }))
  }, [])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          setFormData(prev => ({
            ...prev,
            latitude: coords.latitude.toString(),
            longitude: coords.longitude.toString(),
            address: 'Current Location'
          }))
          setMapViewport(prev => ({
            ...prev,
            ...coords,
            zoom: 15
          }))
        },
        (error) => console.error('Error getting location:', error)
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        date: formData.date
      }
      
      console.log('Submitting campaign data:', submitData)
      const response = await axios.post('/api/campaigns', submitData)
      console.log('Campaign created successfully:', response.data)
      setSuccess(true)
      setTimeout(() => {
        navigate('/campaigns')
      }, 2000)
    } catch (error) {
      console.error('Campaign creation error:', error.response?.data || error.message)
      setError(error.response?.data?.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString(),
      address: 'Selected Location'
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Created!</h2>
          <p className="text-gray-600">Your cleanup campaign has been created successfully.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Cleanup Campaign</h1>
            <p className="text-gray-600">Organize a community cleanup event</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Downtown Park Cleanup"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the cleanup campaign, what volunteers should bring, meeting point, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Click on map to select)
              </label>
              <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                <Map
                  {...mapViewport}
                  onMove={evt => setMapViewport(evt.viewState)}
                  onClick={handleMapClick}
                  style={{ width: '100%', height: '300px' }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {formData.latitude && formData.longitude && (
                    <Marker
                      latitude={parseFloat(formData.latitude)}
                      longitude={parseFloat(formData.longitude)}
                      anchor="bottom"
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                    </Marker>
                  )}
                </Map>
                
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 font-medium"
                  title="Use current location"
                >
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm">My Location</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  step="any"
                  required
                  placeholder="Latitude"
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  step="any"
                  required
                  placeholder="Longitude"
                  className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mt-2"
                placeholder="Address or landmark description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">{formData.address || 'Location will be auto-detected'}</span>
              <button
                type="button"
                onClick={getCurrentLocation}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Update Location
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Campaign Guidelines</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Provide clear meeting instructions</li>
                <li>• Specify what volunteers should bring</li>
                <li>• Include safety guidelines if needed</li>
                <li>• Set a realistic duration for the cleanup</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Campaign...' : 'Create Campaign'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default CreateCampaign