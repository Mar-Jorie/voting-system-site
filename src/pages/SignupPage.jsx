import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import InputFactory from '../components/InputFactory';
import SelectInput from '../components/SelectInput';
import { toast } from 'react-hot-toast';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'viewer', label: 'Viewer' }
  ];

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
    setLoading(true);

    try {
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      // For demo purposes, we'll create a mock user
      const mockUser = {
        id: Date.now().toString(),
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        role: formData.role
      };

      // Store user data
      localStorage.setItem('user', JSON.stringify(mockUser));
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      {/* Back to Home Button */}
      <div className="absolute top-6 left-6">
        <Link to="/" className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-md w-full space-y-6">
        {/* Sign Up Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your account</h2>
            <p className="text-sm text-gray-600 mb-4">Join us and start managing your voting system effectively</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputFactory
                fieldName="firstName"
                config={{
                  type: 'String',
                  label: 'First Name',
                  placeholder: 'Enter your first name',
                  required: true
                }}
                value={formData.firstName}
                onChange={(value) => handleChange('firstName', value)}
              />
              <InputFactory
                fieldName="lastName"
                config={{
                  type: 'String',
                  label: 'Last Name',
                  placeholder: 'Enter your last name',
                  required: true
                }}
                value={formData.lastName}
                onChange={(value) => handleChange('lastName', value)}
              />
            </div>

            {/* Email Field */}
            <InputFactory
              fieldName="email"
              config={{
                type: 'String',
                label: 'Email Address',
                placeholder: 'Enter your email',
                required: true,
                format: 'email'
              }}
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
            />

            {/* Username Field */}
            <InputFactory
              fieldName="username"
              config={{
                type: 'String',
                label: 'Username',
                placeholder: 'Choose a username',
                required: true
              }}
              value={formData.username}
              onChange={(value) => handleChange('username', value)}
            />

            {/* Role Selection */}
            <SelectInput
              label="Your role"
              options={roleOptions}
              value={formData.role}
              onChange={(value) => handleChange('role', value)}
              placeholder="Select your role"
              required
            />

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputFactory
                fieldName="password"
                config={{
                  type: 'String',
                  label: 'Password',
                  placeholder: 'Create a password',
                  required: true,
                  format: 'password',
                  showPasswordToggle: true
                }}
                value={formData.password}
                onChange={(value) => handleChange('password', value)}
              />
              <InputFactory
                fieldName="confirmPassword"
                config={{
                  type: 'String',
                  label: 'Confirm Password',
                  placeholder: 'Confirm your password',
                  required: true,
                  format: 'password',
                  showPasswordToggle: true
                }}
                value={formData.confirmPassword}
                onChange={(value) => handleChange('confirmPassword', value)}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="primary" fullWidth disabled={loading}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;