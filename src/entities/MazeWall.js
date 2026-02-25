import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class MazeWall {
    constructor(game, position, scale, material) {
        this.game = game;
        this.scene = game.sceneManager.scene;
        this.physics = game.physics;

        // Visual
        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(scale.x/2, scale.y/2, scale.z/2));
        this.body = new CANNON.Body({ mass: 0, material: this.physics.wallMaterial });
        this.body.addShape(shape);
        this.body.position.copy(position);
        this.physics.addBody(this.body);
    }
}
