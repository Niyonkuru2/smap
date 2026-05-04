import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Smartphone, Loader2, AlertCircle, CheckCircle2, Clock, ArrowLeft, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from './ui/dialog';

interface PhoneVerificationProps {
  phone: string;
  email: string;
  userName: string;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
  onResend?: () => Promise<void>;
}

export function PhoneVerification({
  phone,
  email,
  userName,
  onVerify,
  onCancel,
  onResend
}: PhoneVerificationProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timer, setTimer] = useState(60); // 1 minute
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(30); // 30 seconds cooldown

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (attempts >= 3) {
      setError('Too many attempts. Please request a new code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onVerify(code);
      // Success handled by parent
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setResending(true);
    setError('');

    try {
      if (onResend) {
        await onResend();
      }
      setTimer(60); // Reset to 1 minute
      setResendTimer(30); // Reset cooldown
      setCanResend(false);
      setAttempts(0); // Reset attempts
      setCode(''); // Clear input
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
    setCode(digitsOnly);
    setError('');
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-2xl bg-card">
      <Button
        onClick={onCancel}
        variant="ghost"
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Sign Up
      </Button>

      <div className="flex flex-col items-center mb-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg mb-4">
          <Smartphone className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">
          Phone Verification
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          We sent a 6-digit code to
        </p>
        <p className="text-center font-semibold text-lg">
          {phone}
        </p>
      </div>

      {/* Timer Display */}
      <div className="bg-green-950 border border-green-700 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-300">Code expires in:</span>
        </div>
        <span className={`font-mono font-bold ${timer < 60 ? 'text-green-400' : 'text-green-500'
          }`}>
          {formatTime(timer)}
        </span>
      </div>

      {/* Code Input */}
      <div className="mb-4">
        <Label htmlFor="sms-code" className="mb-2">
          Enter 6-digit code
        </Label>
        <Input
          id="sms-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          placeholder="000000"
          className="text-center text-2xl font-mono tracking-widest"
          disabled={timer === 0 || attempts >= 3}
          autoFocus
        />
        {error && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>

      {/* Attempts Remaining */}
      {attempts > 0 && attempts < 3 && (
        <div className="mb-4 p-2 bg-green-950 border border-green-700 rounded text-xs text-green-300 text-center">
          ⚠️ {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
        </div>
      )}

      {/* Expired Warning */}
      {timer === 0 && (
        <div className="mb-4 p-2 bg-green-950 border border-green-700 rounded text-xs text-green-300 text-center flex items-center justify-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Code expired. Please request a new one.
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={handleVerify}
          disabled={loading || code.length !== 6 || timer === 0 || attempts >= 3}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify Phone Number
            </>
          )}
        </Button>

        <Button
          onClick={handleResend}
          disabled={!canResend || resending}
          variant="outline"
          className="w-full"
        >
          {resending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : !canResend ? (
            <>
              Resend Code ({resendTimer}s)
            </>
          ) : (
            <>
              Resend Code
            </>
          )}
        </Button>
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
          Didn't receive the code?
        </Button>
      </div>

      {/* Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="bg-green-950 border border-green-700">
          <DialogHeader>
            <DialogTitle className="text-green-300 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Didn't receive the code?
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-green-200 space-y-3">
            <div className="space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Check your phone messages</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Make sure the phone number is correct</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Wait before requesting a new code</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span>Contact support if issues persist</span>
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

