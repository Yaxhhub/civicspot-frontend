import { Link, useLocation } from 'react-router-dom'
import { Heart, Mail, Phone, MapPin, Github, Twitter } from 'lucide-react'

const Footer = () => {
  const location = useLocation()
  const isMapPage = location.pathname === '/map'
  const isAdminPage = location.pathname.startsWith('/admin')
  
  if (isMapPage || isAdminPage) return null
  
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">CivicSpot</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Empowering communities to report civic issues, organize cleanup campaigns, and build smarter, cleaner cities together.
            </p>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>for our community</span>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/campaigns" className="text-gray-600 hover:text-primary-600 transition-colors">Campaigns</Link></li>
              <li><Link to="/explore" className="text-gray-600 hover:text-primary-600 transition-colors">Explore</Link></li>
              <li><Link to="/report" className="text-gray-600 hover:text-primary-600 transition-colors">Report Issue</Link></li>
              <li><Link to="/map" className="text-gray-600 hover:text-primary-600 transition-colors">Live Map</Link></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>hello@civicspot.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li>
                <Link to="/contact" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                  Contact Us →
                </Link>
              </li>
            </ul>
            
            {/* Social Links */}
            <div className="flex space-x-3 mt-4">
              <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2024 CivicSpot. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-2 sm:mt-0">
            <Link to="/privacy" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gray-600 hover:text-primary-600 text-sm transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer