import { useEffect, useState } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import './App.css'

type BlockType =
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'pyramid'
  | 'torus';
interface Block {
  id: number;
  type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'pyramid' | 'torus';
  color: string;
  position: { x: number; y: number; z: number };
}

const SHAPE_COLORS: Record<BlockType, string> = {
  cube: '#0ea5e9',
  sphere: '#ef4444',
  cylinder: '#10b981',
  cone: '#eab308',
  pyramid: '#a855f7',
  torus: '#f97316',
};

const SAVED_PROJECT_KEY = 'blockcad.project.v1';

function isBlock(value: unknown): value is Block {
  if (!value || typeof value !== 'object') return false;

  const block = value as Partial<Block>;
  const position = block.position;
  return (
    Number.isSafeInteger(block.id) &&
    ['cube', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus'].includes(String(block.type)) &&
    typeof block.color === 'string' &&
    /^#[\da-f]{6}$/i.test(block.color) &&
    !!position &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(position.z)
  );
}

function readSavedBlocks(): Block[] {
  try {
    const savedProject = localStorage.getItem(SAVED_PROJECT_KEY);
    if (!savedProject) return [];

    const parsed: unknown = JSON.parse(savedProject);
    if (!parsed || typeof parsed !== 'object') return [];

    const project = parsed as { version?: unknown; blocks?: unknown };
    if (
      project.version !== 1 ||
      !Array.isArray(project.blocks) ||
      !project.blocks.every(isBlock)
    ) {
      return [];
    }

    return project.blocks;
  } catch {
    return [];
  }
}

function App() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>(readSavedBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState('');


  useEffect(() => {
    // Call the backend API
    fetch('http://localhost:8080/api/hello')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch from backend');
        }
        return response.json();
      })
      .then((data:{ message: string }) => {
        setMessage(data.message);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const handleAddBlock = (type: BlockType): void => {
    const newBlock: Block = {
      id: Date.now(),
      type: type,
      color: SHAPE_COLORS[type],
      position: { x: blocks.length * 1.5, y: 0, z: 0 }, 
    };
    
    setBlocks(currentBlocks => [...currentBlocks, newBlock]);
    setSelectedBlockId(newBlock.id);
    setSaveStatus('Unsaved changes.');
  };

  const handleUpdateBlockColor = (colorHex: string): void => {
    if (selectedBlockId === null) return; 

    setSaveStatus('Unsaved changes.');
    setBlocks((currentBlocks) => {
      return currentBlocks.map((block) => {
        if (block.id === selectedBlockId) {
          return { ...block, color: colorHex };
        }

        return block;
      });
    });
  };

  const handleSave = (): void => {
    try {
      localStorage.setItem(SAVED_PROJECT_KEY, JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        blocks,
      }));
      setSaveStatus('Changes saved to this browser.');
    } catch {
      setSaveStatus('Project could not be saved. Check that browser storage is available.');
    }
  };

  return (
    <div className="cad-container">
      <Topbar onSave={handleSave} saveStatus={saveStatus} />
      <div className="cad-workspace">
        <Sidebar onAddBlock={handleAddBlock} onUpdateColor={handleUpdateBlockColor} />
        <Viewport error={error} message={message} blocks={blocks} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId}/>
      </div>
    </div>
  );
}

export default App
