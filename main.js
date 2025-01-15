import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
import { ChunkManager } from './ChunkManager.js';
import { setupLights } from './lights.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

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
const MOUSE_STATIONARY_THRESHOLD = 1000; // Time in ms before camera focuses
const MOUSE_MOVEMENT_THRESHOLD = 0.01; // How much mouse movement is considered "stationary"
let isCameraMoving = false;

// Mouse move event handler
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Check if mouse has moved significantly
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

// Position camera
camera.position.z = 5;
camera.position.y = 5;
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
    
    // Store original camera position and target
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    
    // Calculate new camera position
    const newPosition = new THREE.Vector3(
      targetPosition.x + 5,
      startPosition.y,
      targetPosition.z + 5
    );
    
    // Animation parameters
    const duration = 1000; // Duration in milliseconds
    const startTime = Date.now();
    
    function animateCamera() {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease function (cubic)
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Interpolate camera position and target
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

// Animation loop
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  // Update chunks based on camera position
  chunkManager.update(camera.position);
  
  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([plane, ...Array.from(chunkManager.chunks.values())]);
  
  if (intersects.length > 0) {
    const intersectionPoint = intersects[0].point;
    mouseIndicator.position.copy(intersectionPoint).add(new THREE.Vector3(0, 0.01, 0));
    mouseIndicator.visible = true;
    
    // Update mouse stationary duration
    if (!isCameraMoving) {
      mouseStationaryDuration = Date.now() - lastMouseMoveTime;
      
      // If mouse has been stationary long enough, focus camera
      if (mouseStationaryDuration >= MOUSE_STATIONARY_THRESHOLD) {
        updateCameraFocus(intersectionPoint);
        lastMouseMoveTime = Date.now(); // Reset timer
      }
    }
    
    // Pulse animation
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