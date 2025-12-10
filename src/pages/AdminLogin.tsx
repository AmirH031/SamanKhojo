import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { isAdmin, validateAdminAccess } from '../services/adminAuthService';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { userApi } from '../services/api';


const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();



  // Check for existing block on component mount
  useEffect(() => {
    const blockData = localStorage.getItem('adminLoginBlock');
    if (blockData) {
      const { blockUntil, attempts } = JSON.parse(blockData);
      const now = Date.now();
      
      if (now < blockUntil) {
        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil((blockUntil - now) / 1000));
        setLoginAttempts(attempts);
      } else {
        // Block expired, clear it
        localStorage.removeItem('adminLoginBlock');
        setLoginAttempts(0);
      }
    }
  }, []);

  // Countdown timer for block
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts(0);
            localStorage.removeItem('adminLoginBlock');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin(user)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleFailedAttempt = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      // Block for 15 minutes
      const blockUntil = Date.now() + (15 * 60 * 1000);
      localStorage.setItem('adminLoginBlock', JSON.stringify({
        blockUntil,
        attempts: newAttempts
      }));
      
      setIsBlocked(true);
      setBlockTimeRemaining(15 * 60); // 15 minutes in seconds
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if blocked
    if (isBlocked) {
      return;
    }


    setLoading(true);
    setNeedsEmailVerification(false);

    try {
      await login(email, password);
      
      // Additional validation after login
      const validation = await validateAdminAccess();
      
      if (!validation.isValid) {
        await signOut(auth);
        handleFailedAttempt();
        setLoading(false);
        return;
      }

      // Clear any existing blocks on successful login
      localStorage.removeItem('adminLoginBlock');
      setLoginAttempts(0);
      setIsBlocked(false);

      navigate('/admin/dashboard', { replace: true });
      
    } catch (error: any) {
      handleFailedAttempt();
    } finally {
      setLoading(false);
    }
  };

  // Show blocked state
  if (isBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-red-50/70 backdrop-blur-md rounded-2xl p-8 border border-red-200/40 shadow-xl"
          >
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">Access Temporarily Blocked</h2>
              <p className="text-red-700 mb-4">
                Too many failed login attempts detected.
              </p>
              <div className="bg-red-100 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-red-800">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-lg">
                    {Math.floor(blockTimeRemaining / 60)}:{(blockTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>
                <p className="text-sm text-red-600 mt-2">Time remaining until access is restored</p>
              </div>
              <p className="text-sm text-red-600">
                This security measure protects against unauthorized access attempts.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show email verification needed
  if (needsEmailVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-yellow-50/70 backdrop-blur-md rounded-2xl p-8 border border-yellow-200/40 shadow-xl"
          >
            <div className="text-center">
              <Mail className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-900 mb-2">Email Verification Required</h2>
              <p className="text-yellow-700 mb-4">
                Please verify your email address to access the admin dashboard.
              </p>
              
              {verificationSent ? (
                <div className="bg-green-100 rounded-lg p-4 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Verification email sent!</p>
                  <p className="text-sm text-green-600 mt-1">
                    Check your inbox and click the verification link.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <button
                    onClick={handleSendVerificationEmail}
                    className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Send Verification Email
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const result = await userApi.verifyEmail();
                        if (result.success) {
                          // Reload the user to get updated email verification status
                          await auth.currentUser?.reload();
                          // Navigate to dashboard
                          navigate('/admin/dashboard', { replace: true });
                        }
                      } catch (error: any) {
                        // Auto-verification failed
                      }
                    }}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Verify Email
                  </button>
                </div>
              )}
              
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  I've Verified My Email
                </button>
                <button
                  onClick={() => {
                    setNeedsEmailVerification(false);
                    signOut(auth);
                  }}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 mr-2" />
              <img src="/logo.svg" alt="SamanKhojo" className="h-12 w-auto" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h2>
            <p className="text-gray-600">Secure access to admin dashboard</p>
            

          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="appearance-none rounded-xl relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;