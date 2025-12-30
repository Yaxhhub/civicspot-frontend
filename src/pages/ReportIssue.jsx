import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { Camera, MapPin, Upload, CheckCircle, Navigation } from 'lucide-react'
import Map, { Marker } from 'react-map-gl'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'pothole',
    customType: '',
    latitude: '',
    longitude: '',
    address: ''
  })
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [duplicateReport, setDuplicateReport] = useState(null)
  const [mapViewport, setMapViewport] = useState({
    latitude: 28.6139, // New Delhi coordinates as default
    longitude: 77.2090,
    zoom: 12
  })
  
  const navigate = useNavigate()

  useEffect(() => {
    getCurrentLocation()
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
        (error) => {
          console.error('Error getting location:', error)
          // Fallback to IP-based location
          fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                const coords = {
                  latitude: data.latitude,
                  longitude: data.longitude
                }
                setFormData(prev => ({
                  ...prev,
                  latitude: coords.latitude.toString(),
                  longitude: coords.longitude.toString(),
                  address: `${data.city}, ${data.region}`
                }))
                setMapViewport(prev => ({
                  ...prev,
                  ...coords,
                  zoom: 12
                }))
              }
            })
            .catch(() => {
              console.log('IP location also failed')
            })
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
      )
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      setShowCamera(true)
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Camera access denied. Please use file upload instead.')
    }
  }

  const capturePhoto = () => {
    const video = document.getElementById('camera-video')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    canvas.toBlob((blob) => {
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
      setImage(file)
      setImagePreview(canvas.toDataURL())
      stopCamera()
    }, 'image/jpeg', 0.8)
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = new FormData()
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key])
      })
      if (image) {
        submitData.append('image', image)
      }

      await axios.post('/api/reports', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      if (error.response?.status === 409) {
        // Duplicate report found
        setDuplicateReport(error.response.data.existingReport)
        setError('')
      } else {
        setError(error.response?.data?.message || 'Failed to submit report')
        setDuplicateReport(null)
      }
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600">Thank you for helping make your city better.</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
            <p className="text-gray-600">Help us identify and fix problems in your community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {duplicateReport && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Similar Report Found</h3>
                    <p className="text-sm mt-1">
                      A similar report "{duplicateReport.title}" already exists in this area (Status: {duplicateReport.status})
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Reported on {new Date(duplicateReport.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pothole">Pothole</option>
                <option value="garbage">Garbage/Litter</option>
                <option value="streetlight">Broken Street Light</option>
                <option value="drainage">Drainage Issue</option>
                <option value="graffiti">Graffiti/Vandalism</option>
                <option value="traffic">Traffic Signal Issue</option>
                <option value="sidewalk">Damaged Sidewalk</option>
                <option value="park">Park Maintenance</option>
                <option value="noise">Noise Complaint</option>
                <option value="water">Water Leak</option>
                <option value="other">Other</option>
              </select>
            </div>

            {formData.type === 'other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the issue type
                </label>
                <input
                  type="text"
                  name="customType"
                  value={formData.customType || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the type of issue"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400 text-sm">(Optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional details about the issue (optional)"
              />
            </div>



            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {showCamera ? (
                  <div className="space-y-4">
                    <video
                      id="camera-video"
                      autoPlay
                      playsInline
                      ref={(video) => {
                        if (video && stream) {
                          video.srcObject = stream
                        }
                      }}
                      className="w-full max-w-sm mx-auto rounded-lg"
                    />
                    <div className="flex space-x-2 justify-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                      >
                        Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setImagePreview('')
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <div className="flex space-x-2 justify-center">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Take Photo</span>
                      </button>
                      <label className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
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
                      <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg" />
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default ReportIssue