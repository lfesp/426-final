import * as Dat from 'dat.gui';
import { Scene, Color } from 'three';
import { BasicLights } from 'lights';
import { Terrain } from 'objects';


class NoiseScene extends Scene {
    constructor() {
        // Call parent Scene() constructor
        super();

        // Init state
        this.state = {
            gui: new Dat.GUI(), // Create GUI for scene
            rotationSpeed: 1,
            points: 0,
            lod: 20,
            refresh: () => {
                if (this.terrain === undefined) return;
                this.remove(this.terrain);
                this.terrain = new Terrain(this);
                this.add(this.terrain);
            },
            updateList: [],
        };

        // Set background to a nice color
        this.background = new Color(0x00BFFF);

        // Add lights to scene
        const lights = new BasicLights();
        this.add(lights);

        this.terrain = new Terrain(this);
        // this.add(new Terrain(this));
        this.add(this.terrain);

        // Populate GUI
        // this.state.gui.add(this.state, 'rotationSpeed', -5, 5);
        this.state.gui.add(this.state, 'points').listen();
        this.state.gui.add(this.state, "lod", 5, 30).listen();
        this.state.gui.add(this.state, 'refresh');
    }

    addToUpdateList(object) {
        this.state.updateList.push(object);
    }

    update(timeStamp) {
        const { rotationSpeed, updateList } = this.state;
        // this.rotation.y = (rotationSpeed * timeStamp) / 10000;

        // Call update for each object in the updateList
        for (const obj of updateList) {
            obj.update(timeStamp);
        }
    }
}

export default NoiseScene;
