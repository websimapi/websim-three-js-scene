import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export function setupLights(scene) {
  // Brighter ambient light for better overall visibility
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Main directional light (sun-like)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(100, 100, 50);
  directionalLight.castShadow = true;
  
  // Adjust shadow properties
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -150;
  directionalLight.shadow.camera.right = 150;
  directionalLight.shadow.camera.top = 150;
  directionalLight.shadow.camera.bottom = -150;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.bias = -0.0001;
  
  scene.add(directionalLight);

  // Hemisphere light for better ambient lighting
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemisphereLight);
}