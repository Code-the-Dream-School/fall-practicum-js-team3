import {useCallback, useEffect, useState } from 'react';
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
  scale: number;
}

const SHAPE_COLORS: Record<BlockType, string> = {
  cube: '#0ea5e9',
  sphere: '#ef4444',
  cylinder: '#10b981',
  cone: '#eab308',
  pyramid: '#a855f7',
  torus: '#f97316',
};

// Find the first empty spot in the row, so a new shape never lands inside another one.
function findFreeSpawnX(existingBlocks: Block[]): number {
  let x = 0;
  while (
    existingBlocks.some(
      (block) =>
        Math.abs(block.position.x - x) < 1.5 && Math.abs(block.position.z) < 1.5
    )
  ) {
    x += 0.5;
  }
  return x;
}

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
      position: { x: findFreeSpawnX(blocks), y: 0, z: 0 },
      scale: 1,
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

  const handleMoveBlock = useCallback(
  (id: number, newPosition: Block['position']): void => {
    setBlocks((currentBlocks) =>
      currentBlocks.map((block) =>
        block.id === id ? { ...block, position: newPosition } : block
      )
    );
  },
  []
);

  return (
    <div className="cad-container">
      <Topbar />
      <div className="cad-workspace">
        <Sidebar onAddBlock={handleAddBlock} onUpdateColor={handleUpdateBlockColor} />
        <Viewport error={error} message={message} blocks={blocks} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId} onMoveBlock={handleMoveBlock}/>
      </div>
    </div>
  );
}

export default App
