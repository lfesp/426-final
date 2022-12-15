/**
 * app.js
 *
 * This is the first file loaded. It sets up the Renderer,
 * Scene and Camera. It also starts the render loop and
 * handles window resizes.
 *
 */
import { WebGLRenderer, PerspectiveCamera, Vector3, EquirectangularReflectionMapping } from 'three';
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { NoiseScene } from 'scenes';
import { Player } from 'controllers';


// Initialize core ThreeJS components
// const scene = new SeedScene();
const scene = new NoiseScene();
const camera = new PerspectiveCamera();
const renderer = new WebGLRenderer({ antialias: true });

let player;

// Set up camera
camera.lookAt(new Vector3(0, 0, 0));

// Set up renderer, canvas, and minor CSS adjustments
renderer.setPixelRatio(window.devicePixelRatio);
const canvas = renderer.domElement;
canvas.style.display = 'block'; // Removes padding below canvas
document.body.style.margin = 0; // Removes margin around page
document.body.style.overflow = 'hidden'; // Fix scrolling
document.body.appendChild(canvas);

addInstructions();
addPlayer();
scene.add(camera);

window.requestAnimationFrame(onAnimationFrameHandler);

windowResizeHandler();
window.addEventListener('resize', windowResizeHandler, false);


// core render loop
function onAnimationFrameHandler(timeStamp) {
    // controls.update();
    // movement();
    player.update(timeStamp);
    renderer.render(scene, camera);
    scene.update && scene.update(timeStamp);
    window.requestAnimationFrame(onAnimationFrameHandler);
};

// resize handler
function windowResizeHandler() {
    const { innerHeight, innerWidth } = window;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
};

// // Set up pointer lock controls
// function addBlocker() {
//     let blocker = document.createElement('div');
//     blocker.style.cssText = `#blocker {
//         position: absolute;
//         width: 100%;
//         height: 100%;
//         background-color: rgba(0,0,0,0.5);
//     };`
//     document.body.appendChild(blocker);
// }

function addInstructions() {
    let instructions = document.createElement('div');
    instructions.style.cssText = `#instructions {
        width: 100%;
        height: 100%;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        text-align: center;
        font-size: 14px;
        cursor: pointer;
    };
    #blocker {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    };`
    instructions.innerHTML = `<div id="blocker">
        <div id="instructions">
            <p style="font-size:36px">
                Click to play
            </p>
            <p>
                Move: WASD<br />
                Jump: SPACE<br />
                Look: MOUSE
            </p>
        </div>
    </div>`

    document.body.appendChild(instructions);
}

// function addShader() {
//     let shader = document.createElement('div');
//     instructions.style.cssText = `#instructions {
//         width: 100%;
//         height: 100%;

//         display: flex;
//         flex-direction: column;
//         justify-content: center;
//         align-items: center;

//         text-align: center;
//         font-size: 14px;
//         cursor: pointer;
//     };
//     #blocker {
//         position: absolute;
//         width: 100%;
//         height: 100%;
//         background-color: rgba(0,0,0,0.5);
//     };`
//     instructions.innerHTML = `<div id="blocker">
//         <div id="instructions">
//             <p style="font-size:36px">
//                 Click to play
//             </p>
//             <p>
//                 Move: WASD<br />
//                 Jump: SPACE<br />
//                 Look: MOUSE
//             </p>
//         </div>
//     </div>`

//     document.body.appendChild(terrainShader);
// }

function addPlayer() {
    player = new Player(camera, document, scene);
}

// addSky()

// function addSky() {
//     new RGBELoader()
//         .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/')
//         .load('quarry_01_puresky_2k.hdr', function (texture) {

//             texture.mapping = EquirectangularReflectionMapping;

//             scene.background = texture;
//             scene.environment = texture;

//             render();

//         });
// }