import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Mail, CheckCircle, RefreshCw, Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateVerificationCode } from '../lib/emailValidation';
import { useLanguage } from '../contexts/LanguageContext';
import { sendVerificationEmailAPI } from '../lib/verificationAPI';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import type { EmailLanguage } from '../lib/emailTemplates';

interface EmailVerificationProps {
  email: string;
  userName: string;
  verificationCode: string;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
}

export function EmailVerification({
  email,
  userName,
  verificationCode,
  onVerify,
  onCancel
}: EmailVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute
  const [showConsoleHelp, setShowConsoleHelp] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Show resend warning after 30 seconds
    const timer = setTimeout(() => {
      if (timeRemaining > 0) {
        toast.info('Still waiting? Check your spam folder or wait for the resend button.');
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);

    try {
      await onVerify(code);
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const newCode = generateVerificationCode();
      // Get current language and convert to EmailLanguage type
      const emailLang = (language === 'en' ? 'en' : language === 'rw' ? 'rw' : 'fr') as EmailLanguage;
      const result = await sendVerificationEmailAPI(email, userName, newCode, emailLang);

      if (result.success) {
        toast.success('Verification code resent! Check your email.');
        setTimeRemaining(60); // Reset to 1 minute
        setCode(''); // Clear input
      } else {
        if (result.demoMode) {
          toast.warning(result.message || 'Email service not configured. Running in demo mode.');
        } else {
          toast.error(result.message || 'Failed to resend code. Please try again.');
        }
      }
    } catch (error) {
      toast.error('Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <Button
        onClick={onCancel}
        variant="ghost"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sign Up
      </Button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-green-400" />
        </div>
        <h2 className="mb-2">Verify Your Email</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to
        </p>
        <p className="font-semibold text-green-400 mt-1">{email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="verificationCode">Verification Code</Label>
          <Input
            id="verificationCode"
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            className="text-center text-2xl tracking-widest mt-1.5"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the 6-digit code from your email
          </p>
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between p-3 bg-green-900 border border-green-700 rounded-lg">
          <span className="text-sm text-green-200">Code expires in:</span>
          <span className="font-semibold text-green-300">
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Email
            </>
          )}
        </Button>

        {/* Resend Button */}
        <Button
          variant="outline"
          onClick={handleResend}
          disabled={resending || timeRemaining > 30}
          className="w-full"
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Resending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Code
            </>
          )}
        </Button>

        {timeRemaining > 30 && (
          <p className="text-xs text-muted-foreground text-center">
            You can resend the code after 30 seconds
          </p>
        )}
      </div>

      {/* Help Button */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHelpModal(true)}
          className="text-green-400 hover:text-green-300 hover:bg-green-900/30"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Didn't receive the email?
        </Button>
      </div>

      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="bg-green-950 border border-green-700">
          <DialogHeader>
            <DialogTitle className="text-green-300 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Didn't receive the email?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-green-200 space-y-3">
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Check your spam/junk folder</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Make sure the email address is correct</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Wait a few minutes for delivery</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Click "Resend Code" to try again</span>
              </p>
            </div>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={() => setShowHelpModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </Card>
  );
}
