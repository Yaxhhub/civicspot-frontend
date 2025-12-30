import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from '../utils/axios'
import { Trophy, Star, Activity } from 'lucide-react'

const Rewards = () => {
  const [userRewards, setUserRewards] = useState({ points: 0, activities: [] })
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      const [rewardsRes, leaderboardRes] = await Promise.all([
        axios.get('/api/rewards/my-rewards'),
        axios.get('/api/rewards/leaderboard')
      ])
      setUserRewards(rewardsRes.data)
      setLeaderboard(leaderboardRes.data)
    } catch (error) {
      console.error('Error fetching rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Rewards & Leaderboard
          </h1>
          <p className="text-gray-600">Track your civic contributions and see how you rank!</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Points */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Your Points</h2>
            </div>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">{userRewards.points}</div>
              <p className="text-gray-600">Total Points Earned</p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Recent Activities</span>
              </h3>
              {userRewards.activities.length > 0 ? (
                userRewards.activities.slice(-5).reverse().map((activity, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-green-600 font-semibold">+{activity.points}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No activities yet. Start reporting issues to earn points!</p>
              )}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Top Contributors</h2>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="font-semibold text-blue-600">{user.points} pts</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Rewards