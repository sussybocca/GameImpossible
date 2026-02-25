// A* pathfinding on grid
export class PathFinder {
    constructor(gridSize, obstacles) {
        this.gridSize = gridSize; // { width, height }
        this.obstacles = new Set(obstacles.map(o => `${o.x},${o.z}`));
    }

    findPath(start, goal) {
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        gScore.set(this.key(start), 0);
        const fScore = new Map();
        fScore.set(this.key(start), this.heuristic(start, goal));

        while (openSet.length > 0) {
            let current = openSet.reduce((a, b) => 
                fScore.get(this.key(a)) < fScore.get(this.key(b)) ? a : b
            );

            if (current.x === goal.x && current.z === goal.z) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(openSet.indexOf(current), 1);
            const neighbors = this.getNeighbors(current);
            for (let neighbor of neighbors) {
                const tentativeG = gScore.get(this.key(current)) + 1;
                if (tentativeG < (gScore.get(this.key(neighbor)) || Infinity)) {
                    cameFrom.set(this.key(neighbor), current);
                    gScore.set(this.key(neighbor), tentativeG);
                    fScore.set(this.key(neighbor), tentativeG + this.heuristic(neighbor, goal));
                    if (!openSet.some(n => n.x === neighbor.x && n.z === neighbor.z)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return null;
    }

    key(node) {
        return `${node.x},${node.z}`;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
    }

    getNeighbors(node) {
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        const neighbors = [];
        for (let [dx, dz] of dirs) {
            const x = node.x + dx;
            const z = node.z + dz;
            if (x >= 0 && x < this.gridSize.width && z >= 0 && z < this.gridSize.height) {
                if (!this.obstacles.has(`${x},${z}`)) {
                    neighbors.push({ x, z });
                }
            }
        }
        return neighbors;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(this.key(current))) {
            current = cameFrom.get(this.key(current));
            path.unshift(current);
        }
        return path;
    }
}
