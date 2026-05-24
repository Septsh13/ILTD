import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { Lock, User, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { requestOtp, verifyOtp } = useAuth();

  // Step 1 state
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
  const [otp, setOtp] = useState('');
  const [otpHint, setOtpHint] = useState(''); // mock: shows OTP returned by backend

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await requestOtp(employeeId, password);

    if (result.success) {
      // In dev mode: backend returns OTP in body — pre-fill for convenience
      if (result.otp) setOtpHint(result.otp);
      setStep(2);
    } else {
      setError(result.message);
    }
    setIsLoading(false);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await verifyOtp(employeeId, otp);

    if (!result.success) {
      setError(result.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-600/5 -skew-y-6 transform origin-top-left -z-10"></div>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-blue-200 shadow-sm mb-4">
            <span className="text-2xl font-extrabold text-blue-600">CP</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-800">ClearPath</h1>
          <p className="text-blue-600 mt-2">Logistics Transparency Platform</p>
        </div>

        <Card className="shadow-lg border-blue-200 backdrop-blur-sm bg-white/90">
          <CardHeader className="bg-transparent border-b-0 pt-8 pb-0 text-center">
            <CardTitle className="text-2xl font-bold">
              {step === 1 ? 'Sign In' : 'Verify OTP'}
            </CardTitle>
            <p className="text-sm text-blue-500 mt-1">
              {step === 1
                ? 'Enter your Employee ID and password'
                : `OTP sent for ${employeeId}`}
            </p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-8 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-600' : 'bg-blue-200'}`} />
              <div className={`w-8 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-blue-200'}`} />
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleStep1} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-blue-700">Employee ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder="e.g. ADMIN001, CHA001, GOVT001"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder:text-blue-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-blue-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder:text-blue-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="space-y-6">
                {otpHint && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm">
                    <span className="font-semibold">Dev Mode OTP: </span>{otpHint}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-blue-700">One-Time Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder:text-blue-300 tracking-widest text-center text-lg font-mono"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(''); }}
                  className="w-full text-center text-sm text-blue-400 hover:text-blue-600 transition-colors"
                >
                  ← Back to credentials
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-blue-400 mt-8">
          Secured by ClearPath Logistics © 2026
        </p>
      </div>
    </div>
  );
};
