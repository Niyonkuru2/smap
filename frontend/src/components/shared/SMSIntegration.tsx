import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { 
  MessageSquare, 
  Phone, 
  Bell, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Send,
  Smartphone,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

// Hardcoded production URL for Render deployment
const API_URL = (() => {
  // For production Render deployment
  if (typeof window !== 'undefined' && window.location.hostname === 'smpmps-test.onrender.com') {
    return 'https://smpmps-test-1.onrender.com';
  }
  // Fall back to env variable or local development
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
})();

interface SMSPreferences {
  enabled: boolean;
  phoneNumber: string;
  language: 'en' | 'rw' | 'fr';
  priceAlerts: boolean;
  dailyDigest: boolean;
  marketUpdates: boolean;
}

export default function SMSIntegration() {
  const { t } = useLanguage();
  const [preferences, setPreferences] = useState<SMSPreferences>({
    enabled: false,
    phoneNumber: '',
    language: 'en',
    priceAlerts: true,
    dailyDigest: false,
    marketUpdates: true
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [testMessage, setTestMessage] = useState('PRICE TOMATOES');

  const handleRegister = async () => {
    if (!preferences.phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications/sms/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_session')}`
        },
        body: JSON.stringify({
          phoneNumber: preferences.phoneNumber,
          language: preferences.language
        })
      });

      if (response.ok) {
        setIsVerifying(true);
        toast.success('Verification code sent to your phone');
      } else {
        toast.error('Failed to send verification code');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/verify/sms/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: preferences.phoneNumber,
          code: verificationCode
        })
      });

      if (response.ok) {
        setIsVerified(true);
        setIsVerifying(false);
        toast.success('Phone number verified successfully!');
      } else {
        toast.error('Invalid verification code');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    }
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast.success('Command copied to clipboard');
  };

  const smsCommands = [
    { command: 'PRICE [product]', example: 'PRICE TOMATOES', description: 'Get prices for a product across all markets' },
    { command: 'MARKET [name]', example: 'MARKET MUSANZE', description: 'Get all prices in a specific market' },
    { command: 'ALERT [product] [price]', example: 'ALERT RICE 1000', description: 'Get notified when price drops below target' },
    { command: 'COMPARE [product]', example: 'COMPARE BEANS', description: 'Compare prices across markets' },
    { command: 'HELP', example: 'HELP', description: 'Get list of all available commands' },
    { command: 'STOP', example: 'STOP', description: 'Unsubscribe from all SMS alerts' }
  ];

  const ussdMenu = [
    { code: '*123#', description: 'Main menu - Access all features' },
    { code: '*123*1#', description: 'Search product prices' },
    { code: '*123*2#', description: 'Browse markets' },
    { code: '*123*3#', description: 'Set price alerts' },
    { code: '*123*4#', description: 'View your alerts' },
    { code: '*123*0#', description: 'Help & support' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
          <MessageSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground dark:text-white">SMS & USSD Integration</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Access market prices without internet</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Phone Registration */}
        <Card className="border-2 border-dashed border-accent dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Registration
            </CardTitle>
            <CardDescription>
              Register your phone number to receive price updates via SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+250 7XX XXX XXX"
                  value={preferences.phoneNumber}
                  onChange={(e) => setPreferences(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  disabled={isVerified}
                />
                {isVerified && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            {isVerifying && !isVerified && (
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                  />
                  <Button onClick={handleVerify}>Verify</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Preferred Language</Label>
              <div className="flex gap-2">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'rw', label: 'Kinyarwanda' },
                  { code: 'fr', label: 'Français' }
                ].map((lang) => (
                  <Button
                    key={lang.code}
                    variant={preferences.language === lang.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreferences(prev => ({ ...prev, language: lang.code as any }))}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {!isVerified && !isVerifying && (
              <Button onClick={handleRegister} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Verification Code
              </Button>
            )}
          </CardContent>
        </Card>

        {/* SMS Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Choose what updates you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Price Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when prices change</p>
              </div>
              <Switch
                checked={preferences.priceAlerts}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, priceAlerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Digest</Label>
                <p className="text-sm text-gray-500">Daily summary of market prices</p>
              </div>
              <Switch
                checked={preferences.dailyDigest}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, dailyDigest: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Market Updates</Label>
                <p className="text-sm text-gray-500">Important market announcements</p>
              </div>
              <Switch
                checked={preferences.marketUpdates}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketUpdates: checked }))}
              />
            </div>

            <Button variant="outline" className="w-full mt-4" disabled={!isVerified}>
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* SMS Commands Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            SMS Commands
          </CardTitle>
          <CardDescription>
            Send these commands to our SMS number to get price information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {smsCommands.map((cmd, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-secondary dark:bg-gray-800 border border-accent dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono font-semibold text-green-600 dark:text-green-400">
                    {cmd.command}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCommand(cmd.example)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{cmd.description}</p>
                <div className="text-xs font-mono text-gray-500 bg-secondary dark:bg-gray-900 px-2 py-1 rounded">
                  Example: {cmd.example}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* USSD Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            USSD Menu
          </CardTitle>
          <CardDescription>
            Dial these codes to access the interactive menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ussdMenu.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
              >
                <div className="flex-shrink-0 w-20">
                  <code className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                    {item.code}
                  </code>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <CardTitle>Test SMS Command</CardTitle>
          <CardDescription>
            Preview how a command response would look
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>SMS Command</Label>
              <div className="flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value.toUpperCase())}
                  placeholder="Enter command..."
                />
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Preview Response
                </Button>
              </div>
            </div>
          </div>
          
          {/* Sample Response Preview */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg text-green-400 font-mono text-sm">
            <p className="mb-2">📱 From: SMPMPS</p>
            <div className="border-t border-gray-700 pt-2">
              <p>TOMATOES Prices:</p>
              <p>Musanze: 800 RWF/kg</p>
              <p>Kimironko: 850 RWF/kg</p>
              <p>Nyabugogo: 750 RWF/kg</p>
              <p className="text-gray-500 mt-2">Updated today.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

