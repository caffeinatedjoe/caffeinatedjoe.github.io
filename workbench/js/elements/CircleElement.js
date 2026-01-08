import InteractiveElement from './InteractiveElement.js';

class CircleElement extends InteractiveElement {
    constructor(id, cx, cy, r, container) {
        super(id, 'circle', { x: cx, y: cy }, container);
        this.r = r;
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.svgElement.setAttribute('cx', cx);
        this.svgElement.setAttribute('cy', cy);
        this.svgElement.setAttribute('r', r);
        this.svgElement.setAttribute('fill', 'rgba(231, 76, 60, 0.9)');
        this.svgElement.setAttribute('stroke', 'black');
        this.svgElement.setAttribute('stroke-width', 1);
    }

    render() {
        this.container.appendChild(this.svgElement);
    }

    getBoundingBox() {
        return {
            x: this.position.x - this.r * this.scale,
            y: this.position.y - this.r * this.scale,
            width: 2 * this.r * this.scale,
            height: 2 * this.r * this.scale
        };
    }

    updateSvgPosition() {
        this.svgElement.setAttribute('cx', this.position.x);
        this.svgElement.setAttribute('cy', this.position.y);
    }

    updateSvgScale(origin) {
        this.svgElement.setAttribute('r', this.r * this.scale);
        if (origin) {
            const newRadius = this.r * this.scale;
            const dx = origin.x - this.position.x;
            const dy = origin.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const unitX = dx / dist;
                const unitY = dy / dist;
                this.position.x = origin.x - unitX * newRadius;
                this.position.y = origin.y - unitY * newRadius;
            }
        }
        this.updateSvgPosition();
        if (this.rotation !== 0) {
            this.updateSvgRotation();
        }
    }

    updateSvgRotation() {
        this.svgElement.setAttribute('transform', `rotate(${this.rotation} ${this.position.x} ${this.position.y})`);
    }

    renderHandles() {
        this.removeHandles();

        const border = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        border.setAttribute('cx', this.position.x);
        border.setAttribute('cy', this.position.y);
        border.setAttribute('rx', this.r * this.scale);
        border.setAttribute('ry', this.r * this.scale);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', 'blue');
        border.setAttribute('stroke-width', 2);
        border.setAttribute('stroke-dasharray', '5,5');
        this.container.appendChild(border);
        this.handles.push(border);

        const handleSize = 8;
        const points = [
            { x: this.position.x, y: this.position.y - this.r * this.scale, name: 'top' },
            { x: this.position.x + this.r * this.scale, y: this.position.y, name: 'right' },
            { x: this.position.x, y: this.position.y + this.r * this.scale, name: 'bottom' },
            { x: this.position.x - this.r * this.scale, y: this.position.y, name: 'left' }
        ];
        points.forEach(point => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handle.setAttribute('x', point.x - handleSize / 2);
            handle.setAttribute('y', point.y - handleSize / 2);
            handle.setAttribute('width', handleSize);
            handle.setAttribute('height', handleSize);
            handle.setAttribute('fill', 'white');
            handle.setAttribute('stroke', 'blue');
            handle.setAttribute('stroke-width', 1);
            handle.setAttribute('data-handle-type', 'scale');
            handle.setAttribute('data-corner', point.name);
            handle.classList.add('handle');
            this.container.appendChild(handle);
            this.handles.push(handle);
        });

        const rotateHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rotateHandle.setAttribute('cx', this.position.x);
        rotateHandle.setAttribute('cy', this.position.y - this.r * this.scale - 20);
        rotateHandle.setAttribute('r', 6);
        rotateHandle.setAttribute('fill', 'white');
        rotateHandle.setAttribute('stroke', 'blue');
        rotateHandle.setAttribute('stroke-width', 1);
        rotateHandle.setAttribute('data-handle-type', 'rotate');
        this.container.appendChild(rotateHandle);
        this.handles.push(rotateHandle);

        this.applyHandleRotation(this.position.x, this.position.y);
    }
}

export default CircleElement;
