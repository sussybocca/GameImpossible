// Simple Perlin noise implementation
export class PerlinNoise {
    constructor() {
        this.permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
        this.p = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i % 256];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        const aaa = this.p[this.p[this.p[X] + Y] + Z];
        const aba = this.p[this.p[this.p[X] + Y + 1] + Z];
        const aab = this.p[this.p[this.p[X] + Y] + Z + 1];
        const abb = this.p[this.p[this.p[X] + Y + 1] + Z + 1];
        const baa = this.p[this.p[this.p[X + 1] + Y] + Z];
        const bba = this.p[this.p[this.p[X + 1] + Y + 1] + Z];
        const bab = this.p[this.p[this.p[X + 1] + Y] + Z + 1];
        const bbb = this.p[this.p[this.p[X + 1] + Y + 1] + Z + 1];

        let x1, x2, y1, y2;
        x1 = this.lerp(u, this.grad(aaa, x, y, z), this.grad(baa, x - 1, y, z));
        x2 = this.lerp(u, this.grad(aba, x, y - 1, z), this.grad(bba, x - 1, y - 1, z));
        y1 = this.lerp(v, x1, x2);
        x1 = this.lerp(u, this.grad(aab, x, y, z - 1), this.grad(bab, x - 1, y, z - 1));
        x2 = this.lerp(u, this.grad(abb, x, y - 1, z - 1), this.grad(bbb, x - 1, y - 1, z - 1));
        y2 = this.lerp(v, x1, x2);
        return (this.lerp(w, y1, y2) + 1) / 2;
    }
}
