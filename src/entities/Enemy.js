import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EnemyBehavior } from '../ai/EnemyBehavior.js';

export class Enemy {
    constructor(game, position, type = 'grunt') {
        this.game = game;
        this.scene = game.sceneManager.scene;
        this.physics = game.physics;
        this.assets = game.assets;
        this.type = type;

        this.mesh = this.assets.models.enemy.clone();
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);

        // Physics body
        const shape = new CANNON.Sphere(0.8);
        this.body = new CANNON.Body({ mass: 50, material: this.physics.enemyMaterial });
        this.body.addShape(shape);
        this.body.position.copy(position);
        this.body.linearDamping = 0.5;
        this.physics.addBody(this.body);

        this.behavior = new EnemyBehavior(this, game.player);
        this.health = type === 'grunt' ? 50 : 100;
        this.speed = type === 'grunt' ? 3 : 2;
        this.damage = type === 'grunt' ? 10 : 20;
        this.attackCooldown = 0;
        this.state = 'IDLE';
    }

    update(deltaTime) {
        this.behavior.update(deltaTime);
        // Sync mesh
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Attack cooldown
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.destroy();
            this.game.assets.playSound('explosion', 0.5);
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.physics.removeBody(this.body);
        const idx = this.game.currentLevel.enemies.indexOf(this);
        if (idx !== -1) this.game.currentLevel.enemies.splice(idx, 1);
    }
}
