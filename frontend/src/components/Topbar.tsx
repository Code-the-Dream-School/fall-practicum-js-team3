import { useAuthStore } from '../hooks/useAuthStore';
import { useDesignStore } from '../hooks/useDesignStore';
import './Topbar.css';

interface TopbarProps {
  onSave: () => void;
  canSave: boolean;
  saveStatus: string;
}

function Topbar({ onSave, canSave, saveStatus }: TopbarProps) {
  const user = useAuthStore((state) => state.user);
  const project = useDesignStore((state) => state.project);
  const visibleProject = project?.userId === user?.id ? project : null;

  return (
    <header className="cad-header">
      <div className="header-left-zone">
        <div className="brand-group">
          <img src="/logo.jpg" alt="BlockCAD Logo" className="logo-img" />
          <span className="logo-text">BlockCAD</span>
        </div>

        <div className="header-vertical-divider"></div>

        <div className="project-meta">
          <h1 className="project-title">{visibleProject?.name ?? 'My awesome robot'}</h1>
        </div>
      </div>

      <div className="header-center-zone">
        <div className="header-actions">
          {canSave && (
            <button
              className="action-btn"
              type="button"
              aria-label="Save project"
              onClick={onSave}
            >
              Save
            </button>
          )}
          <button className="action-btn" type="button">Load</button>
        </div>
        <p
          className={`save-status${saveStatus ? ' is-visible' : ''}${saveStatus === 'Unsaved changes.' ? ' is-unsaved' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {saveStatus}
        </p>
      </div>

      <div className="header-right-zone">
        <button className="action-btn export-stl-btn">Export STL</button>
      </div>
    </header>
  );
}

export default Topbar;
