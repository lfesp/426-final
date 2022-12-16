import { Group, Vector3, Color, ShaderLib, UniformsUtils, ShaderMaterial, BufferAttribute, MeshPhongMaterial, Mesh, BufferGeometry } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createNoise3D } from 'simplex-noise';
import { Chunk } from '.'

// const customFragmentShader = document.getElementById('js-terrain-fragment-shader').textContent;
// const customUniforms = UniformsUtils.merge([
//     ShaderLib.phong.uniforms,
//   { diffuse: { value: new THREE.Color(0x00FF00) } },
//   { time: { value: 0.0 } }
// ]);
// var customTerrainMaterial = new ShaderMaterial({
//   uniforms: customUniforms,
//   vertexShader: ShaderLib.phong.vertexShader,
//   fragmentShader: customFragmentShader,
//   lights: true,
//   name: 'terrain-material'
// });

const DELETE_SIZE = .45;
const ADD_SIZE = 0.35;
const DELETE_RATE = 1;
const ADD_RATE = 1.9;
const _globalScale = 20;

const MAP_X = 10;
const MAP_Y = 5;
const MAP_Z = 10;

class Terrain extends Group {
    constructor(parent) {
        super();

        this.state = {
            gui: parent.state.gui,
        };

        this.name = 'terrain';

        this.isolevel = 0.7;
        this.resolution = Math.round(parent.state.lod); // number of field segments in a chunk
        this.xLength = MAP_X; // number of chunks long in x direction
        this.yLength = MAP_Y // number of chunks tall in y direction
        this.zLength = MAP_Z; // number of chunks long in z direction
        this.chunks = [];

        this.scalarField = this.generateDensities();

        this.generateTerrain();

        parent.addToUpdateList(this);
    }

    generateDensities() {
        const simplex = new createNoise3D();

        const scalarField = [];

        for (let x = 0; x < this.resolution * this.xLength + 1; x++) {
            scalarField.push([]);

            for (let y = 0; y < this.resolution * this.yLength + 1; y++) {
                scalarField[x].push([]);

                for (let z = 0; z < this.resolution * this.zLength + 1; z++) {
                    let base = 0;
                    let brownian = 0;
                    let x_n = x / this.resolution;
                    let y_n = y / this.resolution;
                    let z_n = z / this.resolution;

                    for (let i = 0; i < 4; i++) {
                        const octave = 1 << i;
                        let noise = simplex(x_n * octave * (.3), y_n * octave * (.3), z_n * octave * (.3));
                        noise = (noise + 1) / 2;
                        brownian += noise / (octave * 2);
                    }

                    const heightOffset = y_n * 0.2;

                    base = brownian + heightOffset;

                    base = Math.min(1, Math.max(0, base));

                    let falloffDistance = 10
                    if (z < falloffDistance)
                        base -= (z - falloffDistance) / falloffDistance
                    if (z > this.resolution * this.zLength - falloffDistance)
                        base -= ((this.resolution * this.zLength - z) - falloffDistance) / falloffDistance
                    if (x < falloffDistance)
                        base -= (x - falloffDistance) / falloffDistance
                    if (x > this.resolution * this.xLength - falloffDistance)
                        base -= ((this.resolution * this.xLength - x) - falloffDistance) / falloffDistance
                    if (y < falloffDistance)
                        base -= (y - falloffDistance) / falloffDistance
                    if (y > this.resolution * this.yLength - falloffDistance)
                        base -= ((this.resolution * this.yLength - y) - falloffDistance) / falloffDistance


                    scalarField[x][y].push(base);

                }
            }
        }

        return scalarField;
    }

    generateTerrain() {
        for (let x = 0; x < this.xLength; x++) {
            this.chunks.push([]);
            for (let y = 0; y < this.yLength; y++) {
                this.chunks[x].push([]);
                for (let z = 0; z < this.zLength; z++) {
                    const chunk = new Chunk(this, x, y, z);
                    this.chunks[x][y].push(chunk);
                    this.add(chunk);
                }
            }
        }
    }

    getChunks() {
        return this.chunks;
    }

    addTerrain(location, amount) {
        const width = Math.round(ADD_SIZE * this.resolution);
        location.add(new Vector3(1, 1, 1).multiplyScalar(this.resolution / 2));
        const locationX = Math.ceil(location.x);
        const locationY = Math.ceil(location.y);
        const locationZ = Math.ceil(location.z);
        const visited = new Set();
        
        for (let x = locationX - width; x < locationX + width; x++) {
            for (let y = locationY - width; y < locationY + width; y++) {
                for (let z = locationZ - width; z < locationZ + width; z++) {
                    if (x < 0 || y < 0 || z < 0 || x >= this.resolution * this.xLength || y >= this.resolution * this.yLength || z >= this.resolution * this.zLength) continue;
                    const dist = location.distanceTo(new Vector3(x, y, z));
                    const weight = Math.max(1 - (dist / width), 0);
                    this.scalarField[x][y][z] -= weight * ADD_RATE * amount;

                    const chunkX = Math.floor(x / _globalScale);
                    const chunkY = Math.floor(y / _globalScale);
                    const chunkZ = Math.floor(z / _globalScale);
                    visited.add(this.chunks[chunkX][chunkY][chunkZ]);
                }
            }
        }

        for (const chunk of visited) {
            if (chunk === undefined) continue;
            // debugger
            let mesh = chunk.mesh;
            // scene.remove(chunk.mesh)
            mesh.parent.remove(mesh)
            mesh.geometry.dispose()
            mesh.material.dispose()

            chunk.regenerateChunk(this.scalarField, this.isolevel, this.resolution)
        }
    }

    deleteTerrain(location, amount) {
        const width = Math.round(DELETE_SIZE * this.resolution);
        location.add(new Vector3(1, 1, 1).multiplyScalar(this.resolution / 2));
        const locationX = Math.ceil(location.x);
        const locationY = Math.ceil(location.y);
        const locationZ = Math.ceil(location.z);
        const visited = new Set();

        for (let x = locationX - width; x < locationX + width; x++) {
            for (let y = locationY - width; y < locationY + width; y++) {
                for (let z = locationZ - width; z < locationZ + width; z++) {
                    if (x < 0 || y < 0 || z < 0 || x >= this.resolution * this.xLength || y >= this.resolution * this.yLength || z >= this.resolution * this.zLength) continue;
                    const dist = location.distanceTo(new Vector3(x, y, z));
                    const weight = Math.max(1 - (dist / width), 0);
                    // const before = this.scalarField[x][y][z];
                    this.scalarField[x][y][z] += weight * DELETE_RATE * amount;

                    const chunkX = Math.floor(x / _globalScale);
                    const chunkY = Math.floor(y / _globalScale);
                    const chunkZ = Math.floor(z / _globalScale);
                    visited.add(this.chunks[chunkX][chunkY][chunkZ]);
                }
            }
        }

        for (const chunk of visited) {
            if (chunk === undefined) continue;
            // debugger
            let mesh = chunk.mesh;
            // scene.remove(chunk.mesh)
            mesh.parent.remove(mesh)
            mesh.geometry.dispose()
            mesh.material.dispose()

            chunk.regenerateChunk(this.scalarField, this.isolevel, this.resolution)
        }
    }

    update(timeStamp) {
    }
}

export default Terrain;