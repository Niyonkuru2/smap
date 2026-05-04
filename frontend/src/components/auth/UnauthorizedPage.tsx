import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { ShieldAlert, Home, LogIn } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-900">
      <div className="text-center p-8 max-w-md">
        <div className="icon-container mx-auto mb-6 w-20 h-20">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          <Button onClick={() => navigate('/login')}>
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;