import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import './Viewport.css';

type BlockType =
  | 'cube'
  | 'sphere'
  | 'cylinder'
  | 'cone'
  | 'pyramid'
  | 'torus';

interface Block {
  id: number;
  type: BlockType;
  color: string;
  position: { x: number; y: number; z: number };
}

interface ViewportProps {
  error: string | null;
  message: string;
  blocks: Block[];                    
  selectedBlockId: number | null;     
  onSelectBlock: (id: number | null) => void;
  
}

// Create the correct geometry for each shape.
function createGeometry(type: BlockType): THREE.BufferGeometry {  
  switch (type) {
    case 'cube':
      return new THREE.BoxGeometry(1, 1, 1);
    case 'sphere':
      return new THREE.SphereGeometry(0.6, 32, 16);
    case 'cylinder':
      return new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
    case 'cone':
      return new THREE.ConeGeometry(0.6, 1.2, 32);
    case 'pyramid':
      return new THREE.ConeGeometry(0.7, 1.2, 4); 
    case 'torus':
      return new THREE.TorusGeometry(0.4, 0.15, 12, 48);
    default:
      throw new Error(`Unknown shape type: ${type}`);
    }
  }

function Viewport({ error, message, blocks, selectedBlockId, onSelectBlock}: ViewportProps) {
  // Create an anchor point reference for our 3D container element
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshesRef = useRef<Map<number, THREE.Mesh>>(new Map());

  // Set up the 3D workspace.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    
    // Initialize Core Three.js Architecture
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f1f5f9');
    sceneRef.current = scene; 

    // Camera Setup (Field of View, Aspect Ratio, Near plane, Far plane)
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer Setup 
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const grid = new THREE.GridHelper(30, 30, '#cbd5e1', '#e2e8f0');
    grid.position.y = -1; 
    scene.add(grid);
    
    // Select a block when it is clicked
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(meshesRef.current.values());
      const intersections = raycaster.intersectObjects(meshes);

      if (intersections.length === 0) {
          onSelectBlock(null);
          return;
      }

      const blockId = intersections[0].object.userData.blockId as number;
      onSelectBlock(blockId);
    };
     
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // Responsive Engine 
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) return;
       
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(container);

    // Keep rendering the scene and updating camera controls.
    let animationFrameId: number;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update(); 
      renderer.render(scene, camera);
    };
    
    animate();

    // Clean up variables and processes on component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      
      meshesRef.current.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      meshesRef.current.clear();

      scene.remove(grid);
      grid.geometry.dispose();
      (Array.isArray(grid.material) ? grid.material : [grid.material])
        .forEach((material) => material.dispose());

      controls.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
    };
  }, [onSelectBlock]);

  // Add, update, or remove 3D blocks when the state changes.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove the previous meshes and release their resources.
    meshesRef.current.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    meshesRef.current.clear();

    // Create meshes from the current block data.
    blocks.forEach((block) => {
      const isSelected = block.id === selectedBlockId;

      const material = new THREE.MeshStandardMaterial({
        color: block.color,
        roughness: 0.3,
        emissive: isSelected ? '#3b82f6' : '#000000',
        emissiveIntensity: isSelected ? 0.35 : 0,
      });

      const mesh = new THREE.Mesh(
        createGeometry(block.type),
        material
      );

      mesh.position.set(
        block.position.x,
        block.position.y,
        block.position.z
      );

      mesh.userData.blockId = block.id;

      scene.add(mesh);
      meshesRef.current.set(block.id, mesh);
    });
  }, [blocks, selectedBlockId]);
    
  
    return (
    <main className="cad-viewport">
      <div ref={containerRef} className="canvas-wrapper">
        <div className="canvas-connection-overlay">
          <h2>Frontend Test Node</h2>
          {error && <p className="error-text">{error}</p>}
          {!error && <p className="message-text">API Payload: <strong>{message}</strong></p>}
        </div>
      </div>
    </main>
  );

}

export default Viewport;
