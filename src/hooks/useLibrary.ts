import { useLibraryStore } from '../stores/libraryStore';
import { libraryService } from '../services/LibraryService';
import { Track } from '../types';

export function useLibrary() {
  const library = useLibraryStore();

  const loadLibrary = async () => {
    library.setLibraryLoading(true);
    try {
      return await libraryService.loadLibrary();
    } finally {
      library.setLibraryLoading(false);
    }
  };

  const addFiles = async (files: File[]) => {
    library.setLibraryLoading(true);
    try {
      await libraryService.addFiles(files);
    } finally {
      library.setLibraryLoading(false);
    }
  };

  const removeTrack = async (id: string) => {
    await libraryService.removeTrack(id);
  };

  const updateTrack = async (track: Track) => {
    await libraryService.updateTrack(track);
  };

  return {
    ...library,
    loadLibrary,
    addFiles,
    removeTrack,
    updateTrack,
  };
}
