import { useEffect, useState } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import SaveProjectDialog from './components/SaveProjectDialog';
import ConfirmDeleteShapeDialog from './components/ConfirmDeleteShapeDialog';
import { useAuthStore } from './hooks/useAuthStore';
import { useDesignStore } from './hooks/useDesignStore';
import './App.css'

function App() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

  const isLoggedIn = useAuthStore((state) => state.user !== null);
  const blocks = useDesignStore((state) => state.blocks);
  const selectedBlockId = useDesignStore((state) => state.selectedBlockId);
  const project = useDesignStore((state) => state.project);
  const isDirty = useDesignStore((state) => state.isDirty);
  const addBlock = useDesignStore((state) => state.addBlock);
  const selectBlock = useDesignStore((state) => state.selectBlock);
  const updateSelectedColor = useDesignStore((state) => state.updateSelectedColor);
  const moveBlock = useDesignStore((state) => state.moveBlock);
  const scaleBlock = useDesignStore((state) => state.scaleBlock);
  const rotateBlock = useDesignStore((state) => state.rotateBlock);
  const removeBlock = useDesignStore((state) => state.removeBlock);

  useEffect(() => {
    fetch('http://localhost:8080/api/hello')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch from backend');
        return response.json();
      })
      .then((data: { message: string }) => setMessage(data.message))
      .catch((err) => setError(err.message));
  }, []);

  // The Delete key asks to delete the selected shape (not while typing or while a window is open).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete') return;
      if (selectedBlockId === null || isSaveDialogOpen || blockToDelete !== null) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }

      setBlockToDelete(selectedBlockId);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBlockId, isSaveDialogOpen, blockToDelete]);

  let saveStatus = '';
  if (isDirty) saveStatus = 'Unsaved changes.';
  else if (project) saveStatus = `Saved as "${project.name}".`;

  return (
    <div className="cad-container">
      <Topbar
        onSave={() => setIsSaveDialogOpen(true)}
        canSave={isLoggedIn}
        saveStatus={saveStatus}
      />
      <div className="cad-workspace">
        <Sidebar
          onAddBlock={addBlock}
          onUpdateColor={updateSelectedColor}
          transformMode={transformMode}
          onTransformModeChange={setTransformMode}
        />
        <Viewport
          error={error}
          message={message}
          blocks={blocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={selectBlock}
          onMoveBlock={moveBlock}
          onScaleBlock={scaleBlock}
          onRotateBlock={rotateBlock}
          onRequestDeleteBlock={setBlockToDelete}
          transformMode={transformMode}
        />
      </div>
      {isSaveDialogOpen && <SaveProjectDialog onClose={() => setIsSaveDialogOpen(false)} />}
      {blockToDelete !== null && (
        <ConfirmDeleteShapeDialog
          onConfirm={() => {
            removeBlock(blockToDelete);
            setBlockToDelete(null);
          }}
          onCancel={() => setBlockToDelete(null)}
        />
      )}
    </div>
  );
}

export default App
