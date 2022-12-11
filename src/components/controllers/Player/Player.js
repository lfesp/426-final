import { Vector3, Raycaster, Ray, Vector2, Mesh, SphereBufferGeometry, MeshBasicMaterial } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let onGround = false;
let canJump = false;

const moveSpeed = 15;
const gravity = 2;
const jumpSpeed = 20;
const friction = 0.95

class Player {
    constructor(camera, document, scene) {
        this.position = new Vector3(0, 100, 0);
        // this.acceleration = new Vector3(0, 0, 0);
        this.velocity = new Vector3(0, 0, 0);
        this.direction = new Vector3(0, 0, 0);
        this.raycaster = new Raycaster(this.position, new Vector3(0, -1, 0));
        this.sightcaster = new Raycaster(this.position, new Vector3(), 0, 1000)
        this.sightSphere = new Mesh(new SphereBufferGeometry(2, 16, 8), new MeshBasicMaterial({ color: 0xff0000 }))
        // add sphere to the scene
        scene.add(this.sightSphere);
        this.scene = scene;
        this.onGround = true
        this.prevTime = performance.now();

        this.camera = camera;

        this.controls = new PointerLockControls(
            camera,
            document.body
        );

        this.camera.lookAt(0, 0, 0);

        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    // lock the screen on mouse press
    onMouseDown(event) {
        if (!this.controls.isLocked) {
            this.controls.lock();
            return;
        }
        let dir = new Vector3();
        this.camera.getWorldDirection(dir);
        this.sightcaster.set(this.position, dir);
        const results = this.raycaster.intersectObjects(this.scene.terrain.children, true);
        if (results.length > 0) {
            const intersect = results[0].point;
            this.scene.terrain.addTerrain(intersect);
            this.sightSphere.position.copy(results[0].point);
        }
    }

    onKeyDown(event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;

            case 'Space':
                // moveUp = true;
                console.log(this.onGround)
                if (this.onGround === true) {
                    this.velocity.y = jumpSpeed;
                    this.onGround = false
                }
                break;
            case 'ShiftLeft':
                moveDown = true;

                break;
        }

    };

    onKeyUp(event) {

        switch (event.code) {

            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
            case 'Space':
                moveUp = false;
                // if (canJump === true) velocity.y = 150;
                // onGround = false;
                break;
            case 'ShiftLeft':
                moveDown = false;
                break;

        }

    };

    // not mine
    update(timeStamp) {
        const delta = (timeStamp - this.prevTime) / 1000;
        this.prevTime = timeStamp;

        // this.acceleration.x = 0.0;
        // this.acceleration.y = 0.0;
        // this.acceleration.z = 0.0;
        // this.acceleration.y -= 10.;

        this.velocity.x = 0
        this.velocity.z = 0
        this.velocity.multiplyScalar(friction)
        this.velocity.y -= gravity;
        // this.velocity.y = Math.min(-gravity * 4, this.velocity.y);
        this.position.y = Math.max(0, this.position.y);

        this.direction.z = Number(moveForward) - Number(moveBackward);
        this.direction.x = Number(moveRight) - Number(moveLeft);
        this.direction.y = Number(moveUp) - Number(moveDown);
        // this.direction.normalize(); // this ensures consistent movements in all directions

        const cameraDirection = this.controls.getDirection(new Vector3());
        cameraDirection.y = 0
        const rightDirection = cameraDirection.clone().cross(this.camera.up).normalize();

        if (moveForward || moveBackward) this.velocity.addScaledVector(cameraDirection, this.direction.z * moveSpeed);
        if (moveLeft || moveRight) this.velocity.addScaledVector(rightDirection, this.direction.x * moveSpeed);
        if (moveUp || moveDown) this.velocity.addScaledVector(this.camera.up, this.direction.y * moveSpeed);

        this.position.addScaledVector(this.velocity, delta);

        // if (onObject === true) {
        //     // controls.getObject().position.y = intersections[0].point.y + 20;
        //     velocity.y = Math.max(0, velocity.y);
        //     canJump = true;

        //     intersections[0].face.color = 0xff0000;
        // }
        this.raycaster.set(this.position, new Vector3(0, -1, 0))
        const intersections = this.raycaster.intersectObjects(this.scene.terrain.children, true);
        this.onGround = false
        if (intersections.length > 0) {
            const distance = intersections[0].distance;
            if (distance < 10) {
                this.position.y = Math.max(this.position.y, intersections[0].point.y + 10)
                this.velocity.y = Math.max(0, this.velocity.y);
                this.onGround = true

            }
        }


        this.position.addScaledVector(this.velocity, delta);
        this.camera.position.copy(this.position);

        // damping
        // this.velocity.addScaledVector(this.velocity, -0.85);
        // this.acceleration.addScaledVector(this.acceleration, -0.85);

        this.castSight()
    }

    castSight() {
        let dir = new Vector3();
        this.camera.getWorldDirection(dir);
        this.sightcaster.set(this.position, dir);
        const results = this.sightcaster.intersectObjects(this.scene.terrain.children, true);
        if (results.length > 0) {
            this.sightSphere.position.copy(results[0].point);
        }
    }
}

export default Player;