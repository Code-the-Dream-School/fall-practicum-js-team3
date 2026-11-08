import { useEffect, useState } from 'react';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import Viewport from './components/Viewport';
import { useDesignStore } from './hooks/useDesignStore';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const blocks = useDesignStore((state) => state.blocks);
  const selectedBlockId = useDesignStore((state) => state.selectedBlockId);
  const addBlock = useDesignStore((state) => state.addBlock);
  const selectBlock = useDesignStore((state) => state.selectBlock);
  const updateColor = useDesignStore((state) => state.updateColor);
  const moveBlock = useDesignStore((state) => state.moveBlock);
  const scaleBlock = useDesignStore((state) => state.scaleBlock);

  useEffect(() => {
    fetch('http://localhost:8080/api/hello')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch from backend');
        return response.json();
      })
      .then((data: { message: string }) => setMessage(data.message))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="cad-container">
      <Topbar />
      <div className="cad-workspace">
        <Sidebar onAddBlock={addBlock} onUpdateColor={updateColor} />
        <Viewport error={error} message={message} blocks={blocks} selectedBlockId={selectedBlockId} onSelectBlock={selectBlock} onMoveBlock={moveBlock} onScaleBlock={scaleBlock} />
      </div>
    </div>
  );
}

export default App;
