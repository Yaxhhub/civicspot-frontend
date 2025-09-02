import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MapPin, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import NotificationBell from './NotificationBell'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">CivicSpot</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {!user?.isAdmin && (
              <>
                <Link to="/map" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Map
                </Link>
                <Link to="/campaigns" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Campaigns
                </Link>
                <Link to="/explore" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Explore
                </Link>
              </>
            )}
            
            {user ? (
              <div className="flex items-center space-x-4">
                {user.isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                      Admin Panel
                    </Link>
                    <span className="text-red-600 font-semibold">Admin: {user.name}</span>
                  </>
                ) : (
                  <>
                    <Link to="/report" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                      Report Issue
                    </Link>
                    <Link to="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-primary-600">
                      <User className="h-4 w-4" />
                      <span>{user.name}</span>
                    </Link>
                    <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
                      Dashboard
                    </Link>
                    <NotificationBell />
                  </>
                )}
                <button onClick={handleLogout} className="text-gray-700 hover:text-red-600 transition-colors">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                  Login
                </Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {!user?.isAdmin && (
                <>
                  <Link to="/map" className="block px-3 py-2 text-gray-700 hover:text-primary-600">
                    Map
                  </Link>
                  <Link to="/campaigns" className="block px-3 py-2 text-gray-700 hover:text-primary-600">
                    Campaigns
                  </Link>
                  <Link to="/explore" className="block px-3 py-2 text-gray-700 hover:text-primary-600">
                    Explore
                  </Link>
                </>
              )}
              {user ? (
                <>
                  {user.isAdmin ? (
                    <>
                      <Link to="/admin/dashboard" className="block px-3 py-2 bg-red-600 text-white rounded-lg">
                        Admin Panel
                      </Link>
                      <div className="px-3 py-2 text-red-600 font-semibold">
                        Admin: {user.name}
                      </div>
                    </>
                  ) : (
                    <>
                      <Link to="/report" className="block px-3 py-2 bg-primary-600 text-white rounded-lg">
                        Report Issue
                      </Link>
                      <Link to="/profile" className="block px-3 py-2 text-gray-700 hover:text-primary-600">
                        Profile
                      </Link>
                      <Link to="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-primary-600">
                        Dashboard
                      </Link>
                    </>
                  )}
                  <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-red-600">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-gray-700 hover:text-primary-600">
                    Login
                  </Link>
                  <Link to="/register" className="block px-3 py-2 bg-primary-600 text-white rounded-lg">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar