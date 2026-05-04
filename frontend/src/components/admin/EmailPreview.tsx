import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, Eye, Download, Send, Globe } from 'lucide-react';
import { Flag } from '../ui/flags';
import { 
  generateVerificationEmailHTML, 
  generateWelcomeEmailHTML,
  generate2FAEmailHTML,
  generatePasswordResetEmailHTML,
  type EmailLanguage 
} from '../../lib/emailTemplates';

export function EmailPreview() {
  const [language, setLanguage] = useState<EmailLanguage>('en');
  const [userName, setUserName] = useState('John Doe');
  const [verificationCode, setVerificationCode] = useState('123456');
  const [emailType, setEmailType] = useState<'verification' | 'welcome' | '2fa' | 'reset'>('verification');
  const [resetLink, setResetLink] = useState('http://localhost:5173/reset-password?token=demo-reset-token');

  const getEmailHTML = () => {
    switch (emailType) {
      case 'verification':
        return generateVerificationEmailHTML(userName, verificationCode, language, 1);
      case 'welcome':
        return generateWelcomeEmailHTML(userName, language);
      case '2fa':
        return generate2FAEmailHTML(userName, verificationCode, language);
      case 'reset':
        return generatePasswordResetEmailHTML(userName, verificationCode, resetLink, language, 60);
      default:
        return '';
    }
  };

  const downloadHTML = () => {
    const html = getEmailHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${emailType}-email-${language}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openPreviewWindow = () => {
    const html = getEmailHTML();
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(html);
      previewWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-2 flex items-center gap-2"><Mail className="h-5 w-5" /> Email Template Preview</h2>
          <p className="text-sm text-muted-foreground">
            Preview and customize email templates in all supported languages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openPreviewWindow}>
            <Eye className="h-4 w-4 mr-2" />
            Open Preview
          </Button>
          <Button variant="outline" onClick={downloadHTML}>
            <Download className="h-4 w-4 mr-2" />
            Download HTML
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="emailType">Email Type</Label>
            <Select value={emailType} onValueChange={(v) => setEmailType(v as any)}>
              <SelectTrigger id="emailType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verification">Verification Email</SelectItem>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="2fa">2FA Code Email</SelectItem>
                <SelectItem value="reset">Reset Password Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as EmailLanguage)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en"><span className="flex items-center gap-2"><Flag country="uk" className="w-5 h-4" /> English</span></SelectItem>
                <SelectItem value="rw"><span className="flex items-center gap-2"><Flag country="rw" className="w-5 h-4" /> Kinyarwanda</span></SelectItem>
                <SelectItem value="fr"><span className="flex items-center gap-2"><Flag country="fr" className="w-5 h-4" /> French</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        </div>

        {(emailType === 'verification' || emailType === '2fa' || emailType === 'reset') && (
          <div className="mb-6">
            <Label htmlFor="code">{emailType === 'reset' ? 'Reset Code' : 'Verification Code'}</Label>
            <Input
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="max-w-xs"
            />
          </div>
        )}

        {emailType === 'reset' && (
          <div className="mb-6">
            <Label htmlFor="resetLink">Reset Link</Label>
            <Input
              id="resetLink"
              value={resetLink}
              onChange={(e) => setResetLink(e.target.value)}
              placeholder="http://localhost:5173/reset-password?token=..."
            />
          </div>
        )}

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Visual Preview
            </TabsTrigger>
            <TabsTrigger value="html">
              <Mail className="h-4 w-4 mr-2" />
              HTML Source
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div className="border-2 border-dashed rounded-lg p-4 bg-secondary">
              <div 
                className="bg-card rounded-lg shadow-lg overflow-auto"
                style={{ maxHeight: '600px' }}
                dangerouslySetInnerHTML={{ __html: getEmailHTML() }}
              />
            </div>
          </TabsContent>

          <TabsContent value="html" className="mt-4">
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto" style={{ maxHeight: '600px' }}>
              <pre className="text-xs">
                <code>{getEmailHTML()}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Email Type</div>
          <div className="text-2xl font-bold capitalize">{emailType}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Language</div>
          <div className="text-2xl font-bold flex items-center gap-2">
            {language === 'en' ? <><Flag country="uk" className="w-6 h-4" /> EN</> : language === 'rw' ? <><Flag country="rw" className="w-6 h-4" /> RW</> : <><Flag country="fr" className="w-6 h-4" /> FR</>}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">HTML Size</div>
          <div className="text-2xl font-bold">
            {(getEmailHTML().length / 1024).toFixed(1)} KB
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="text-2xl font-bold text-green-600">✓ Ready</div>
        </Card>
      </div>

      {/* Email Features */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">✨ Email Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-100">✓</span>
            </div>
            <div>
              <div className="font-medium">Multi-Language Support</div>
              <div className="text-sm text-muted-foreground">English, Kinyarwanda, French</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-100">✓</span>
            </div>
            <div>
              <div className="font-medium">Responsive Design</div>
              <div className="text-sm text-muted-foreground">Mobile & desktop optimized</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-100">✓</span>
            </div>
            <div>
              <div className="font-medium">Brand Colors</div>
              <div className="text-sm text-muted-foreground">Matches app color scheme</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-100">✓</span>
            </div>
            <div>
              <div className="font-medium">Security Features</div>
              <div className="text-sm text-muted-foreground">Warnings & expiry notices</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-100">✓</span>
            </div>
            <div>
              <div className="font-medium">Beautiful Gradients</div>
              <div className="text-sm text-muted-foreground">Eye-catching design</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-100">✓</span>
            </div>
            <div>
              <div className="font-medium">Clear Instructions</div>
              <div className="text-sm text-muted-foreground">Step-by-step guidance</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Comparison */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-4 w-4" /> Multi-Language Translation Quality</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Flag country="uk" className="w-8 h-6" />
              <div>
                <div className="font-medium">English</div>
                <div className="text-sm text-muted-foreground">Primary language</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">100%</div>
              <span className="text-green-600">✓</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Flag country="rw" className="w-8 h-6" />
              <div>
                <div className="font-medium">Kinyarwanda</div>
                <div className="text-sm text-muted-foreground">Native translation</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">100%</div>
              <span className="text-green-600">✓</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Flag country="fr" className="w-8 h-6" />
              <div>
                <div className="font-medium">French</div>
                <div className="text-sm text-muted-foreground">Professional translation</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">100%</div>
              <span className="text-green-600">✓</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
