import { useLibraryStore } from '../stores/libraryStore';
import { libraryService } from '../services/LibraryService';

export function useLibrary() {
  const library = useLibraryStore();

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

  return {
    ...library,
    addFiles,
    removeTrack,
  };
}
