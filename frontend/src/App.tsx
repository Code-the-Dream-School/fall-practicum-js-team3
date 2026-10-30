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

// How far each shape reaches from its center sideways (x and z) at scale 1.
// Keep these in sync with the sizes in createGeometry (Viewport.tsx).
const SHAPE_HALF_WIDTH: Record<BlockType, number> = {
  cube: 0.5,
  sphere: 0.6,
  cylinder: 0.5,
  cone: 0.6,
  pyramid: 0.7,
  torus: 0.55,
};

// Empty space to leave between two shapes.
const SPAWN_GAP = 0.5;

// Find the first empty spot in the row, so a new shape never lands inside another one.
function findFreeSpawnX(existingBlocks: Block[], newType: BlockType): number {
  let x = 0;
  while (
    existingBlocks.some(
      (block) => {
      // The closest the two centers may be: both half-widths (scaled) plus a gap.
      const minDistance =
        SHAPE_HALF_WIDTH[block.type] * block.scale + SHAPE_HALF_WIDTH[newType] + SPAWN_GAP;
      return (
        Math.abs(block.position.x - x) < minDistance &&
        Math.abs(block.position.z) < minDistance
      );
    })
  ) {
    x += 0.5;
  }
  return x;
}

// Smallest and largest size a shape can have (1 = original size).
const MIN_BLOCK_SCALE = 0.2;
const MAX_BLOCK_SCALE = 5;

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
      position: { x: findFreeSpawnX(blocks, type), y: 0, z: 0 },
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

   const handleScaleBlock = useCallback((id: number, factor: number) => {
     setBlocks((currentBlocks) =>
       currentBlocks.map((block) =>
         block.id === id
           ? {
               ...block,
               scale: Math.min(MAX_BLOCK_SCALE, Math.max(MIN_BLOCK_SCALE, block.scale * factor)),
             }
           : block
       )
     );
   }, []);

  return (
    <div className="cad-container">
      <Topbar />
      <div className="cad-workspace">
        <Sidebar onAddBlock={handleAddBlock} onUpdateColor={handleUpdateBlockColor} />
        <Viewport error={error} message={message} blocks={blocks} selectedBlockId={selectedBlockId} onSelectBlock={setSelectedBlockId} onMoveBlock={handleMoveBlock} onScaleBlock={handleScaleBlock} />
      </div>
    </div>
  );
}

export default App
