import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export function setupLights(scene) {
  // Brighter ambient light for better overall visibility
  const ambientLight = new THREE.AmbientLight(0x808080, 0.6);
  scene.add(ambientLight);

  // Main directional light (sun-like)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  
  // Adjust shadow properties
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.camera.far = 300;
  directionalLight.shadow.bias = -0.001;
  
  scene.add(directionalLight);

  // Additional fill lights for better coverage
  const pointLight1 = new THREE.PointLight(0xffffff, 0.4);
  pointLight1.position.set(-50, 50, -50);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.4);
  pointLight2.position.set(50, 50, -50);
  scene.add(pointLight2);
}