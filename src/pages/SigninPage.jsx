import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import InputFactory from '../components/InputFactory';
import { useSignIn } from '../usecases/user/useSignIn';
import { toast } from 'react-hot-toast';
import useApp from '../hooks/useApp';

const SignInPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login: _login, loading } = useSignIn();
  const { setUser } = useApp();

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // For demo purposes, we'll use a simple mock authentication
      // In a real app, this would use the useSignIn hook
      if (formData.email === 'admin@voting.com' && formData.password === 'admin123') {
        // Store mock user data
        const mockUser = {
          id: '1',
          email: 'admin@voting.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        };
        localStorage.setItem('user', JSON.stringify(mockUser));
        // Update AppContext with user data
        setUser(mockUser);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else if (formData.email === 'admin@voting.com') {
        // Email is correct but password is wrong
        toast.error('Incorrect password. Please try again.');
      } else if (formData.email && formData.password) {
        // Email doesn't exist
        toast.error('Account does not exist. Please check your email address.');
      } else {
        // Missing fields
        toast.error('Please enter both email and password.');
      }
    } catch (err) {
      toast.error(err.message || 'Sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="max-w-sm w-full space-y-6">
        {/* Sign In Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-sm text-gray-600 mb-4">Sign in to your account</p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Field */}
            <InputFactory
              fieldName="email"
              config={{
                type: 'String',
                label: 'Email address',
                placeholder: 'admin@voting.com',
                required: true,
                format: 'email'
              }}
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
              error={error}
            />

            {/* Password Field */}
            <InputFactory
              fieldName="password"
              config={{
                type: 'String',
                label: 'Password',
                placeholder: 'Enter your password',
                required: true,
                format: 'password',
                showPasswordToggle: true
              }}
              value={formData.password}
              onChange={(value) => handleChange('password', value)}
              error={error}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                Forgot password?
              </a>
            </div>

            {/* Sign In Button */}
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Social Sign In */}
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondaryOutline" size="md" className="w-full">
                <GlobeAltIcon className="h-4 w-4 mr-2" />
                Google
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;