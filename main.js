import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { ChunkManager } from './ChunkManager.js';
import { setupLights } from './lights.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls with adjusted settings
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxDistance = 1000;
controls.minDistance = 5;

// Setup lights
setupLights(scene);

// Initialize chunk manager
const chunkManager = new ChunkManager(scene);

// Create plane
const planeGeometry = new THREE.PlaneGeometry(10, 10);
const planeMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x808080,
  side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
scene.add(plane);

// Create mouse indicator
const indicatorGeometry = new THREE.CircleGeometry(0.2, 32);
const indicatorMaterial = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide,
  depthTest: false,
  renderOrder: 1
});
const mouseIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
mouseIndicator.rotation.x = Math.PI / 2;
mouseIndicator.visible = false;
scene.add(mouseIndicator);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Mouse tracking variables
let lastMouseMoveTime = Date.now();
let lastMousePosition = new THREE.Vector2();
let mouseStationaryDuration = 0;
const MOUSE_STATIONARY_THRESHOLD = 1000; 
const MOUSE_MOVEMENT_THRESHOLD = 0.01; 
let isCameraMoving = false;

// Mouse move event handler
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  const mouseDelta = new THREE.Vector2(
    Math.abs(mouse.x - lastMousePosition.x),
    Math.abs(mouse.y - lastMousePosition.y)
  );
  
  if (mouseDelta.length() > MOUSE_MOVEMENT_THRESHOLD) {
    lastMouseMoveTime = Date.now();
    mouseStationaryDuration = 0;
    lastMousePosition.copy(mouse);
  }
}
window.addEventListener('mousemove', onMouseMove, false);

// Position camera higher for better overview
camera.position.z = 100;
camera.position.y = 100;
camera.lookAt(0, 0, 0);

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCameraFocus(targetPosition) {
  if (!isCameraMoving) {
    isCameraMoving = true;
    
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
    const offsetVector = startPosition.clone().sub(startTarget);
    
    const newPosition = targetPosition.clone().add(offsetVector);
    
    const duration = 1000; 
    const startTime = Date.now();
    
    function animateCamera() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      camera.position.lerpVectors(startPosition, newPosition, ease);
      controls.target.lerpVectors(startTarget, targetPosition, ease);
      controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        isCameraMoving = false;
      }
    }
    
    animateCamera();
  }
}

// Add fog to scene for better distance visualization
scene.fog = new THREE.Fog(0x000000, 200, 1000);

// Animation loop
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  chunkManager.update(camera.position);
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([plane, ...Array.from(chunkManager.chunks.values())]);
  
  if (intersects.length > 0) {
    const intersectionPoint = intersects[0].point;
    mouseIndicator.position.copy(intersectionPoint).add(new THREE.Vector3(0, 0.01, 0));
    mouseIndicator.visible = true;
    
    if (!isCameraMoving) {
      mouseStationaryDuration = Date.now() - lastMouseMoveTime;
      
      if (mouseStationaryDuration >= MOUSE_STATIONARY_THRESHOLD) {
        updateCameraFocus(intersectionPoint);
        lastMouseMoveTime = Date.now(); 
      }
    }
    
    time += 0.05;
    const scale = 1 + Math.sin(time) * 0.3; 
    mouseIndicator.scale.set(scale, scale, scale);
  } else {
    mouseIndicator.visible = false;
    mouseStationaryDuration = 0;
  }
  
  renderer.render(scene, camera);
}

animate();