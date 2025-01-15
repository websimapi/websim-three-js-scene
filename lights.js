import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export function setupLights(scene) {
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(-5, 5, -5);
  scene.add(pointLight);
}