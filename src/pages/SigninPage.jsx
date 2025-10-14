import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();
  const { signIn, loading } = useSignIn();
  const { login } = useApp();

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
      // Use real authentication with the useSignIn hook
      const response = await signIn({ email: formData.email, password: formData.password });
      
      if (response && response.user) {
        // Use the login function from AppProvider to set the user in context
        login(response.user);
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        // Authentication failed
        toast.error('Invalid email or password. Please try again.');
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

            {/* Remember Me */}
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

            {/* Terms and Conditions */}
            <div className="text-center">
              <p className="text-xs text-gray-600">
                By signing in, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-primary-600 hover:text-primary-500 underline font-medium"
                >
                  Terms and Conditions
                </button>
              </p>
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

        </div>

        {/* Back to Home Button */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowTermsModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-4xl max-h-[85vh] overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Terms and Conditions</h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto flex-1">
                <div className="prose prose-sm max-w-none">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Voting System Terms and Conditions</h4>
                  
                  <p className="text-sm text-gray-700 mb-4">
                    <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                  </p>

                  <div className="space-y-6">
                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">1. Single Event Purpose</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        This voting system is designed and provided for a single, specific event only. The system owner provides this platform as a service for this particular voting event and is not responsible for any outcomes, results, or consequences that may arise from the voting process or the information obtained by participants.
                      </p>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">2. No Liability Disclaimer</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        The system owner hereby disclaims all liability and responsibility for:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Any information, data, or results obtained by participants through this system</li>
                        <li>How participants use, interpret, or act upon any information from the voting process</li>
                        <li>Any decisions made by participants based on voting results or system data</li>
                        <li>Any consequences arising from the voting process or its outcomes</li>
                        <li>Any disputes, conflicts, or issues between participants</li>
                        <li>Any external use of voting results or participant information</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">3. System Owner Protection</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        By using this system, you acknowledge and agree that:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>The system owner is providing this platform as a neutral service provider only</li>
                        <li>The system owner has no control over how participants use the information obtained</li>
                        <li>The system owner is not responsible for any actions taken by participants</li>
                        <li>The system owner cannot be held liable for any damages, losses, or consequences</li>
                        <li>You will not hold the system owner responsible for any outcomes of this voting event</li>
                        <li>The system owner reserves the right to terminate access at any time without notice</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">4. Participant Responsibilities</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        As a participant, you are solely responsible for:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Your own actions and decisions based on any information from this system</li>
                        <li>How you use, share, or distribute any information obtained through voting</li>
                        <li>Any consequences that result from your participation in this voting event</li>
                        <li>Ensuring your use of the system complies with all applicable laws</li>
                        <li>Maintaining the confidentiality of your login credentials</li>
                        <li>Using the system only for its intended single-event purpose</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">5. Information and Data Usage</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        You understand and agree that:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Any information you obtain through this system is for your own use only</li>
                        <li>The system owner is not responsible for the accuracy or completeness of any data</li>
                        <li>You may not use system information to harm, harass, or target other participants</li>
                        <li>The system owner does not endorse or support any particular outcome or result</li>
                        <li>All voting data and results are provided "as is" without any guarantees</li>
                        <li>You assume all risks associated with using any information from this system</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">6. Prohibited Activities</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        The following activities are strictly prohibited:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Attempting to hack, disrupt, or compromise the system</li>
                        <li>Creating multiple accounts or voting multiple times</li>
                        <li>Using the system for any purpose other than this single event</li>
                        <li>Sharing login credentials with others</li>
                        <li>Using system information to harass, threaten, or harm others</li>
                        <li>Attempting to manipulate voting results or system data</li>
                        <li>Violating any applicable laws or regulations</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">7. System Availability</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        The system owner makes no guarantees regarding:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Continuous system availability or uptime</li>
                        <li>System performance or response times</li>
                        <li>Data accuracy or completeness</li>
                        <li>Protection against technical failures or security breaches</li>
                        <li>Compatibility with all devices or browsers</li>
                        <li>Timely delivery of results or information</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">8. Limitation of Liability</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        To the maximum extent permitted by law, the system owner shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Loss of profits, data, or business opportunities</li>
                        <li>Personal injury or property damage</li>
                        <li>Emotional distress or psychological harm</li>
                        <li>Reputation damage or defamation</li>
                        <li>Any damages resulting from system downtime or technical issues</li>
                        <li>Any consequences arising from the use of voting information</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">9. Indemnification</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        You agree to indemnify, defend, and hold harmless the system owner from any claims, damages, losses, costs, or expenses (including reasonable attorney fees) arising from:
                      </p>
                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                        <li>Your use of the system or any information obtained through it</li>
                        <li>Your violation of these terms and conditions</li>
                        <li>Your violation of any applicable laws or regulations</li>
                        <li>Any actions you take based on voting results or system data</li>
                        <li>Any harm caused to other participants or third parties</li>
                      </ul>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">10. Termination</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        The system owner reserves the right to terminate your access to this system immediately and without notice if you violate these terms or engage in any prohibited activities. Upon termination, you must cease all use of the system and any information obtained through it.
                      </p>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">11. Governing Law</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        These terms and conditions shall be governed by and construed in accordance with applicable laws. Any disputes arising from the use of this system shall be resolved through appropriate legal channels, and the system owner's liability shall be limited to the maximum extent permitted by law.
                      </p>
                    </section>

                    <section>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">12. Acknowledgment</h5>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        By using this system, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. You understand that the system owner provides this platform as a neutral service for this single event only and assumes no responsibility for any outcomes or consequences that may arise from your participation or use of any information obtained through this system.
                      </p>
                    </section>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                    By closing this modal, you acknowledge that you have read and understood these terms and conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignInPage;