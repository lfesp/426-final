import { Group, AmbientLight, HemisphereLight, DirectionalLight } from 'three';

class BasicLights extends Group {
    constructor(...args) {
        // Invoke parent Group() constructor with our args
        super(...args);

        const dir = new DirectionalLight(0xffffdd, 1.0);
        const ambi = new AmbientLight(0x404040, 1.32);
        const hemi = new HemisphereLight(0xffffbb, 0x080820, 0.2);

        dir.position.set(5, 1, 2);
        dir.target.position.set(0, 0, 0);

        this.add(ambi, dir, hemi);
    }
}

export default BasicLights;
