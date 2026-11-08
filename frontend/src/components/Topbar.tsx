import { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { useDesignStore } from '../hooks/useDesignStore';
import SaveProjectDialog from './SaveProjectDialog';
import './Topbar.css';

function Topbar() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const project = useDesignStore((state) => state.project);
  const [showSave, setShowSave] = useState(false);
  const [savedMessage, setSavedMessage] = useState<{ userId: string; text: string } | null>(null);

  return (
    <>
    <header className="cad-header">
      <div className="header-left-zone">
        <div className="brand-group">
          <img src="/logo.jpg" alt="BlockCAD Logo" className="logo-img" />
          <span className="logo-text">BlockCAD</span>
        </div>

        <div className="header-vertical-divider"></div>

        <div className="project-meta">
          <h1 className="project-title">{project && user && project.userId === user.id ? project.name : 'My awesome robot'}</h1>
          {savedMessage && savedMessage.userId === user?.id && <span role="status">{savedMessage.text}</span>}
        </div>
      </div>

        <div className="header-center-zone">
          {user && token && <button className="action-btn" onClick={() => { setSavedMessage(null); setShowSave(true); }}>Save</button>}
          <button className="action-btn">Load</button>
        </div>

        <div className="header-right-zone">
          <button className="action-btn export-stl-btn">Export STL</button>
        </div>
    </header>
    {showSave && <SaveProjectDialog onClose={() => setShowSave(false)} onSaved={(name) => {
      setShowSave(false);
      if (user) setSavedMessage({ userId: user.id, text: `Project "${name}" saved.` });
    }} />}
    </>
  );
}

export default Topbar;
