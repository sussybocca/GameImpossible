import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createExplosion(position, color = 0xff5500, count = 30) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
            positions[i*3] = position.x;
            positions[i*3+1] = position.y;
            positions[i*3+2] = position.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
            ));
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({ color: color, size: 0.3, blending: THREE.AdditiveBlending });
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        this.particles.push({
            mesh: points,
            velocities,
            life: 1.0,
            maxLife: 1.0,
            positions: positions,
            count
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
                continue;
            }

            const posAttr = p.mesh.geometry.attributes.position;
            const array = posAttr.array;
            for (let j = 0; j < p.count; j++) {
                array[j*3] += p.velocities[j].x * deltaTime;
                array[j*3+1] += p.velocities[j].y * deltaTime;
                array[j*3+2] += p.velocities[j].z * deltaTime;
                // Simple gravity
                p.velocities[j].y -= 2 * deltaTime;
            }
            posAttr.needsUpdate = true;

            // Fade out
            p.mesh.material.opacity = p.life;
        }
    }
}
