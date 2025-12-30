import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { useAuth } from '../context/AuthContext'
import { Calendar, MapPin, Users, Plus, Star, MessageCircle, Share2, Trophy, ThumbsUp, Send } from 'lucide-react'

const Campaigns = () => {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [leaderboard, setLeaderboard] = useState([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)

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
    return user && campaign.participants.some(p => p._id === user._id || p._id === user.id)
  }

  const addComment = async (campaignId) => {
    if (!newComment.trim() || !user) return
    
    // Mock comment functionality
    const mockComment = {
      user: { name: user.name },
      text: newComment,
      createdAt: new Date().toISOString()
    }
    
    // Add to local state
    setCampaigns(prev => prev.map(campaign => 
      campaign._id === campaignId 
        ? { ...campaign, comments: [...(campaign.comments || []), mockComment] }
        : campaign
    ))
    
    setNewComment('')
    alert('Comment added! (Demo mode - not saved to database)')
  }

  const rateCampaign = async (campaignId, rating) => {
    if (!user) return
    
    // Mock rating functionality
    setCampaigns(prev => prev.map(campaign => 
      campaign._id === campaignId 
        ? { ...campaign, averageRating: rating, status: 'completed' }
        : campaign
    ))
    
    alert(`Rated ${rating} stars! (Demo mode - not saved to database)`)
  }

  const shareCampaign = (campaign) => {
    const url = `${window.location.origin}/campaigns`
    const text = `Join the "${campaign.title}" cleanup campaign! 🌱`
    
    if (navigator.share) {
      navigator.share({ title: campaign.title, text, url })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Campaign link copied to clipboard!')
    }
  }

  const fetchLeaderboard = async () => {
    // Generate leaderboard from real campaign participants
    const userStats = {}
    
    campaigns.forEach(campaign => {
      campaign.participants.forEach(participant => {
        const userId = participant._id || participant.id
        if (!userStats[userId]) {
          userStats[userId] = {
            _id: userId,
            name: participant.name,
            campaignCount: 0
          }
        }
        userStats[userId].campaignCount++
      })
    })
    
    // Convert to array and sort by campaign count
    const leaderboardData = Object.values(userStats)
      .sort((a, b) => b.campaignCount - a.campaignCount)
      .slice(0, 10) // Top 10
    
    setLeaderboard(leaderboardData)
    setShowLeaderboard(true)
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

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={fetchLeaderboard}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Trophy className="h-4 w-4" />
              <span>Leaderboard</span>
            </button>
            
            {user && (
              <Link
                to="/create-campaign"
                className="bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Plus className="h-4 sm:h-5 w-4 sm:w-5" />
                <span>Create Campaign</span>
              </Link>
            )}
          </div>
        </div>

        {/* Featured Campaigns */}
        {campaigns.filter(c => c.isFeatured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>Featured Campaigns</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

                  <div className="space-y-3">
                    {/* Social Actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign)
                            setShowComments(true)
                          }}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">{campaign.comments?.length || 0}</span>
                        </button>
                        
                        <button
                          onClick={() => shareCampaign(campaign)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="text-sm">Share</span>
                        </button>
                        
                        {campaign.status === 'completed' && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{campaign.averageRating?.toFixed(1) || 'No ratings'}</span>
                          </div>
                        )}
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
                    
                    {/* Rating for completed campaigns */}
                    {campaign.status === 'completed' && user && isUserJoined(campaign) && (
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm text-gray-600">Rate:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => rateCampaign(campaign._id, star)}
                            className="text-yellow-400 hover:text-yellow-500 transition-colors"
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Campaigns */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Campaigns</h2>
          {campaigns.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

                  <div className="space-y-3">
                    {/* Social Actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCampaign(campaign)
                            setShowComments(true)
                          }}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">{campaign.comments?.length || 0}</span>
                        </button>
                        
                        <button
                          onClick={() => shareCampaign(campaign)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="text-sm">Share</span>
                        </button>
                        
                        {campaign.status === 'completed' && (
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600">{campaign.averageRating?.toFixed(1) || 'No ratings'}</span>
                          </div>
                        )}
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
                    
                    {/* Rating for completed campaigns */}
                    {campaign.status === 'completed' && user && isUserJoined(campaign) && (
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-sm text-gray-600">Rate:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => rateCampaign(campaign._id, star)}
                            className="text-yellow-400 hover:text-yellow-500 transition-colors"
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
        
        {/* Comments Modal */}
        {showComments && selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden mx-2 sm:mx-0">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{selectedCampaign.title} - Comments</h3>
                  <button 
                    onClick={() => setShowComments(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                {selectedCampaign.comments?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedCampaign.comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{comment.user?.name || 'Anonymous'}</span>
                          <span className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                )}
              </div>
              
              {user && (
                <div className="p-6 border-t">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && addComment(selectedCampaign._id)}
                    />
                    <button
                      onClick={() => addComment(selectedCampaign._id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-md w-full mx-2 sm:mx-0">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold flex items-center space-x-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <span>Top Participants</span>
                  </h3>
                  <button 
                    onClick={() => setShowLeaderboard(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {leaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {leaderboard.map((participant, index) => (
                      <div key={participant._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-sm text-gray-500">{participant.campaignCount} campaigns</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">{participant.campaignCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No participants yet!</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Campaigns