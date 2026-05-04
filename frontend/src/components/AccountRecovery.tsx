import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { KeyRound, Mail, CheckCircle, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { requestPasswordReset, verifyResetToken, resetPassword } from '../lib/api';
import { toast } from 'sonner';
import { validatePassword } from '../lib/emailValidation';

interface AccountRecoveryProps {
  onBack: () => void;
  onResetComplete: () => void;
}

type RecoveryStage = 'email' | 'code' | 'reset' | 'success';

export function AccountRecovery({ onBack, onResetComplete }: AccountRecoveryProps) {
  const [stage, setStage] = useState<RecoveryStage>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // STEP 1: Request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(email);

      if (response.success) {
        toast.success('✅ Check your email for password reset code');
        setStage('code');
      } else {
        toast.error(response.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify reset code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetCode.trim()) {
      toast.error('Please enter the reset code from your email');
      return;
    }

    setLoading(true);
    try {
      // The code IS the token in this case
      const tokenData = await verifyResetToken(resetCode);

      if (tokenData.valid) {
        setResetToken(resetCode);
        setStage('reset');
        toast.success('✅ Code verified! Now create your new password');
      } else {
        toast.error(tokenData.error || 'Invalid reset code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired reset code');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.errors[0] || 'Password is too weak');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(resetToken, newPassword);

      if (response.success) {
        toast.success('✅ Password reset successful!');
        setStage('success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          onResetComplete();
        }, 2000);
      } else {
        toast.error(response.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white shadow-2xl">
      <div className="p-8">
        {/* STEP 1: EMAIL */}
        {stage === 'email' && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-900 flex items-center justify-center gap-2">
              <KeyRound className="h-6 w-6 text-slate-600" />
              Reset Password
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Enter your email address and we'll send you a password reset code
            </p>

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <Label htmlFor="recovery-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Label>
                <Input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-500 hover:to-amber-500 text-gray-900 font-bold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Mail className="h-4 w-4" />
                Send Reset Code
              </Button>

              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </form>
          </>
        )}

        {/* STEP 2: CODE */}
        {stage === 'code' && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
              Verify Code
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Label htmlFor="reset-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Code
                </Label>
                <Input
                  id="reset-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || resetCode.length !== 6}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify Code
              </Button>

              <button
                type="button"
                onClick={() => setStage('email')}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </form>
          </>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {stage === 'reset' && (
          <>
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
              Create New Password
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              Enter your new password
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-700">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset Password
              </Button>

              <button
                type="button"
                onClick={() => setStage('code')}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </form>
          </>
        )}

        {/* STEP 4: SUCCESS */}
        {stage === 'success' && (
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Password Reset Successful!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Button
              onClick={onResetComplete}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-2 rounded-lg"
            >
              Back to Sign In
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
