import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, Calendar, Camera, User, Search, Star } from 'lucide-react'

const MobileBottomNav = () => {
  const location = useLocation()
  
  // Don't show on admin pages or auth pages
  if (location.pathname.startsWith('/admin') || 
      location.pathname === '/login' || 
      location.pathname === '/register') {
    return null
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: MapPin, label: 'Map' },
    { path: '/report', icon: Camera, label: 'Report' },
    { path: '/campaigns', icon: Calendar, label: 'Events' },
    { path: '/explore', icon: Search, label: 'Explore' },
    { path: '/rewards', icon: Star, label: 'Rewards' }
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 safe-area-inset-bottom">
      <div className="flex justify-around items-center py-2 pb-safe">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-200 min-w-0 ${
                isActive 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium leading-none truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default MobileBottomNav