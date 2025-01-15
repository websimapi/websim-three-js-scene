import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { createNoise2D } from 'https://cdn.skypack.dev/simplex-noise';

export class ChunkManager {
  constructor(scene) {
    this.scene = scene;
    this.chunks = new Map();
    this.chunkSize = 16;
    this.viewDistance = 8;
    this.renderDistance = 12;
    this.loadedChunks = new Set();
    this.noise2D = createNoise2D();
    this.terrainSettings = {
      height: 20, 
      scale: 80,  
      octaves: 6, 
      persistence: 0.5,
      lacunarity: 2.0,
      heightOffset: -5
    };

    // Force initial chunk generation
    this.update(new THREE.Vector3(0, 0, 0));
  }

  getChunkCoord(position) {
    return Math.floor(position / this.chunkSize);
  }

  getChunkKey(x, z) {
    return `${x},${z}`;
  }

  getNoise(x, z) {
    let amplitude = 1;
    let frequency = 1;
    let noiseHeight = 0;
    let amplitudeSum = 0;

    for (let i = 0; i < this.terrainSettings.octaves; i++) {
      const sampleX = (x + 1000) / this.terrainSettings.scale * frequency;
      const sampleZ = (z + 1000) / this.terrainSettings.scale * frequency;
      
      const noiseValue = this.noise2D(sampleX, sampleZ);
      noiseHeight += noiseValue * amplitude;
      
      amplitudeSum += amplitude;
      amplitude *= this.terrainSettings.persistence;
      frequency *= this.terrainSettings.lacunarity;
    }

    noiseHeight = noiseHeight / amplitudeSum;
    return noiseHeight * this.terrainSettings.height + this.terrainSettings.heightOffset;
  }

  createChunk(chunkX, chunkZ) {
    const resolution = 32; 
    const geometry = new THREE.PlaneGeometry(
      this.chunkSize,
      this.chunkSize,
      resolution - 1,
      resolution - 1
    );

    const vertices = geometry.attributes.position.array;
    
    // Generate height map
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i] + chunkX * this.chunkSize;
      const z = vertices[i + 2] + chunkZ * this.chunkSize;
      const height = this.getNoise(x, z);
      vertices[i + 1] = height;
    }

    // Update normals for proper lighting
    geometry.computeVertexNormals();

    // Create gradient material based on height
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      wireframe: false,
      roughness: 0.8,
      metalness: 0.1
    });

    // Add vertex colors based on height
    const colors = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const height = vertices[i + 1];
      let color = new THREE.Color();

      if (height < -1) {
        color.setHex(0x2233dd); 
      } else if (height < 0) {
        color.setHex(0x3355ff); 
      } else if (height < 1) {
        color.setHex(0xddcc88); 
      } else if (height < 4) {
        color.setHex(0x55aa55); 
      } else if (height < 6) {
        color.setHex(0x777777); 
      } else {
        color.setHex(0xffffff); 
      }

      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mesh = new THREE.Mesh(geometry, material);
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

    // Remove old chunks
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