import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface DataSaverContextType {
  isDataSaverEnabled: boolean;
  toggleDataSaver: () => void;
  imageQuality: 'high' | 'medium' | 'low';
  setImageQuality: (quality: 'high' | 'medium' | 'low') => void;
  isOffline: boolean;
  connectionType: string;
  effectiveType: string;
  saveData: boolean;
}

const DataSaverContext = createContext<DataSaverContextType | undefined>(undefined);

interface DataSaverProviderProps {
  children: ReactNode;
}

export function DataSaverProvider({ children }: DataSaverProviderProps) {
  const [isDataSaverEnabled, setIsDataSaverEnabled] = useState(() => {
    const saved = localStorage.getItem('dataSaverEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low'>(() => {
    const saved = localStorage.getItem('imageQuality');
    return (saved as 'high' | 'medium' | 'low') || 'high';
  });
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('4g');
  const [saveData, setSaveData] = useState(false);

  // Monitor network connection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Monitor network information
  useEffect(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
        setSaveData(connection.saveData || false);
        
        // Auto-enable data saver on slow connections
        if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
          setIsDataSaverEnabled(true);
          setImageQuality('low');
        }
      };
      
      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);
      
      return () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('dataSaverEnabled', JSON.stringify(isDataSaverEnabled));
  }, [isDataSaverEnabled]);

  useEffect(() => {
    localStorage.setItem('imageQuality', imageQuality);
  }, [imageQuality]);

  const toggleDataSaver = useCallback(() => {
    setIsDataSaverEnabled((prev: boolean) => !prev);
  }, []);

  const value: DataSaverContextType = {
    isDataSaverEnabled,
    toggleDataSaver,
    imageQuality,
    setImageQuality,
    isOffline,
    connectionType,
    effectiveType,
    saveData
  };

  return (
    <DataSaverContext.Provider value={value}>
      {children}
    </DataSaverContext.Provider>
  );
}

export function useDataSaver() {
  const context = useContext(DataSaverContext);
  if (context === undefined) {
    throw new Error('useDataSaver must be used within a DataSaverProvider');
  }
  return context;
}
