import * as THREE from 'three';
import { PathFinder } from './PathFinder.js';

export class EnemyBehavior {
    constructor(enemy, player) {
        this.enemy = enemy;
        this.player = player;
        this.state = 'PATROL'; // IDLE, PATROL, CHASE, ATTACK, FLEE
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.detectionRange = 15;
        this.attackRange = 2.5;
        this.pathFinder = null;
        this.path = [];
        this.pathIndex = 0;
        this.lastPlayerSeen = null;
        this.memoryTime = 5; // seconds
        this.memoryTimer = 0;
    }

    update(deltaTime) {
        const distToPlayer = this.enemy.body.position.distanceTo(this.player.body.position);

        // State transitions
        if (distToPlayer < this.detectionRange) {
            this.state = 'CHASE';
            this.lastPlayerSeen = this.player.body.position.clone();
            this.memoryTimer = this.memoryTime;
        } else if (this.state === 'CHASE' && this.memoryTimer <= 0) {
            this.state = 'PATROL';
        }

        if (this.state === 'CHASE' && distToPlayer < this.attackRange) {
            this.state = 'ATTACK';
        }

        if (this.state === 'ATTACK' && distToPlayer > this.attackRange * 1.2) {
            this.state = 'CHASE';
        }

        // Memory decay
        if (this.memoryTimer > 0) {
            this.memoryTimer -= deltaTime;
        }

        // Behavior per state
        switch (this.state) {
            case 'PATROL':
                this.patrol(deltaTime);
                break;
            case 'CHASE':
                this.chase(deltaTime);
                break;
            case 'ATTACK':
                this.attack();
                break;
            case 'FLEE':
                this.flee(deltaTime);
                break;
        }
    }

    patrol(deltaTime) {
        if (this.patrolPoints.length === 0) {
            // Generate random patrol points within a radius
            const center = this.enemy.body.position.clone();
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 5 + Math.random() * 5;
                this.patrolPoints.push(new THREE.Vector3(
                    center.x + Math.cos(angle) * radius,
                    center.y,
                    center.z + Math.sin(angle) * radius
                ));
            }
        }

        const target = this.patrolPoints[this.currentPatrolIndex];
        const direction = new THREE.Vector3().subVectors(target, this.enemy.body.position);
        if (direction.length() < 1) {
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        } else {
            direction.normalize();
            this.enemy.body.velocity.x = direction.x * this.enemy.speed;
            this.enemy.body.velocity.z = direction.z * this.enemy.speed;
        }
    }

    chase(deltaTime) {
        // Use pathfinding if terrain is complex
        if (!this.pathFinder) {
            // Simple direct chase
            const direction = new THREE.Vector3().subVectors(this.player.body.position, this.enemy.body.position);
            direction.normalize();
            this.enemy.body.velocity.x = direction.x * this.enemy.speed * 1.5;
            this.enemy.body.velocity.z = direction.z * this.enemy.speed * 1.5;
        } else {
            // Pathfinding not implemented in this example
        }
    }

    attack() {
        if (this.enemy.attackCooldown <= 0) {
            // Damage player
            this.player.takeDamage(this.enemy.damage);
            this.enemy.attackCooldown = 1.0;
        }
    }

    flee(deltaTime) {
        const direction = new THREE.Vector3().subVectors(this.enemy.body.position, this.player.body.position);
        direction.normalize();
        this.enemy.body.velocity.x = direction.x * this.enemy.speed * 2;
        this.enemy.body.velocity.z = direction.z * this.enemy.speed * 2;
    }
}
