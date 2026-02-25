export const MathUtils = {
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    degToRad(deg) {
        return deg * Math.PI / 180;
    },

    radToDeg(rad) {
        return rad * 180 / Math.PI;
    },

    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    rotateVector(v, axis, angle) {
        const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
        return v.clone().applyQuaternion(q);
    },

    projectVector(v, onto) {
        const scalar = v.dot(onto) / onto.lengthSq();
        return onto.clone().multiplyScalar(scalar);
    },

    reflectVector(v, normal) {
        return v.clone().sub(normal.clone().multiplyScalar(2 * v.dot(normal)));
    }
};
