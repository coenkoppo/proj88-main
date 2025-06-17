import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show setup instructions if credentials are invalid
      if (error?.message?.includes('Invalid login credentials')) {
        setShowSetupInstructions(true);
        toast.error('Kredensial login tidak valid. Silakan buat user di Supabase terlebih dahulu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-600 font-bold text-lg">B88</span>
            </div>
            <span className="font-bold text-2xl text-white">BarkasBali88</span>
          </Link>
          <p className="text-primary-100 mt-2">Masuk ke Admin Panel</p>
        </div>

        {/* Setup Instructions Alert */}
        {showSetupInstructions && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm">
                <h3 className="font-medium text-red-800 mb-2">Setup Required</h3>
                <p className="text-red-700 mb-3">
                  Demo users belum dibuat di Supabase. Silakan buat user terlebih dahulu:
                </p>
                <ol className="list-decimal list-inside text-red-700 space-y-1 mb-3">
                  <li>Buka Supabase Dashboard</li>
                  <li>Pilih "Authentication" → "Users"</li>
                  <li>Klik "Add user" dan buat user dengan email dan password demo</li>
                </ol>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-red-600 hover:text-red-800 font-medium"
                >
                  Buka Supabase Dashboard
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="card">
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input w-full"
                  placeholder="admin@barkasbali88.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Masuk...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    Masuk
                  </div>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@barkasbali88.com / admin123</p>
                <p><strong>Manager:</strong> manager@barkasbali88.com / manager123</p>
                <p><strong>Employee:</strong> employee@barkasbali88.com / employee123</p>
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <div className="flex items-start">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <strong>Setup Required:</strong> Buat user ini di Supabase Dashboard → Authentication → Users terlebih dahulu. 
                    Database migration hanya membuat profil user, bukan kredensial autentikasi.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-primary-100 hover:text-white transition-colors">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}