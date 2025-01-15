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
  depthTest: false, // Disable depth testing
  renderOrder: 1 // Ensure it renders on top
});
const mouseIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
mouseIndicator.rotation.x = Math.PI / 2;
mouseIndicator.visible = false;
scene.add(mouseIndicator);

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Mouse move event handler
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
    // Position slightly above the plane to prevent z-fighting
    mouseIndicator.position.copy(intersectionPoint).add(new THREE.Vector3(0, 0.01, 0));
    mouseIndicator.visible = true;
    
    // Pulse animation
    time += 0.05;
    const scale = 1 + Math.sin(time) * 0.3; 
    mouseIndicator.scale.set(scale, scale, scale);
  } else {
    mouseIndicator.visible = false;
  }
  
  renderer.render(scene, camera);
}

animate();