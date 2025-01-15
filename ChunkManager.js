import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map(); 
    this.chunkSize = 10; 
    this.viewDistance = 8; 
    this.renderDistance = 12; 
    this.loadedChunks = new Set(); 
  }

  getChunkCoord(position) {
    return Math.floor(position / this.chunkSize);
  }

  getChunkKey(x, z) {
    return `${x},${z}`;
  }

  createChunk(chunkX, chunkZ) {
    const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      side: THREE.DoubleSide,
      wireframe: false,
      receiveShadow: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    mesh.position.x = chunkX * this.chunkSize + this.chunkSize / 2;
    mesh.position.z = chunkZ * this.chunkSize + this.chunkSize / 2;
    
    return mesh;
  }

  update(cameraPosition) {
    const centerChunkX = this.getChunkCoord(cameraPosition.x);
    const centerChunkZ = this.getChunkCoord(cameraPosition.z);

    const newLoadedChunks = new Set();

    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const chunkX = centerChunkX + x;
        const chunkZ = centerChunkZ + z;
        const key = this.getChunkKey(chunkX, chunkZ);

        newLoadedChunks.add(key);

        if (!this.loadedChunks.has(key)) {
          const chunk = this.createChunk(chunkX, chunkZ);
          this.chunks.set(key, chunk);
          this.scene.add(chunk);
          this.loadedChunks.add(key);
        }

        const chunk = this.chunks.get(key);
        if (chunk) {
          const distance = Math.max(Math.abs(x), Math.abs(z));
          chunk.visible = distance <= this.viewDistance;
        }
      }
    }

    for (const key of this.loadedChunks) {
      if (!newLoadedChunks.has(key)) {
        const chunk = this.chunks.get(key);
        if (chunk) {
          this.scene.remove(chunk);
          chunk.geometry.dispose();
          chunk.material.dispose();
          this.chunks.delete(key);
        }
        this.loadedChunks.delete(key);
      }
    }
  }
}