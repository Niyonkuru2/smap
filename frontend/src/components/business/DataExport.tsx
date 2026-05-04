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
      color: 'text-green-500'
    },
    {
      format: 'Excel',
      description: 'Microsoft Excel format (.xlsx)',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    },
    {
      format: 'PDF',
      description: 'Portable Document Format for reports',
      icon: FileText,
      color: 'text-green-500'
    },
    {
      format: 'JSON',
      description: 'JavaScript Object Notation for developers',
      icon: File,
      color: 'text-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Data Export</h2>
        <p className="text-muted-foreground text-sm">
          Export your price data in various formats
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Choose your preferred export format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.format} className="p-4 border rounded-lg hover:bg-secondary transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-6 w-6 ${option.color}`} />
                    <div className="flex-1">
                      <p>{option.format}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                      <Button
                        onClick={() => handleExport(option.format)}
                        size="sm"
                        className="mt-3"
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

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>
            Your recent exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No export history</p>
            <p className="text-sm mt-1">Your exports will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

