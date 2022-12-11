import { Group, Vector3,Color, ShaderLib, UniformsUtils, ShaderMaterial, BufferAttribute, MeshPhongMaterial, Mesh, BufferGeometry } from 'three';
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

const _globalScale = 20;
class Terrain2 extends Group {
    constructor(parent) {
        super();

        this.state = {
            gui: parent.state.gui,
        };

        this.name = 'terrain';

        this.isolevel = 0.5;
        this.resolution = 20; // number of field segments in a chunk
        this.xLength = 12; // number of chunks long in x direction
        this.yLength = 5; // number of chunks tall in y direction
        this.zLength = 12; // number of chunks long in z direction
        this.chunks = [];

        this.scalarField = this.generateDensities();

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
                        let noise = simplex(x_n*octave*(.3), y_n*octave*(.3), z_n*octave*(.3));
                        noise = (noise + 1) / 2;
                        brownian += noise / (octave * 2);
                    }

                    const heightOffset = y_n * 0.2;

                    base = brownian + heightOffset - 0.1;

                    base = Math.min(1, Math.max(0, base));

                    scalarField[x][y].push(base);

                }
            }
        }

        return scalarField;
    }

    addTerrain(location) {
        const width = 0.25 * this.resolution;
        const multiplier = 1;
        const locationX = Math.floor(location.x);
        const locationY = Math.floor(location.y);
        const locationZ = Math.floor(location.z);
        const visited = new Set();

        for (let x = locationX - width; x < locationX + width; x++) {
            for (let y = locationY - width; y < locationY + width; y++) {
                for (let z = locationZ - width; z < locationZ + width; z++) {
                    const dist = location.distanceTo(new Vector3(x,y,z));
                    const weight = Math.max(1 - (dist/width), 0);
                    const before = this.scalarField[x][y][z];
                    this.scalarField[x][y][z] -= weight * multiplier;
                    // console.log(before - this.scalarField[x][y][z]);
                    const chunkX = Math.floor(x / _globalScale);
                    const chunkY = Math.floor(y / _globalScale);
                    const chunkZ = Math.floor(z / _globalScale);
                    visited.add(this.chunks[chunkX][chunkY][chunkZ]);
                }
            }
        }
        for (const chunk of visited) {
            chunk.regenerateChunk();
        }
    }

    update(timeStamp) {
    }
}

export default Terrain2;