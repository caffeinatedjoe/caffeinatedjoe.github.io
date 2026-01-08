class Camera {
    constructor({ viewport, rasterLayer, world }) {
        this.viewport = viewport;
        this.rasterLayer = rasterLayer;
        this.world = world;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.ctx = this.rasterLayer.getContext('2d');
        this.resize();
        this.updateTransforms();
    }

    resize() {
        this.rasterLayer.width = this.viewport.clientWidth;
        this.rasterLayer.height = this.viewport.clientHeight;
        this.updateTransforms();
    }

    updateTransforms() {
        this.world.setAttribute('transform', `translate(${this.offsetX}, ${this.offsetY}) scale(${this.scale})`);
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
        this.ctx.clearRect(
            -this.offsetX / this.scale,
            -this.offsetY / this.scale,
            this.viewport.clientWidth / this.scale,
            this.viewport.clientHeight / this.scale
        );
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
        this.updateTransforms();
    }

    zoomAt(clientX, clientY, factor) {
        const rect = this.viewport.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        const worldX = (px - this.offsetX) / this.scale;
        const worldY = (py - this.offsetY) / this.scale;
        this.scale *= factor;
        this.offsetX = px - worldX * this.scale;
        this.offsetY = py - worldY * this.scale;
        this.updateTransforms();
    }

    clientToWorld(clientX, clientY) {
        const rect = this.viewport.getBoundingClientRect();
        const px = clientX - rect.left;
        const py = clientY - rect.top;
        return {
            x: (px - this.offsetX) / this.scale,
            y: (py - this.offsetY) / this.scale
        };
    }
}

export default Camera;
