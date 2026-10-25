import './Topbar.css';

interface TopbarProps {
  onSave: () => void;
  saveStatus: string;
}

function Topbar({ onSave, saveStatus }: TopbarProps) {

  return (
    <header className="cad-header">
      <div className="header-left-zone">
        <div className="brand-group">
          <img src="/logo.jpg" alt="BlockCAD Logo" className="logo-img" />
          <span className="logo-text">BlockCAD</span>
        </div>

        <div className="header-vertical-divider"></div>

        <div className="project-meta">
          <h1 className="project-title">My awesome robot</h1>
        </div>
      </div>

        <div className="header-center-zone">
          <div className="header-actions">
            <button
              className="action-btn"
              type="button"
              aria-label="Save project to this browser"
              onClick={onSave}
            >
              Save
            </button>
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
