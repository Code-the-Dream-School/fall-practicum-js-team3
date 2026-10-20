import './Topbar.css';

interface TopbarProps {
  error: string | null;
  message: string;
}

function Topbar({ error, message }: TopbarProps) {

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
          <button className="action-btn">Save</button>
          <button className="action-btn">Load</button>
        </div>

        <div className="header-right-zone">
          <button className="action-btn export-stl-btn">Export STL</button>
        </div>
    </header>
  );
}

export default Topbar;
