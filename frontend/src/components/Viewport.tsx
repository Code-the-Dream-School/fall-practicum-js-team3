import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { TransformControls } from 'three/addons/controls/TransformControls.js';
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
  scale: number;
}

interface ViewportProps {
  error: string | null;
  message: string;
  blocks: Block[];                    
  selectedBlockId: number | null;     
  onSelectBlock: (id: number | null) => void;
  onMoveBlock: (id: number, position: Block['position']) => void;
  onScaleBlock: (id: number, factor: number) => void;
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

function Viewport({ error, message, blocks, selectedBlockId, onSelectBlock, onMoveBlock, onScaleBlock}: ViewportProps) {
  // Create an anchor point reference for our 3D container element
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshesRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const transformControlsRef = useRef<TransformControls | null>(null);
  const [webglError, setWebglError] = useState(false);

  // Set up the 3D workspace.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const meshes = meshesRef.current;

    
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
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      console.error('WebGL is not supported or could not be initialized.');
      sceneRef.current = null;
      queueMicrotask(() => setWebglError(true)); // Schedule the state update after the current synchronous code finishes.
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; 

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('translate');

    // True from the start of a gizmo drag until just after its mouse release.
    let isGizmoInUse = false;

    transformControls.addEventListener('dragging-changed', (event) => {
      controls.enabled = !event.value; // TEAM3-102: pause the camera while dragging

      if (event.value) {
        isGizmoInUse = true;
        return;
      }

      // The drag just ended: save the final position in the app state.
      const draggedMesh = transformControls.object;
      if (draggedMesh instanceof THREE.Mesh) {
        // Undo the "bottom of the shape sits on the grid" offset used when meshes are built.
        const bottom = (draggedMesh.geometry.boundingBox?.min.y ?? 0) * draggedMesh.scale.y;

        onMoveBlock(draggedMesh.userData.blockId as number, {
          x: draggedMesh.position.x,
          y: Math.max(0, draggedMesh.position.y + bottom), // never below the grid
          z: draggedMesh.position.z,
        });
      }

      // The click event arrives right after the release, so clear the flag a moment later.
      setTimeout(() => {
        isGizmoInUse = false;
      }, 0);
    });

    const transformHelper = transformControls.getHelper();
    scene.add(transformHelper);
    transformControlsRef.current = transformControls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const grid = new THREE.GridHelper(30, 30, '#cbd5e1', '#e2e8f0');
    grid.position.y = 0; 
    scene.add(grid);
    
    // Select a block when it is clicked
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (isGizmoInUse) return;
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

    // Shift + mouse wheel makes the selected shape bigger or smaller.
    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return; // normal wheel: the camera zooms

      const selectedMesh = transformControls.object;
      if (!selectedMesh) return; // nothing selected: let the camera zoom

      // Stop the camera zoom and the page scroll for this event.
      event.preventDefault();
      event.stopPropagation();

      // Some systems turn Shift + wheel into a sideways scroll (deltaX).
      const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
      const factor = Math.exp(-delta * 0.001); // wheel away from you (negative) = bigger

      onScaleBlock(selectedMesh.userData.blockId as number, factor);
    };

    container.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    
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
      container.removeEventListener('wheel', handleWheel, { capture: true });
      
      
      meshes.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      meshes.clear();

      scene.remove(grid);
      grid.geometry.dispose();
      (Array.isArray(grid.material) ? grid.material : [grid.material])
        .forEach((material) => material.dispose());

      scene.remove(transformHelper);
      transformControls.dispose();
      transformControlsRef.current = null;

      controls.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
    };
  }, [onSelectBlock, onMoveBlock, onScaleBlock]);

  // Add, update, or remove 3D blocks when the state changes.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const transformControls = transformControlsRef.current;
    transformControls?.detach();

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
      const shapeColor = new THREE.Color(block.color);

      if (isSelected) {
        const hsl = { h: 0, s: 0, l: 0 };

        shapeColor.getHSL(hsl);

        hsl.l = hsl.l > 0.6
          ? hsl.l - 0.3
          : hsl.l + 0.3;

        shapeColor.setHSL(hsl.h, hsl.s, hsl.l);
      }
      
      const material = new THREE.MeshStandardMaterial({
        color: shapeColor,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(
        createGeometry(block.type),
        material
      );

      // Positioning the bottom of each shape on the grid.
      const geometry = mesh.geometry;
      geometry.computeBoundingBox();

      const bottom = geometry.boundingBox?.min.y ?? 0;

      mesh.scale.setScalar(block.scale);
      mesh.position.set(
        block.position.x,
        block.position.y - bottom * block.scale,
        block.position.z
      );

      mesh.userData.blockId = block.id;

      scene.add(mesh);
      meshesRef.current.set(block.id, mesh);
    });

    const selectedMesh =
      selectedBlockId !== null ? meshesRef.current.get(selectedBlockId) : undefined;
    if (selectedMesh) {
      transformControls?.attach(selectedMesh);
    }
  }, [blocks, selectedBlockId]);
    
  
    return (
      <main className="cad-viewport">
        {webglError ? (
          <div className="webgl-error" role="alert">
            <h2>3D Canvas Unavailable</h2>
            <p>
              Your browser or device could not initialize WebGL.
            </p>
          </div>
      ) : (
        <div ref={containerRef} className="canvas-wrapper">
          <div className="canvas-connection-overlay">
            <h2>Frontend Test Node</h2>
            {error && <p className="error-text">{error}</p>}
            {!error && (<p className="message-text">API Payload: <strong>{message}</strong></p>)}
          </div>
        </div>
      )}
      </main>
    );

}

export default Viewport;