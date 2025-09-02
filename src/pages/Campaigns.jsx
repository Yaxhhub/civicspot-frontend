import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Calendar, MapPin, Users, Plus, Star } from 'lucide-react'

const Campaigns = () => {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/api/campaigns')
      setCampaigns(response.data)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinCampaign = async (campaignId) => {
    if (!user) return

    try {
      await axios.post(`/api/campaigns/${campaignId}/join`)
      fetchCampaigns() // Refresh campaigns
    } catch (error) {
      console.error('Error joining campaign:', error)
    }
  }

  const isUserJoined = (campaign) => {
    return user && campaign.participants.some(p => p._id === user.id)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cleanup Campaigns</h1>
            <p className="text-gray-600">Join community efforts to make your city cleaner</p>
            {!user && (
              <p className="text-sm text-blue-600 mt-2">
                💡 You can view all campaigns below. Login to join and participate!
              </p>
            )}
          </motion.div>

          {user && (
            <Link
              to="/create-campaign"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Campaign</span>
            </Link>
          )}
        </div>

        {/* Featured Campaigns */}
        {campaigns.filter(c => c.isFeatured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Featured Campaigns</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.filter(c => c.isFeatured).map((campaign) => (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </span>
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(campaign.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{campaign.location.address || 'Location provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{campaign.participants.length} participants</span>
                    </div>
                  </div>

                  {user && (
                    <button
                      onClick={() => joinCampaign(campaign._id)}
                      disabled={isUserJoined(campaign)}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        isUserJoined(campaign)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isUserJoined(campaign) ? 'Joined' : 'Join Campaign'}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Campaigns */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Campaigns</h2>
          {campaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <motion.div
                  key={campaign._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{campaign.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(campaign.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{campaign.location.address || 'Location provided'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{campaign.participants.length} participants</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>By {campaign.createdBy.name}</span>
                    </div>
                  </div>

                  {user ? (
                    <button
                      onClick={() => joinCampaign(campaign._id)}
                      disabled={isUserJoined(campaign)}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        isUserJoined(campaign)
                          ? 'bg-green-100 text-green-800 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isUserJoined(campaign) ? 'Joined' : 'Join Campaign'}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="block w-full py-2 px-4 bg-primary-100 text-primary-700 rounded-lg text-center font-medium hover:bg-primary-200 transition-colors border border-primary-300"
                    >
                      Login to Join Campaign
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">Be the first to create a cleanup campaign!</p>
              {user && (
                <Link
                  to="/create-campaign"
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Campaign</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Campaigns