import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map(); // Map of chunk coordinates to chunk meshes
    this.chunkSize = 32; // Increased chunk size for better visibility
    this.viewDistance = 12; // Significantly increased view distance
    this.loadedChunks = new Set(); // Set of loaded chunk coordinates as strings
  }

  getChunkCoord(position) {
    return Math.floor(position / this.chunkSize);
  }

  getChunkKey(x, z) {
    return `${x},${z}`;
  }

  createChunk(chunkX, chunkZ) {
    const geometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize);
    const material = new THREE.MeshStandardMaterial({
      color: 0x808080,
      side: THREE.DoubleSide,
      wireframe: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;
    
    // Position the chunk in world space
    mesh.position.x = chunkX * this.chunkSize + this.chunkSize / 2;
    mesh.position.z = chunkZ * this.chunkSize + this.chunkSize / 2;
    
    return mesh;
  }

  update(cameraPosition) {
    const centerChunkX = this.getChunkCoord(cameraPosition.x);
    const centerChunkZ = this.getChunkCoord(cameraPosition.z);

    // Track which chunks should be loaded this frame
    const newLoadedChunks = new Set();

    // Load chunks within view distance
    for (let x = -this.viewDistance; x <= this.viewDistance; x++) {
      for (let z = -this.viewDistance; z <= this.viewDistance; z++) {
        const chunkX = centerChunkX + x;
        const chunkZ = centerChunkZ + z;
        const key = this.getChunkKey(chunkX, chunkZ);

        newLoadedChunks.add(key);

        // If chunk isn't loaded, create and add it
        if (!this.loadedChunks.has(key)) {
          const chunk = this.createChunk(chunkX, chunkZ);
          this.chunks.set(key, chunk);
          this.scene.add(chunk);
          this.loadedChunks.add(key);
        }
      }
    }

    // Remove chunks that are too far away
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