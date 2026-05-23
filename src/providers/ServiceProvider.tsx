import React, { createContext, useContext, useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { initDB } from '../storage/db';
import { libraryService } from '../services/LibraryService';
import { assetLoaderService } from '../services/AssetLoaderService';

interface ServiceContextType {
  // We can add service instances here if we want to provide them via context
  // but they are already singletons exported from their modules.
}

const ServiceContext = createContext<ServiceContextType | null>(null);

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setInitializing, setInitProgress, setInitStatus, setModelLoaded, setHeadphoneDBLoaded } = useUIStore();

  useEffect(() => {
    const initialize = async () => {
      try {
        setInitStatus('Opening Database...');
        setInitProgress(10);
        await initDB();

        setInitStatus('Loading Track Library...');
        setInitProgress(30);
        await libraryService.loadLibrary();

        setInitStatus('Downloading Headphone Database...');
        setInitProgress(50);
        const dbBuffer = await assetLoaderService.loadAutoEQDB();
        if (dbBuffer) {
          setHeadphoneDBLoaded(true);
        } else {
          console.warn('Proceeding without Headphone Database.');
        }

        setInitStatus('Loading Smart EQ Model...');
        setInitProgress(80);
        await assetLoaderService.loadModel();
        setModelLoaded(true);

        setInitStatus('Ready');
        setInitProgress(100);
        
        // Brief delay for the user to see the "Ready" state
        setTimeout(() => {
          setInitializing(false);
        }, 500);

      } catch (err) {
        console.error('Initialization failed:', err);
        setInitStatus('Initialization Failed. See console.');
      }
    };

    initialize();
  }, []);

  return (
    <ServiceContext.Provider value={{}}>
      {children}
    </ServiceContext.Provider>
  );
};
