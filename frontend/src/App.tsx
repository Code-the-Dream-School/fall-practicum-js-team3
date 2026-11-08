import { useEffect, useState } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import SaveProjectDialog from './components/SaveProjectDialog';
import { useAuthStore } from './hooks/useAuthStore';
import { useDesignStore } from './hooks/useDesignStore';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate');

  const user = useAuthStore((state) => state.user);
  const isLoggedIn = user !== null;
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

  useEffect(() => {
    fetch('http://localhost:8080/api/hello')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch from backend');
        return response.json();
      })
      .then((data: { message: string }) => setMessage(data.message))
      .catch((err) => setError(err.message));
  }, []);

  let saveStatus = '';
  if (isDirty) saveStatus = 'Unsaved changes.';
  else if (project && user && project.userId === user.id) saveStatus = `Saved as "${project.name}".`;

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
          transformMode={transformMode}
        />
      </div>
      {isSaveDialogOpen && <SaveProjectDialog onClose={() => setIsSaveDialogOpen(false)} />}
    </div>
  );
}

export default App;
