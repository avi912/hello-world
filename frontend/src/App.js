import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      logout();
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// Components
function Navbar({ user, logout, setCurrentPage }) {
  return (
    <nav className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold cursor-pointer" onClick={() => setCurrentPage('home')}>
            Think-Tanks & Wizards
          </h1>
          {user && (
            <div className="hidden md:flex space-x-6">
              <button onClick={() => setCurrentPage('discussions')} className="hover:text-blue-300">Discussions</button>
              <button onClick={() => setCurrentPage('community')} className="hover:text-blue-300">Community</button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm">Welcome, {user.full_name}</span>
              <button onClick={() => setCurrentPage('profile')} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">Profile</button>
              <button onClick={logout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg">Logout</button>
            </div>
          ) : (
            <div className="space-x-2">
              <button onClick={() => setCurrentPage('login')} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">Login</button>
              <button onClick={() => setCurrentPage('register')} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg">Join Us</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <div className="relative bg-gradient-to-r from-blue-900 to-purple-900 text-white py-20">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{backgroundImage: 'url(https://images.pexels.com/photos/3183167/pexels-photo-3183167.jpeg)'}}
      ></div>
      <div className="relative max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Where Tech Visionaries Unite
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Join an exclusive community of creative engineers and tech wizards solving tomorrow's problems today. 
          Build the future, together.
        </p>
        <div className="space-x-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold">
            Join the Revolution
          </button>
          <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold">
            Explore Community
          </button>
        </div>
      </div>
    </div>
  );
}

function Features() {
  const features = [
    {
      title: "Elite Network",
      description: "Connect with top-tier engineers and tech visionaries from leading companies",
      icon: "🤝"
    },
    {
      title: "Future Problems",
      description: "Collaborate on solving complex challenges that will shape tomorrow's technology",
      icon: "🚀"
    },
    {
      title: "Knowledge Sharing",
      description: "Share insights, learn from experts, and stay ahead of technological trends",
      icon: "💡"
    },
    {
      title: "Industry Influence",
      description: "Build collective power to influence direction of major tech empires",
      icon: "⚡"
    }
  ];

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Why Join Think-Tanks & Wizards?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ setCurrentPage }) {
  const { login } = React.useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      login(response.data.token, response.data.user);
      setCurrentPage('home');
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={() => setCurrentPage('register')} className="text-blue-600 hover:underline">
            Join us
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterForm({ setCurrentPage }) {
  const { login } = React.useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', full_name: '', title: '', company: '', 
    expertise_areas: [], bio: '', years_experience: 0, github_url: '', linkedin_url: ''
  });
  const [loading, setLoading] = useState(false);

  const expertiseOptions = ['AI/ML', 'Web3/Blockchain', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Mobile Development', 'Frontend', 'Backend', 'Full-Stack', 'Data Science', 'IoT', 'Quantum Computing'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      login(response.data.token, response.data.user);
      setCurrentPage('home');
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
    setLoading(false);
  };

  const toggleExpertise = (area) => {
    const current = formData.expertise_areas;
    if (current.includes(area)) {
      setFormData({...formData, expertise_areas: current.filter(e => e !== area)});
    } else {
      setFormData({...formData, expertise_areas: [...current, area]});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Join the Elite</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
              <input
                type="number"
                required
                min="0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.years_experience}
                onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Areas of Expertise</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {expertiseOptions.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleExpertise(area)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    formData.expertise_areas.includes(area)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              required
              rows="3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell us about your background and what drives you..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">GitHub URL (Optional)</label>
              <input
                type="url"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.github_url}
                onChange={(e) => setFormData({...formData, github_url: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">LinkedIn URL (Optional)</label>
              <input
                type="url"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Joining...' : 'Join the Revolution'}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => setCurrentPage('login')} className="text-blue-600 hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

function Discussions({ user }) {
  const [discussions, setDiscussions] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '', content: '', category: 'AI/ML', tags: []
  });

  const categories = ['AI/ML', 'Web3/Blockchain', 'Cloud Computing', 'Cybersecurity', 'Future Tech', 'Startup Ideas', 'Industry Trends'];

  useEffect(() => {
    fetchDiscussions();
  }, [selectedCategory]);

  const fetchDiscussions = async () => {
    try {
      const url = selectedCategory ? `${API}/discussions?category=${selectedCategory}` : `${API}/discussions`;
      const response = await axios.get(url);
      setDiscussions(response.data);
    } catch (error) {
      console.error('Error fetching discussions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/discussions`, formData);
      setShowCreateForm(false);
      setFormData({ title: '', content: '', category: 'AI/ML', tags: [] });
      fetchDiscussions();
    } catch (error) {
      alert('Error creating discussion: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  const likeDiscussion = async (discussionId) => {
    try {
      await axios.post(`${API}/discussions/${discussionId}/like`);
      fetchDiscussions();
    } catch (error) {
      console.error('Error liking discussion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Discussions</h1>
          {user && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Start Discussion
            </button>
          )}
        </div>

        {/* Categories Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Create Discussion Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Start a Discussion</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    required
                    rows="6"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Post Discussion
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Discussions List */}
        <div className="space-y-6">
          {discussions.map(discussion => (
            <div key={discussion.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{discussion.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>By {discussion.author_name}</span>
                    <span>•</span>
                    <span>{discussion.category}</span>
                    <span>•</span>
                    <span>{new Date(discussion.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-4">{discussion.content}</p>
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => likeDiscussion(discussion.id)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-600"
                >
                  <span>👍</span>
                  <span>{discussion.likes}</span>
                </button>
                <span className="text-gray-500">💬 {discussion.comments_count} comments</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Community() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Community</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.full_name}</h3>
              <p className="text-blue-600 font-medium mb-1">{user.title}</p>
              <p className="text-gray-600 mb-3">{user.company}</p>
              <p className="text-sm text-gray-700 mb-4">{user.bio}</p>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Expertise:</p>
                <div className="flex flex-wrap gap-1">
                  {user.expertise_areas.map(area => (
                    <span key={area} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{user.years_experience} years exp.</span>
                <div className="flex space-x-2">
                  {user.github_url && (
                    <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      GitHub
                    </a>
                  )}
                  {user.linkedin_url && (
                    <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Home({ user, setCurrentPage }) {
  return (
    <div>
      <Hero />
      <Features />
      {!user && (
        <div className="bg-blue-900 text-white py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold mb-6">Ready to Join the Elite?</h2>
            <p className="text-xl mb-8">Connect with the world's most innovative minds and shape the future of technology.</p>
            <button 
              onClick={() => setCurrentPage('register')}
              className="bg-white text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100"
            >
              Join Think-Tanks & Wizards
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <AuthProvider>
      <AuthContext.Consumer>
        {({ user, logout }) => (
          <div className="App">
            <Navbar user={user} logout={logout} setCurrentPage={setCurrentPage} />
            
            {currentPage === 'home' && <Home user={user} setCurrentPage={setCurrentPage} />}
            {currentPage === 'login' && <LoginForm setCurrentPage={setCurrentPage} />}
            {currentPage === 'register' && <RegisterForm setCurrentPage={setCurrentPage} />}
            {currentPage === 'discussions' && <Discussions user={user} />}
            {currentPage === 'community' && <Community />}
            
            <footer className="bg-gray-900 text-white py-8">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p>&copy; 2025 Think-Tanks & Wizards. Building the future, together.</p>
              </div>
            </footer>
          </div>
        )}
      </AuthContext.Consumer>
    </AuthProvider>
  );
}

export default App;