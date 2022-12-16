import { Vector3, Raycaster, Mesh, SphereBufferGeometry, MeshBasicMaterial, Line, LineBasicMaterial, BufferGeometry } from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const MOVE_SPEED = 6;
const GRAPPLE_SPEED = 10;
const GRAPPLE_LENGTH = 12;
const GRAVITY = 1.3;
const JUMP_STRENGTH = 50;
const DAMPING = 8;
const EPS = 10;

const POINT_RADIUS = 5
const PLAYER_HEIGHT = 12;
class Player {
    constructor(camera, document, scene) {
        this.scene = scene;
        this.prevTime = performance.now();

        this.position = new Vector3(0, 100, 0);
        this.velocity = new Vector3(0, 0, 0);
        this.direction = new Vector3(0, 0, 0);
        this.onGround = true;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.adding = false;
        this.grappling = false;
        this.deleting = false;

        this.raycaster = new Raycaster(this.position, new Vector3(0, -1, 0), 0, 1000);
        this.sightcaster = new Raycaster(this.position, new Vector3(), 0, 1000)
        this.sightPoint = new Vector3();
        this.grapplePoint = new Vector3();
        this.sightSphere = new Mesh(new SphereBufferGeometry(0.5, 16, 8), new MeshBasicMaterial({ color: 0xffffff }))
        this.minimapSphere = new Mesh(new SphereBufferGeometry(3, 16, 8), new MeshBasicMaterial({ color: 0x0000ff }))
        
        scene.add(this.minimapSphere)
        scene.add(this.sightSphere);

        this.line = new Line(new BufferGeometry().setFromPoints( [this.position, this.grapplePoint ]), new LineBasicMaterial({color: 0xffffff, linewidth: 50}));
        this.line.frustumCulled = false;
        scene.add(this.line);
        

        this.camera = camera;

        this.controls = new PointerLockControls(
            camera,
            document.body
        );

        this.camera.lookAt(1, 0, 1);

        this.overheadView = false

        this.points = 0
        this.nextPoint = this.newPoint();
        this.pointSphere = new Mesh(new SphereBufferGeometry(POINT_RADIUS, 16, 8), new MeshBasicMaterial({ color: 0xffd700 }))
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
                this.moveForward = true;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;

            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;

            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;

            case 'Space':
                if (this.onGround === true) {
                    this.velocity.y = JUMP_STRENGTH;
                    this.onGround = false
                }
                break;

            case 'ShiftLeft':
                this.grappling = true;
                this.grapplePoint = this.sightPoint;
                this.line.visible = true;
                break;

            case 'KeyQ':
                this.overheadView = true
                break;
        }
    };

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;

            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;

            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;

            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;

            case 'ShiftLeft':
                this.grappling = false;
                this.line.visible = false;
                break;

            case 'KeyQ':
                this.overheadView = false
                break;
        }
    };

    newPoint() {
        return new Vector3(Math.random() * 15 * 10 + 25, Math.random() * 20 * 4 + 20 * 2, Math.random() * 15 * 10 + 25);
        // let position;
        // do {
        //     position = new Vector3(Math.random() * 15 * 10 + 25, Math.random() * 20 * 4 + 20 * 2, Math.random() * 15 * 10 + 25);
        // } while (this.scene.terrain.scalarField[Math.floor(position.x)][Math.floor(position.y)][Math.floor(position.z)] < this.scene.terrain.isolevel);
        // return position;
    }

    checkPoint() {
        if (this.position.distanceTo(this.nextPoint) < POINT_RADIUS * 2) {
            this.points += 1
            this.nextPoint = this.newPoint()
            this.pointSphere.position.copy(this.nextPoint)
            this.scene.state.points = this.points;
        }
    }

    updateGrappleLine() {
        const positions = this.line.geometry.attributes.position.array;
        positions[0] = this.position.x;
        positions[1] = this.position.y - 1;
        positions[2] = this.position.z;

        positions[3] = this.grapplePoint.x;
        positions[4] = this.grapplePoint.y;
        positions[5] = this.grapplePoint.z;

        this.line.geometry.attributes.position.needsUpdate = true;
    }

    // not mine
    update(timeStamp) {
        const delta = (timeStamp - this.prevTime) / 1000;
        this.prevTime = timeStamp;

        this.checkPoint()

        // ensure consistent movement speed in all directions.
        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        // calculate vectors to convert movement vector from camera to world coords
        const cameraDirection = this.controls.getDirection(new Vector3());
        cameraDirection.normalize();
        const rightDirection = cameraDirection.clone().cross(this.camera.up).normalize();

   
        // apply player movement in world coords
        if (this.moveForward || this.moveBackward) {
            this.velocity.x += cameraDirection.x * this.direction.z * MOVE_SPEED;
            this.velocity.z += cameraDirection.z * this.direction.z * MOVE_SPEED;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x += rightDirection.x * this.direction.x * MOVE_SPEED;
            this.velocity.z += rightDirection.z * this.direction.x * MOVE_SPEED;
        }


        // handle terrain addition and deletion
        if (this.adding || this.deleting) {
            if (this.sightPoint) {
                if (this.adding) this.scene.terrain.addTerrain(this.sightPoint, delta);
                if (this.deleting) this.scene.terrain.deleteTerrain(this.sightPoint, delta);
            }
        }

        // apply acceleration due to grapple hook
        if (this.grappling) {
            if (this.grapplePoint) {
                const toGrapple = this.grapplePoint.clone().sub(this.position);
                if (toGrapple.length() >= GRAPPLE_LENGTH) this.velocity.addScaledVector(toGrapple.normalize(), GRAPPLE_SPEED);
            }
        }

        this.velocity.y -= GRAVITY;

        // update position
        this.position.addScaledVector(this.velocity, delta);

        // handle ground collisions
        this.raycaster.set(this.position, new Vector3(0, -1, 0))
        const intersections = this.raycaster.intersectObjects(this.scene.terrain.children, true);
        this.onGround = false
        if (intersections.length > 0) {
            const distance = intersections[0].distance;
            if (distance < PLAYER_HEIGHT) {
                this.position.y = Math.max(this.position.y, intersections[0].point.y + PLAYER_HEIGHT)
                this.velocity.y = Math.max(0, this.velocity.y);
                this.onGround = true
            }
        }

        // clamp position into bounding box of world
        this.position.y = Math.max(this.position.y, EPS);
        this.position.x = Math.min(Math.max(this.position.x, EPS), 20 * 10 - EPS * 4); // resolution * xLength
        this.position.z = Math.min(Math.max(this.position.z, EPS), 20 * 10 - EPS * 4); // resolution * zLength

        // update camera position
        this.camera.position.copy(this.position);

        // display minimap view by changing camera position.
        this.minimapSphere.visible = false
        this.minimapSphere.position.copy(this.position)
        if (this.overheadView) {
            this.minimapSphere.visible = true
            this.camera.position.x = 20 * 5
            this.camera.position.y = 300
            this.camera.position.z = 20 * 5
            this.camera.lookAt(new Vector3(5 * 20, 0, 5 * 20))
        }

        // apply friction to non-vertical movement.
        this.velocity.x -= this.velocity.x * delta * DAMPING;
        this.velocity.z -= this.velocity.z * delta * DAMPING;

        this.castSight()
        this.sightSphere.position.copy(this.sightPoint);
        if (this.grappling) this.updateGrappleLine();
    }

    // cast a ray from the center of the screen to intersect
    // with the world. if there is a collision, move the white 'sight cursor/reticle'
    // and return the intersection position.
    castSight() {
        let dir = new Vector3();
        this.camera.getWorldDirection(dir);
        this.sightcaster.set(this.position, dir);
        const results = this.sightcaster.intersectObjects(this.scene.terrain.children, true);
        if (results.length > 0) {
            this.sightPoint = results[0].point;
            return results[0].point
        }
        return undefined
    }
}

export default Player;