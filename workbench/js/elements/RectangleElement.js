import InteractiveElement from './InteractiveElement.js';

class RectangleElement extends InteractiveElement {
    constructor(id, x, y, width, height, container) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        super(id, 'rectangle', { x: centerX, y: centerY }, container);
        this.width = width;
        this.height = height;
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.svgElement.setAttribute('x', x);
        this.svgElement.setAttribute('y', y);
        this.svgElement.setAttribute('width', width);
        this.svgElement.setAttribute('height', height);
        this.svgElement.setAttribute('fill', 'rgba(52, 152, 219, 0.9)');
        this.svgElement.setAttribute('stroke', 'black');
        this.svgElement.setAttribute('stroke-width', 1);
    }

    render() {
        this.container.appendChild(this.svgElement);
    }

    getBoundingBox() {
        return {
            x: this.position.x - (this.width * this.scale) / 2,
            y: this.position.y - (this.height * this.scale) / 2,
            width: this.width * this.scale,
            height: this.height * this.scale
        };
    }

    updateSvgPosition() {
        const bbox = this.getBoundingBox();
        this.svgElement.setAttribute('x', bbox.x);
        this.svgElement.setAttribute('y', bbox.y);
    }

    updateSvgScale(origin) {
        this.svgElement.setAttribute('width', this.width * this.scale);
        this.svgElement.setAttribute('height', this.height * this.scale);
        if (origin) {
            const newWidth = this.width * this.scale;
            const newHeight = this.height * this.scale;
            const dx = this.position.x - origin.x;
            const dy = this.position.y - origin.y;
            const dirX = dx === 0 ? 1 : Math.sign(dx);
            const dirY = dy === 0 ? 1 : Math.sign(dy);
            this.position.x = origin.x + dirX * (newWidth / 2);
            this.position.y = origin.y + dirY * (newHeight / 2);
        }
        this.updateSvgPosition();
        if (this.rotation !== 0) {
            this.updateSvgRotation();
        }
    }

    updateSvgRotation() {
        const bbox = this.getBoundingBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        this.svgElement.setAttribute('transform', `rotate(${this.rotation} ${centerX} ${centerY})`);
    }
}

export default RectangleElement;
