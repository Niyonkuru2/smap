import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

export default function DataExport() {
  const { t } = useLanguage();

  const handleExport = (format: string) => {
    toast.success(`Exporting data as ${format}...`);
    // In a real app, this would trigger actual export
  };

  const exportOptions = [
    {
      format: 'CSV',
      description: 'Comma-separated values for spreadsheet apps',
      icon: FileSpreadsheet,
      color: 'text-emerald-400'
    },
    {
      format: 'Excel',
      description: 'Microsoft Excel format (.xlsx)',
      icon: FileSpreadsheet,
      color: 'text-emerald-400'
    },
    {
      format: 'PDF',
      description: 'Portable Document Format for reports',
      icon: FileText,
      color: 'text-primary'
    },
    {
      format: 'JSON',
      description: 'JavaScript Object Notation for developers',
      icon: File,
      color: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 gradient-text text-2xl font-bold">Data Export</h2>
        <p className="text-muted-foreground text-sm">
          Export your price data in various formats
        </p>
      </div>

      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white text-lg">Export Options</CardTitle>
          <CardDescription className="text-muted-foreground">
            Choose your preferred export format
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div 
                  key={option.format} 
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Icon className={`h-5 w-5 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{option.format}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                      <Button
                        onClick={() => handleExport(option.format)}
                        size="sm"
                        className="mt-3 btn-outline-premium"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export as {option.format}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white text-lg">Export History</CardTitle>
          <CardDescription className="text-muted-foreground">
            Your recent exports
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Download className="h-8 w-8 text-muted-foreground opacity-30" />
            </div>
            <p className="text-muted-foreground">No export history</p>
            <p className="text-sm text-muted-foreground mt-1">Your exports will appear here</p>
          </div>
        </CardContent>
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
      `}</style>
    </div>
  );
}