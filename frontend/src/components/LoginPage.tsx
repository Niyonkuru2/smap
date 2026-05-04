import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { 
  ShoppingCart, 
  Loader2, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle,
  User,
  Phone,
  Lock,
  X,
  KeyRound,
  Send,
  Shield
} from 'lucide-react';
import type { UserType, UserRole } from '../types';
import {signIn, 
  signUp, 
  sendVerificationEmail, 
  verifyEmailForSignup, 
  requestPasswordReset, 
  verifyResetToken, 
  resetPassword  } from '../lib/api';
import { toast } from 'sonner';
import {isValidEmail, validatePassword, sanitizeEmail, isDisposableEmail} from '../lib/validations/emailValidation';
import ThemeToggle from './ThemeToggle';

interface LoginPageProps {
  onLogin?: (user: UserType) => void; // Made optional
}

type SignupStage = 'email' | 'code' | 'details' | null;
type RecoveryStage = 'email' | 'code' | 'reset' | null;

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate(); // Add navigation hook
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Modal states
  const [showAccountRecovery, setShowAccountRecovery] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupStage, setSignupStage] = useState<SignupStage>(null);
  const [recoveryStage, setRecoveryStage] = useState<RecoveryStage>(null);

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('consumer');
  const [codeExpireTime, setCodeExpireTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [canResend, setCanResend] = useState(false);

  // Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryCodeSent, setRecoveryCodeSent] = useState(false);

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Signup countdown timer
  useEffect(() => {
    if (!codeExpireTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, codeExpireTime - Date.now());
      if (remaining === 0) {
        setTimeRemaining('Expired');
        setCanResend(true);
        clearInterval(interval);
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [codeExpireTime]);

  // Navigation helper based on user role
  const navigateToDashboard = (role: string) => {
    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'vendor':
        navigate('/vendor/dashboard');
        break;
      case 'business':
        navigate('/business/dashboard');
        break;
      case 'consumer':
        navigate('/consumer/dashboard');
        break;
      case 'agent':
        navigate('/agent/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // ============= LOGIN HANDLERS =============
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(email);

    if (!isValidEmail(cleanEmail)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!password) {
      toast.error('Please enter a password');
      return;
    }

    setLoading(true);
    try {
      const { user } = await signIn(cleanEmail, password);
      
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      
      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Call onLogin if provided (for backward compatibility)
      if (onLogin) {
        onLogin(userData);
      }
      
      toast.success(`Welcome back, ${user.name}!`);
      
      // Navigate to appropriate dashboard
      navigateToDashboard(user.role);
      
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ============= SIGNUP HANDLERS =============
  const handleStartSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(signupEmail);

    if (!isValidEmail(cleanEmail)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (isDisposableEmail(cleanEmail)) {
      toast.error('Please use a real email address');
      return;
    }

    setLoading(true);
    try {
      await sendVerificationEmail(cleanEmail);
      setSignupStage('code');
      setCodeExpireTime(Date.now() + 60000);
      setCanResend(false);
      toast.success('Verification code sent!');
    } catch (error: any) {
      setSignupStage('details');
      toast.warning('Continuing without verification');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await verifyEmailForSignup(signupEmail, signupCode);
      setSignupStage('details');
      setCodeExpireTime(null);
      toast.success('Email verified!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail(signupEmail);
      setCodeExpireTime(Date.now() + 60000);
      setCanResend(false);
      setSignupCode('');
      toast.success('New code sent!');
    } catch (error: any) {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!signupPassword) {
      toast.error('Please enter a password');
      return;
    }

    const validation = validatePassword(signupPassword);
    if (!validation.isValid) {
      toast.error(validation.errors[0] || 'Password is too weak');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        role: signupRole,
        phone: signupPhone || undefined,
        province: undefined,
        district: undefined,
      });

      if (result.success) {
        // Store the token
        localStorage.setItem('authToken', result.token);
        
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (onLogin) {
          onLogin(userData);
        }

        toast.success(`Welcome, ${signupName}!`);
        closeSignupModal();
        
        // Navigate to appropriate dashboard
        navigateToDashboard(result.user.role);
      } else {
        toast.error(result.message || 'Failed to create account');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // ============= RECOVERY HANDLERS =============
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(recoveryEmail);

    if (!isValidEmail(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(cleanEmail);
      setRecoveryCodeSent(true);
      setRecoveryStage('code');
      toast.success('Reset code sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetToken.trim() || resetToken.length < 6) {
      toast.error('Please enter a valid reset code');
      return;
    }

    setLoading(true);
    try {
      await verifyResetToken(resetToken);
      setRecoveryStage('reset');
      toast.success('Code verified! Please enter your new password.');
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      toast.success('Password reset successful! Please login with your new password.');
      closeRecoveryModal();
      setRecoveryEmail('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // ============= MODAL CONTROLS =============
  const openSignupModal = () => {
    setShowSignupModal(true);
    setSignupStage('email');
    setSignupEmail('');
    setSignupCode('');
    setSignupName('');
    setSignupPassword('');
    setSignupPhone('');
    setSignupRole('consumer');
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setSignupStage(null);
    setCodeExpireTime(null);
  };

  const openRecoveryModal = () => {
    setShowAccountRecovery(true);
    setRecoveryStage('email');
    setRecoveryEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeRecoveryModal = () => {
    setShowAccountRecovery(false);
    setRecoveryStage(null);
    setRecoveryCodeSent(false);
  };

  const handleSignupBack = () => {
    if (signupStage === 'code') {
      setSignupStage('email');
      setCodeExpireTime(null);
    } else if (signupStage === 'details') {
      setSignupStage('code');
    }
  };

  const handleRecoveryBack = () => {
    if (recoveryStage === 'code') {
      setRecoveryStage('email');
    } else if (recoveryStage === 'reset') {
      setRecoveryStage('code');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // ============= RENDER FUNCTIONS =============
  const renderSignupContent = () => {
    if (signupStage === 'email') {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto icon-container mb-4">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create Account</h2>
            <p className="text-muted-foreground text-sm mt-1">Enter your email to get started</p>
          </div>

          <form onSubmit={handleStartSignup} className="space-y-5">
            <div>
              <Label className="text-sm text-white mb-2 block">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Continue'}
            </Button>
          </form>
        </>
      );
    }

    if (signupStage === 'code') {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto icon-container mb-4">
              <CheckCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
            <p className="text-muted-foreground text-sm mt-1">
              We sent a code to <span className="text-white">{signupEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <Label className="text-sm text-white mb-2 block">Verification Code</Label>
              <Input
                type="text"
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="bg-[hsl(var(--input-background))] border border-border text-white focus:ring-2 focus:ring-primary text-center text-lg tracking-wider"
                disabled={loading}
                maxLength={6}
                autoFocus
              />
              {timeRemaining && (
                <p className={`text-xs mt-2 text-center ${
                  timeRemaining === 'Expired' ? 'text-red-400' : 'text-muted-foreground'
                }`}>
                  {timeRemaining === 'Expired' ? 'Code expired' : `Code expires in ${timeRemaining}`}
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify Code'}
            </Button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={!canResend || loading}
              className="w-full text-center text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
          </form>
        </>
      );
    }

    if (signupStage === 'details') {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto icon-container mb-4">
              <User className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Complete Profile</h2>
            <p className="text-muted-foreground text-sm mt-1">Tell us about yourself</p>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-5">
            <div>
              <Label className="text-sm text-white mb-2 block">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-white mb-2 block">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showSignupPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 pr-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                >
                  {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <Label className="text-sm text-white mb-2 block">Phone Number (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+250 XXX XXX XXX"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Create Account'}
            </Button>
          </form>
        </>
      );
    }

    return null;
  };

  const renderRecoveryContent = () => {
    if (recoveryStage === 'email') {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto icon-container mb-4">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
            <p className="text-muted-foreground text-sm mt-1">Don't worry, we'll send you a reset code</p>
          </div>

          <form onSubmit={handleRequestReset} className="space-y-5">
            <div>
              <Label className="text-sm text-white mb-2 block">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reset Code
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                <Shield className="h-3 w-3 inline mr-1" />
                We'll send a 6-digit code to your email
              </p>
            </div>
          </form>
        </>
      );
    }

    if (recoveryStage === 'code') {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto icon-container mb-4">
              <Mail className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Check Your Email</h2>
            <p className="text-muted-foreground text-sm mt-1">
              We sent a reset code to <span className="text-white">{recoveryEmail}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyToken} className="space-y-5">
            <div>
              <Label className="text-sm text-white mb-2 block">Reset Code</Label>
              <Input
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Enter 6-digit code"
                className="bg-[hsl(var(--input-background))] border border-border text-white focus:ring-2 focus:ring-primary text-center text-lg tracking-wider"
                disabled={loading}
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Check your spam folder if you don't see the email
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={handleRequestReset}
              disabled={loading}
              className="w-full text-center text-sm text-primary hover:underline disabled:opacity-50"
            >
              Didn't receive code? Resend
            </button>
          </form>
        </>
      );
    }

    if (recoveryStage === 'reset') {
      return (
        <>
          <div className="text-center mb-8">
            <div className="mx-auto icon-container mb-4">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Create New Password</h2>
            <p className="text-muted-foreground text-sm mt-1">Choose a strong password for your account</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <Label className="text-sm text-white mb-2 block">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 pr-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <Label className="text-sm text-white mb-2 block">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 pr-10 focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
              {loading ? (
                <Loader2 className="animate-spin mx-auto" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Background */}
      <div className="app-bg" />
      <div className="app-overlay" />

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-xl z-20 relative">
        <div className="flex items-center gap-3">
          <div className="icon-container">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold gradient-text">SMPMPS</h1>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Market Price Monitoring System
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <Card className="dark-glass animate-scaleIn">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="mx-auto icon-container mb-4">
                  <ShoppingCart className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label className="text-sm text-white mb-2 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-white mb-2 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-[hsl(var(--input-background))] border border-border text-white pl-10 pr-10 focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(c as boolean)}
                      className="border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={openRecoveryModal}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" disabled={loading} className="w-full btn-premium py-3 rounded-xl">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Sign In'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={openSignupModal}
                    className="text-primary font-semibold hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </form>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-muted-foreground text-sm border-t border-white/10 relative z-10">
        <p>© 2024 SMPMPS | Smart Market Price Monitoring System</p>
      </footer>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md">
            <Card className="dark-glass animate-scaleIn relative">
              <button
                aria-label="Close"
                onClick={closeSignupModal}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {(signupStage === 'code' || signupStage === 'details') && (
                <button
                  aria-label="Go back"
                  onClick={handleSignupBack}
                  className="absolute top-4 left-4 text-muted-foreground hover:text-white transition-colors z-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}

              <div className="p-8">
                {renderSignupContent()}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Account Recovery Modal */}
      {showAccountRecovery && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md">
            <Card className="dark-glass animate-scaleIn relative">
              <button
                aria-label="Close"
                onClick={closeRecoveryModal}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {(recoveryStage === 'code' || recoveryStage === 'reset') && (
                <button
                  aria-label="Go back"
                  onClick={handleRecoveryBack}
                  className="absolute top-4 left-4 text-muted-foreground hover:text-white transition-colors z-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}

              <div className="p-8">
                {renderRecoveryContent()}
              </div>
            </Card>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}