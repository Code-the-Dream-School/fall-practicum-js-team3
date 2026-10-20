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

function App() {
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);


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
  };

  const handleUpdateBlockColor = (colorHex: string): void => {
    if (selectedBlockId === null) return; 

    setBlocks((currentBlocks) => {
      return currentBlocks.map((block) => {
        if (block.id === selectedBlockId) {
          return { ...block, color: colorHex };
        }

        return block;
      });
    });
  };

  return (
    <div className="cad-container">
      <Topbar error={error} message={message} />
      <div className="cad-workspace">
        <Sidebar onAddBlock={handleAddBlock} onUpdateColor={handleUpdateBlockColor} />
        <Viewport error={error} message={message} blocks={blocks} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId}/>
      </div>
    </div>
  );
}

export default App
