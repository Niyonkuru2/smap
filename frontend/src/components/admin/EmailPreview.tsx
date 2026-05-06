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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="mb-2 flex items-center gap-2 gradient-text">
            <Mail className="h-5 w-5 text-primary" /> Email Template Preview
          </h2>
          <p className="text-sm text-muted-foreground">
            Preview and customize email templates in all supported languages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openPreviewWindow} className="btn-outline-premium">
            <Eye className="h-4 w-4 mr-2" />
            Open Preview
          </Button>
          <Button variant="outline" onClick={downloadHTML} className="btn-outline-premium">
            <Download className="h-4 w-4 mr-2" />
            Download HTML
          </Button>
        </div>
      </div>

      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label className="text-white">Email Type</Label>
            <Select value={emailType} onValueChange={(v) => setEmailType(v as any)}>
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark-glass border-white/10">
                <SelectItem value="verification">Verification Email</SelectItem>
                <SelectItem value="welcome">Welcome Email</SelectItem>
                <SelectItem value="2fa">2FA Code Email</SelectItem>
                <SelectItem value="reset">Reset Password Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Language</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as EmailLanguage)}>
              <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark-glass border-white/10">
                <SelectItem value="en"><span className="flex items-center gap-2"><Flag country="uk" className="w-5 h-4" /> English</span></SelectItem>
                <SelectItem value="rw"><span className="flex items-center gap-2"><Flag country="rw" className="w-5 h-4" /> Kinyarwanda</span></SelectItem>
                <SelectItem value="fr"><span className="flex items-center gap-2"><Flag country="fr" className="w-5 h-4" /> French</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">User Name</Label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="John Doe"
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {(emailType === 'verification' || emailType === '2fa' || emailType === 'reset') && (
          <div className="mb-6">
            <Label className="text-white">{emailType === 'reset' ? 'Reset Code' : 'Verification Code'}</Label>
            <Input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="max-w-xs mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
        )}

        {emailType === 'reset' && (
          <div className="mb-6">
            <Label className="text-white">Reset Link</Label>
            <Input
              value={resetLink}
              onChange={(e) => setResetLink(e.target.value)}
              placeholder="http://localhost:5173/reset-password?token=..."
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>
        )}

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 dark-glass border-white/10 p-1">
            <TabsTrigger value="preview" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white">
              <Eye className="h-4 w-4 mr-2" />
              Visual Preview
            </TabsTrigger>
            <TabsTrigger value="html" className="tab-trigger-premium data-[state=active]:bg-primary data-[state=active]:text-white">
              <Mail className="h-4 w-4 mr-2" />
              HTML Source
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-4">
            <div className="border border-white/10 rounded-lg p-4 bg-white/5">
              <div 
                className="rounded-lg shadow-lg overflow-auto"
                style={{ maxHeight: '600px' }}
                dangerouslySetInnerHTML={{ __html: getEmailHTML() }}
              />
            </div>
          </TabsContent>

          <TabsContent value="html" className="mt-4">
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-auto border border-white/10" style={{ maxHeight: '600px' }}>
              <pre className="text-xs">
                <code className="text-emerald-400">{getEmailHTML()}</code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="text-sm text-muted-foreground mb-1">Email Type</div>
          <div className="text-2xl font-bold capitalize gradient-text">{emailType}</div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="text-sm text-muted-foreground mb-1">Language</div>
          <div className="text-2xl font-bold flex items-center gap-2 text-white">
            {language === 'en' ? <><Flag country="uk" className="w-6 h-4" /> EN</> : language === 'rw' ? <><Flag country="rw" className="w-6 h-4" /> RW</> : <><Flag country="fr" className="w-6 h-4" /> FR</>}
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="text-sm text-muted-foreground mb-1">HTML Size</div>
          <div className="text-2xl font-bold text-white">
            {(getEmailHTML().length / 1024).toFixed(1)} KB
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="text-2xl font-bold text-emerald-400">✓ Ready</div>
        </Card>
      </div>

      {/* Email Features */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="font-semibold mb-4 gradient-text">✨ Email Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">✓</span>
            </div>
            <div>
              <div className="font-medium text-white">Multi-Language Support</div>
              <div className="text-sm text-muted-foreground">English, Kinyarwanda, French</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">✓</span>
            </div>
            <div>
              <div className="font-medium text-white">Responsive Design</div>
              <div className="text-sm text-muted-foreground">Mobile & desktop optimized</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">✓</span>
            </div>
            <div>
              <div className="font-medium text-white">Brand Colors</div>
              <div className="text-sm text-muted-foreground">Matches app color scheme</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">✓</span>
            </div>
            <div>
              <div className="font-medium text-white">Security Features</div>
              <div className="text-sm text-muted-foreground">Warnings & expiry notices</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">✓</span>
            </div>
            <div>
              <div className="font-medium text-white">Beautiful Gradients</div>
              <div className="text-sm text-muted-foreground">Eye-catching design</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-sm">✓</span>
            </div>
            <div>
              <div className="font-medium text-white">Clear Instructions</div>
              <div className="text-sm text-muted-foreground">Step-by-step guidance</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Language Comparison */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2 gradient-text">
          <Globe className="h-4 w-4" /> Multi-Language Translation Quality
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Flag country="uk" className="w-8 h-6" />
              <div>
                <div className="font-medium text-white">English</div>
                <div className="text-sm text-muted-foreground">Primary language</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">100%</div>
              <span className="text-emerald-400">✓</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Flag country="rw" className="w-8 h-6" />
              <div>
                <div className="font-medium text-white">Kinyarwanda</div>
                <div className="text-sm text-muted-foreground">Native translation</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">100%</div>
              <span className="text-emerald-400">✓</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <Flag country="fr" className="w-8 h-6" />
              <div>
                <div className="font-medium text-white">French</div>
                <div className="text-sm text-muted-foreground">Professional translation</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">100%</div>
              <span className="text-emerald-400">✓</span>
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--foreground));
          transition: all 0.2s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .tab-trigger-premium {
          transition: all 0.2s ease;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }

        .tab-trigger-premium:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .tab-trigger-premium[data-state="active"] {
          background: hsl(var(--primary));
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}