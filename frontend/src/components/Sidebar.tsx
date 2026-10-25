import { useState, type ReactNode } from 'react';
import './Sidebar.css';

type BlockType =
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'pyramid'
  | 'torus';


interface SidebarProps {
  onAddBlock: (type: BlockType) => void;
  onUpdateColor: (color: string) => void;
}

interface ShapeTemplate {
  type: BlockType;
  label: string;
  icon: ReactNode;
}

function Sidebar({ onAddBlock, onUpdateColor }: SidebarProps) {
  const [selectedColor, setSelectedColor] = useState<string>('#E71D36');

  const handleSwatchClick = (color: string) => {
    setSelectedColor(color);
    onUpdateColor(color); 
  };

  const shapeTemplates: ShapeTemplate[] = [
  { 
    type: 'cube' as const, 
    label: 'Cube', 
    icon: (
      <svg viewBox="0 0 64 64" className="shape-svg">
        <path d="M32 6 L58 19 L58 45 L32 58 L6 45 L6 19 Z" fill="#0ea5e9" stroke="#0284c7" strokeWidth="2" />
        <path d="M32 6 L32 32 L58 19 M32 32 L6 19 M32 32 L32 58" fill="none" stroke="#0284c7" strokeWidth="2" />
        <path d="M32 32 L58 19 L58 45 L32 58 Z" fill="#38bdf8" opacity="0.4" />
      </svg>
    )
  },
  { 
    type: 'sphere' as const, 
    label: 'Sphere', 
    icon: (
      <svg viewBox="0 0 64 64" className="shape-svg">
        <circle cx="32" cy="32" r="26" fill="#ef4444" stroke="#dc2626" strokeWidth="2" />
        <ellipse cx="32" cy="32" rx="26" ry="8" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
        <ellipse cx="32" cy="32" rx="8" ry="26" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
      </svg>
    )
  },
  { 
    type: 'cylinder' as const, 
    label: 'Cylinder', 
    icon: (
      <svg viewBox="0 0 64 64" className="shape-svg">
        <path d="M12 16 L12 48 C12 54, 52 54, 52 48 L52 16" fill="#10b981" stroke="#059669" strokeWidth="2" />
        <ellipse cx="32" cy="16" rx="20" ry="6" fill="#34d399" stroke="#059669" strokeWidth="2" />
        <ellipse cx="32" cy="48" rx="20" ry="6" fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4 2" />
      </svg>
    )
  },
  { 
    type: 'cone' as const, 
    label: 'Cone', 
    icon: (
      <svg viewBox="0 0 64 64" className="shape-svg">
        <path d="M32 8 L54 48 C54 54, 10 54, 10 48 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
        <ellipse cx="32" cy="48" rx="22" ry="6" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
      </svg>
    )
  },
  { 
    type: 'pyramid' as const, 
    label: 'Pyramid', 
    icon: (
      <svg viewBox="0 0 64 64" className="shape-svg">
        <path d="M32 8 L56 46 L36 54 L8 42 Z" fill="#a855f7" stroke="#9333ea" strokeWidth="2" />
        <path d="M32 8 L36 54" fill="none" stroke="#9333ea" strokeWidth="2" />
        <path d="M32 8 L8 42 L36 54 Z" fill="#c084fc" opacity="0.4" />
      </svg>
    )
  },
  { 
    type: 'torus' as const, 
    label: 'Torus', 
    icon: (
      <svg viewBox="0 0 64 64" className="shape-svg">
        <ellipse cx="32" cy="32" rx="26" ry="16" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
        <ellipse cx="32" cy="32" rx="12" ry="7" fill="#ffffff" stroke="#ea580c" strokeWidth="2" />
      </svg>
    )
  }
];


  return (
    <aside className="cad-sidebar">
      <div className="sidebar-section-header">
        <span className="section-category">BUILD</span>
        <h2>Shapes</h2>
        <h3 className="section-hint">Click a shape to add to scene</h3>
      </div>

      <div className="shape-library-grid">
        {shapeTemplates.map((shape) => (
          <button 
            key={shape.type}
            type="button" 
            className="shape-card-btn"
            onClick={() => onAddBlock(shape.type)}
          >
            <div className="shape-thumbnail-frame">
              {shape.icon}
            </div>
            <span className="shape-card-label">{shape.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-color-section">
        <h3>Color</h3>
        <div className="palette-input-wrapper">
          <input 
            type="color" 
            id="colorSpectrumPicker"
            className="spectrum-picker-wheel"
            value={selectedColor}
            onChange={(e) => handleSwatchClick(e.target.value)} 
          />
          <label htmlFor="colorSpectrumPicker" className="palette-dropdown-btn">
            Choose custom color
          </label>
        </div>

        <div className="hex-display-panel">
          <div className="hex-preview-box" style={{ backgroundColor: selectedColor }} />
          <span className="hex-text-label">{selectedColor.toUpperCase()}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
