import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Shield, Mail, Smartphone, Key, Copy, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  generate2FABackupCodes,
  generate2FACode
} from '../lib/securityEnhancements';
import { sendVerificationSMSAPI } from '../lib/verificationAPI';

interface TwoFactorAuthProps {
  email: string;
  phone?: string;
  onVerify: (code: string, method: '2fa-email' | '2fa-sms' | '2fa-app') => Promise<void>;
  onCancel: () => void;
  isSetup?: boolean; // If true, user is setting up 2FA for first time
}

type TwoFAMethod = 'email' | 'sms' | 'app';

export function TwoFactorAuth({ 
  email, 
  phone, 
  onVerify, 
  onCancel,
  isSetup = false 
}: TwoFactorAuthProps) {
  const [method, setMethod] = useState<TwoFAMethod | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Setup: Generate backup codes
  const handleSetup2FA = () => {
    const codes = generate2FABackupCodes(10);
    setBackupCodes(codes);
    setShowBackupCodes(true);
    toast.success('Backup codes generated! Save them securely.');
  };

  // Send verification code
  const handleSendCode = async (selectedMethod: TwoFAMethod) => {
    setMethod(selectedMethod);
    setLoading(true);

    try {
      const generatedCode = generate2FACode();
      setVerificationCode(generatedCode);

      if (selectedMethod === 'email') {
        // In production, this would call an email API
        // For now, log the code (would be sent via email)
        console.log(`2FA Code for ${email}: ${generatedCode}`);
        toast.success(`2FA code sent to ${email}`);
      } else if (selectedMethod === 'sms' && phone) {
        // Send real SMS via Twilio
        const result = await sendVerificationSMSAPI(phone, 'User');
        if (result.success && result.code) {
          setVerificationCode(result.code);
          toast.success(`2FA code sent to ${phone}`);
        } else {
          toast.error(result.error || 'Failed to send SMS');
        }
      } else if (selectedMethod === 'app') {
        toast.info('Enter code from your authenticator app');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send 2FA code');
    } finally {
      setLoading(false);
    }
  };

  // Verify code
  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const methodMap = {
        'email': '2fa-email',
        'sms': '2fa-sms',
        'app': '2fa-app'
      } as const;

      await onVerify(code, methodMap[method!]);
      toast.success('2FA verified successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  // Copy backup codes
  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Backup codes copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const text = `SMPMPS - 2FA Backup Codes
Generated: ${new Date().toLocaleString()}
Email: ${email}

IMPORTANT: Store these codes securely!
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you lose access to your 2FA method, use one of these codes to sign in.
`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2fa-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded!');
  };

  // If setting up 2FA for first time
  if (isSetup && !showBackupCodes) {
    return (
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Enable Two-Factor Authentication
          </h2>
          <p className="text-muted-foreground text-sm">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="bg-green-950 border border-green-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-100 mb-2">Why enable 2FA?</h3>
          <ul className="text-xs text-green-300 space-y-1 list-disc list-inside">
            <li>Protect your account from unauthorized access</li>
            <li>Get notified of suspicious login attempts</li>
            <li>Required for vendor and admin roles</li>
            <li>Industry-standard security practice</li>
          </ul>
        </div>

        <Button
          onClick={handleSetup2FA}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <Shield className="h-4 w-4 mr-2" />
          Setup 2FA
        </Button>

        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full mt-3"
        >
          Skip for Now
        </Button>
      </Card>
    );
  }

  // Show backup codes
  if (showBackupCodes) {
    return (
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 p-4 rounded-2xl shadow-lg inline-block mb-4">
            <Key className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Save Your Backup Codes
          </h2>
          <p className="text-muted-foreground text-sm">
            Store these codes securely. You'll need them if you lose access to your 2FA method.
          </p>
        </div>

        <div className="bg-green-950 border-2 border-green-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-green-300" />
            <p className="font-semibold text-green-100">
              ⚠️ IMPORTANT - Save These Codes
            </p>
          </div>
          <ul className="text-xs text-green-300 space-y-1 list-disc list-inside">
            <li>Each code can only be used once</li>
            <li>Store them in a secure password manager</li>
            <li>Never share these codes with anyone</li>
            <li>Download or copy them now - you won't see them again</li>
          </ul>
        </div>

        <div className="bg-secondary border border-accent rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code, index) => (
              <div key={index} className="bg-card border border-gray-300 rounded px-2 py-1 text-center">
                {code}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleCopyBackupCodes}
            variant="outline"
            className="flex-1"
          >
            {copiedCode ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </>
            )}
          </Button>

          <Button
            onClick={handleDownloadBackupCodes}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <Button
          onClick={() => {
            setShowBackupCodes(false);
            toast.success('2FA setup complete! Choose a verification method.');
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          Continue to Verification
        </Button>
      </Card>
    );
  }

  // Choose verification method
  if (!method) {
    return (
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-muted-foreground text-sm">
            Choose how you'd like to receive your verification code
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <Button
            onClick={() => handleSendCode('email')}
            variant="outline"
            className="w-full h-auto py-4 flex items-start gap-3 hover:bg-green-950 hover:border-green-600"
          >
            <Mail className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="text-left">
              <div className="font-semibold">Email</div>
              <div className="text-xs text-muted-foreground">
                Send code to {email}
              </div>
            </div>
          </Button>

          {phone && (
            <Button
              onClick={() => handleSendCode('sms')}
              variant="outline"
              className="w-full h-auto py-4 flex items-start gap-3 hover:bg-green-50 hover:border-green-500"
            >
              <Smartphone className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <div className="font-semibold">SMS</div>
                <div className="text-xs text-muted-foreground">
                  Send code to {phone}
                </div>
              </div>
            </Button>
          )}

          <Button
            onClick={() => handleSendCode('app')}
            variant="outline"
            className="w-full h-auto py-4 flex items-start gap-3 hover:bg-green-950 hover:border-green-600"
          >
            <Key className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="text-left">
              <div className="font-semibold">Authenticator App</div>
              <div className="text-xs text-muted-foreground">
                Use Google Authenticator or similar
              </div>
            </div>
          </Button>
        </div>

        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full"
        >
          Cancel
        </Button>
      </Card>
    );
  }

  // Verify code
  return (
    <Card className="w-full max-w-md p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className={`bg-gradient-to-br p-4 rounded-2xl shadow-lg inline-block mb-4 ${
          method === 'email' 
            ? 'from-blue-500 to-indigo-600'
            : method === 'sms'
            ? 'from-green-500 to-emerald-600'
            : 'from-purple-500 to-pink-600'
        }`}>
          {method === 'email' ? (
            <Mail className="h-10 w-10 text-white" />
          ) : method === 'sms' ? (
            <Smartphone className="h-10 w-10 text-white" />
          ) : (
            <Key className="h-10 w-10 text-white" />
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">
          Enter Verification Code
        </h2>
        <p className="text-muted-foreground text-sm">
          {method === 'email' && `Code sent to ${email}`}
          {method === 'sms' && `Code sent to ${phone}`}
          {method === 'app' && 'Enter code from your authenticator app'}
        </p>
      </div>

      <div className="mb-4">
        <Label htmlFor="2fa-code">6-digit code</Label>
        <Input
          id="2fa-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="mt-1.5 text-center text-2xl font-mono tracking-widest"
          autoFocus
        />
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Verify Code
            </>
          )}
        </Button>

        <Button
          onClick={() => setMethod(null)}
          variant="outline"
          className="w-full"
        >
          Try Different Method
        </Button>

        <Button
          onClick={onCancel}
          variant="ghost"
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}

