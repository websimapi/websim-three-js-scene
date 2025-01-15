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
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  
  // Update chunks based on camera position
  chunkManager.update(camera.position);
  
  renderer.render(scene, camera);
}

animate();