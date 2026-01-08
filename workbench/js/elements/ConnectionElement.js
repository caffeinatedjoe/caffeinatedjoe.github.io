import InteractiveElement from './InteractiveElement.js';

class ConnectionElement extends InteractiveElement {
    constructor(id, fromNode, fromIndex, toNode, toIndex, container) {
        super(id, 'connection', { x: 0, y: 0 }, container);
        this.id = id;
        this.fromNode = fromNode;
        this.fromIndex = fromIndex;
        this.toNode = toNode;
        this.toIndex = toIndex;
        this.container = container;
        this.controlOffset1 = null;
        this.controlOffset2 = null;
        this.control1World = null;
        this.control2World = null;
        this.start = null;
        this.end = null;

        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.svgElement.classList.add('connection-line');
        this.hitElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.hitElement.classList.add('connection-hit');

        this.fromNode.registerConnection(this);
        this.toNode.registerConnection(this);
    }

    render() {
        if (this.container.firstChild) {
            this.container.insertBefore(this.hitElement, this.container.firstChild);
            this.container.insertBefore(this.svgElement, this.container.firstChild);
        } else {
            this.container.appendChild(this.hitElement);
            this.container.appendChild(this.svgElement);
        }
        this.update();
    }

    getDefaultControlPoints(start, end, startNormal, endNormal) {
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        const handleLength = Math.max(40, distance * 0.35);
        return {
            c1: {
                x: start.x + startNormal.x * handleLength,
                y: start.y + startNormal.y * handleLength
            },
            c2: {
                x: end.x + endNormal.x * handleLength,
                y: end.y + endNormal.y * handleLength
            }
        };
    }

    getControlPoints(start, end, startNormal, endNormal) {
        const defaults = this.getDefaultControlPoints(start, end, startNormal, endNormal);
        const c1 = this.controlOffset1
            ? { x: start.x + this.controlOffset1.x, y: start.y + this.controlOffset1.y }
            : defaults.c1;
        const c2 = this.controlOffset2
            ? { x: end.x + this.controlOffset2.x, y: end.y + this.controlOffset2.y }
            : defaults.c2;
        return { c1, c2 };
    }

    update() {
        const start = this.fromNode.getConnectorWorldPosition('output', this.fromIndex);
        const end = this.toNode.getConnectorWorldPosition('input', this.toIndex);
        const startNormal = this.fromNode.getConnectorNormalWorld('output');
        const endNormal = this.toNode.getConnectorNormalWorld('input');
        const { c1, c2 } = this.getControlPoints(start, end, startNormal, endNormal);
        const d = `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
        this.svgElement.setAttribute('d', d);
        this.hitElement.setAttribute('d', d);
        this.position.x = (start.x + end.x) / 2;
        this.position.y = (start.y + end.y) / 2;
        this.start = start;
        this.end = end;
        this.control1World = c1;
        this.control2World = c2;
    }

    updateSvgPosition() {
        this.update();
    }

    updateSvgScale() {}
    updateSvgRotation() {}

    getBoundingBox() {
        if (!this.start || !this.end) {
            return null;
        }
        const minX = Math.min(this.start.x, this.end.x);
        const minY = Math.min(this.start.y, this.end.y);
        const maxX = Math.max(this.start.x, this.end.x);
        const maxY = Math.max(this.start.y, this.end.y);
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    renderHandles() {
        this.removeHandles();
        if (!this.start || !this.end) {
            this.update();
        }
        if (!this.control1World || !this.control2World) {
            return;
        }

        const guideStyle = {
            stroke: 'rgba(52, 152, 219, 0.55)',
            strokeWidth: 1.5
        };

        const guide1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guide1.setAttribute('x1', this.start.x);
        guide1.setAttribute('y1', this.start.y);
        guide1.setAttribute('x2', this.control1World.x);
        guide1.setAttribute('y2', this.control1World.y);
        guide1.setAttribute('stroke', guideStyle.stroke);
        guide1.setAttribute('stroke-width', guideStyle.strokeWidth);
        guide1.setAttribute('pointer-events', 'none');
        this.container.appendChild(guide1);
        this.handles.push(guide1);

        const guide2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guide2.setAttribute('x1', this.end.x);
        guide2.setAttribute('y1', this.end.y);
        guide2.setAttribute('x2', this.control2World.x);
        guide2.setAttribute('y2', this.control2World.y);
        guide2.setAttribute('stroke', guideStyle.stroke);
        guide2.setAttribute('stroke-width', guideStyle.strokeWidth);
        guide2.setAttribute('pointer-events', 'none');
        this.container.appendChild(guide2);
        this.handles.push(guide2);

        const handleRadius = 6;
        const handles = [
            { point: this.control1World, control: 'c1' },
            { point: this.control2World, control: 'c2' }
        ];
        handles.forEach(({ point, control }) => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            handle.setAttribute('cx', point.x);
            handle.setAttribute('cy', point.y);
            handle.setAttribute('r', handleRadius);
            handle.setAttribute('fill', 'white');
            handle.setAttribute('stroke', '#1e90ff');
            handle.setAttribute('stroke-width', 1.5);
            handle.setAttribute('data-handle-type', 'bezier-control');
            handle.setAttribute('data-control', control);
            handle.classList.add('handle');
            this.container.appendChild(handle);
            this.handles.push(handle);
        });
    }

    select() {
        super.select();
        this.svgElement.classList.add('connection-line-selected');
    }

    deselect() {
        super.deselect();
        this.svgElement.classList.remove('connection-line-selected');
    }

    move() {}

    isHitTarget(target) {
        if (target === this.hitElement) return true;
        if (this.hitElement && this.hitElement.contains(target)) return true;
        return super.isHitTarget(target);
    }

    setControlPoint(control, worldPoint) {
        if (!this.start || !this.end) {
            this.update();
        }
        if (control === 'c1') {
            this.controlOffset1 = {
                x: worldPoint.x - this.start.x,
                y: worldPoint.y - this.start.y
            };
        } else {
            this.controlOffset2 = {
                x: worldPoint.x - this.end.x,
                y: worldPoint.y - this.end.y
            };
        }
    }

    destroy() {
        if (this.svgElement) {
            this.svgElement.remove();
        }
        if (this.hitElement) {
            this.hitElement.remove();
        }
        this.removeHandles();
        if (this.fromNode) {
            this.fromNode.unregisterConnection(this);
        }
        if (this.toNode) {
            this.toNode.unregisterConnection(this);
        }
        this.fromNode = null;
        this.toNode = null;
    }

    delete() {
        this.destroy();
    }
}

export default ConnectionElement;
