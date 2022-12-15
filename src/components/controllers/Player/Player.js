import { Vector3, Raycaster, Ray, Vector2, Mesh, SphereBufferGeometry, MeshBasicMaterial } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

const moveSpeed = 5;
const gravity = 1.3;
const jumpSpeed = 30;
const friction = 0.8;

const pointRadius = 5

class Player {
    constructor(camera, document, scene) {
        this.position = new Vector3(0, 100, 0);
        // this.acceleration = new Vector3(0, 0, 0);
        this.velocity = new Vector3(0, 0, 0);
        this.direction = new Vector3(0, 0, 0);
        this.raycaster = new Raycaster(this.position, new Vector3(0, -1, 0), 0, 1000);
        this.sightcaster = new Raycaster(this.position, new Vector3(), 0, 1000)
        this.sightSphere = new Mesh(new SphereBufferGeometry(0.5, 16, 8), new MeshBasicMaterial({ color: 0xffffff }))
        // add sphere to the scene
        scene.add(this.sightSphere);
        this.scene = scene;
        this.onGround = true
        this.adding = false
        this.deleting = false;
        this.prevTime = performance.now();

        this.camera = camera;

        this.controls = new PointerLockControls(
            camera,
            document.body
        );

        this.camera.lookAt(1, 0, 1);


        this.points = 0
        this.nextPoint = this.newPoint()
        this.pointSphere = new Mesh(new SphereBufferGeometry(pointRadius, 16, 8), new MeshBasicMaterial({ color: 0xffd700 }))
        this.pointSphere.position.copy(this.nextPoint)
        this.scene.add(this.pointSphere)

        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    // lock the screen on mouse press
    onMouseDown(event) {
        if (!this.controls.isLocked) {
            this.controls.lock();
            return;
        }
        switch (event.which) {
            case 1:
                this.adding = true;
                break;
            case 3:
                this.deleting = true;
                break;
            default:
        }
    }

    onMouseUp(event) {
        switch (event.which) {
            case 1:
                this.adding = false;
                break;
            case 3:
                this.deleting = false;
                break;
            default:
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

    newPoint() {
        return new Vector3(Math.random() * 20 * 10, Math.random() * 20 * 4 + 20 * 2, Math.random() * 20 * 10)
    }

    checkPoint() {
        if (this.position.distanceTo(this.nextPoint) < pointRadius * 2) {
            this.points += 1
            this.nextPoint = this.newPoint()
            this.pointSphere.position.copy(this.nextPoint)
            this.scene.state.points = this.points;
            
            // this.scene.state.timer = new
        }
    }

    // not mine
    update(timeStamp) {
        const delta = (timeStamp - this.prevTime) / 1000;
        this.prevTime = timeStamp;

        this.checkPoint()

        if (this.adding || this.deleting) {
            let sightPoint = this.castSight()
            if (sightPoint) {
                console.log(sightPoint);
                if (this.adding) this.scene.terrain.addTerrain(sightPoint, this.scene);
                if (this.deleting) this.scene.terrain.deleteTerrain(sightPoint, this.scene);
            }
        }

        // this.acceleration.x = 0.0;
        // this.acceleration.y = 0.0;
        // this.acceleration.z = 0.0;
        // this.acceleration.y -= 10.;

        // this.velocity.multiplyScalar(friction * delta)
        this.velocity.y -= gravity;
        // this.velocity.y = Math.min(-gravity * 4, this.velocity.y);
        this.position.y = Math.min(Math.max(0, this.position.y), 300);

        this.direction.z = Number(moveForward) - Number(moveBackward);
        this.direction.x = Number(moveRight) - Number(moveLeft);
        this.direction.y = Number(moveUp) - Number(moveDown);
        this.direction.normalize(); // this ensures consistent movements in all directions

        const cameraDirection = this.controls.getDirection(new Vector3());
        cameraDirection.y = 0
        cameraDirection.normalize()
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
            if (distance < 15) {
                this.position.y = Math.max(this.position.y, intersections[0].point.y + 15)
                this.velocity.y = Math.max(0, this.velocity.y);
                this.onGround = true
            }
        }

        //  this.raycaster.set(this.position, new Vector3(0, -1, 0))


        let eps = 10
        this.position.y = Math.max(this.position.y, eps);
        this.position.x = Math.min(Math.max(this.position.x, eps), 20 * 10 - eps * 4); // resolution * xLength
        this.position.z = Math.min(Math.max(this.position.z, eps), 20 * 10 - eps * 4); // resolution * zLength
        //    this.position.x = Math.min(this.position.y, 0);
        //    this.position.z = Math.min(this.position.y, 0);
        //    this.position.y = Math.min(this.position.y, 0);

        this.position.addScaledVector(this.velocity, delta);
        this.camera.position.copy(this.position);


        this.velocity.x *= friction;
        this.velocity.z *= friction;

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
            return results[0].point
        }
        return undefined
    }
}

export default Player;