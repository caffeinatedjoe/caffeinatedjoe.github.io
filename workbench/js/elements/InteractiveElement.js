class InteractiveElement {
    constructor(id, type, position, container, scale = 1, rotation = 0) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.scale = scale;
        this.rotation = rotation;
        this.container = container;
        this.svgElement = null;
        this.selected = false;
        this.handles = [];
    }

    select() {
        this.selected = true;
        this.renderHandles();
    }

    deselect() {
        this.selected = false;
        this.removeHandles();
    }

    move(deltaX, deltaY) {
        this.position.x += deltaX;
        this.position.y += deltaY;
        this.updateSvgPosition();
        if (this.rotation !== 0) {
            this.updateSvgRotation();
        }
    }

    scaleElement(factor, origin) {
        this.scale *= factor;
        this.updateSvgScale(origin);
    }

    rotate(angle) {
        this.rotation += angle;
        this.updateSvgRotation();
    }

    delete() {
        if (this.svgElement) {
            this.svgElement.remove();
        }
        this.removeHandles();
    }

    renderHandles() {
        this.removeHandles();
        const bbox = this.getBoundingBox();
        if (!bbox) return;

        const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        border.setAttribute('x', bbox.x);
        border.setAttribute('y', bbox.y);
        border.setAttribute('width', bbox.width);
        border.setAttribute('height', bbox.height);
        border.setAttribute('fill', 'none');
        border.setAttribute('stroke', 'blue');
        border.setAttribute('stroke-width', 2);
        border.setAttribute('stroke-dasharray', '5,5');
        this.container.appendChild(border);
        this.handles.push(border);

        const handleSize = 8;
        const corners = [
            { x: bbox.x, y: bbox.y, name: 'top-left' },
            { x: bbox.x + bbox.width, y: bbox.y, name: 'top-right' },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height, name: 'bottom-right' },
            { x: bbox.x, y: bbox.y + bbox.height, name: 'bottom-left' }
        ];
        corners.forEach(corner => {
            const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            handle.setAttribute('x', corner.x - handleSize / 2);
            handle.setAttribute('y', corner.y - handleSize / 2);
            handle.setAttribute('width', handleSize);
            handle.setAttribute('height', handleSize);
            handle.setAttribute('fill', 'white');
            handle.setAttribute('stroke', 'blue');
            handle.setAttribute('stroke-width', 1);
            handle.setAttribute('data-handle-type', 'scale');
            handle.setAttribute('data-corner', corner.name);
            handle.classList.add('handle');
            this.container.appendChild(handle);
            this.handles.push(handle);
        });

        const rotateHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rotateHandle.setAttribute('cx', bbox.x + bbox.width / 2);
        rotateHandle.setAttribute('cy', bbox.y - 20);
        rotateHandle.setAttribute('r', 6);
        rotateHandle.setAttribute('fill', 'white');
        rotateHandle.setAttribute('stroke', 'blue');
        rotateHandle.setAttribute('stroke-width', 1);
        rotateHandle.setAttribute('data-handle-type', 'rotate');
        this.container.appendChild(rotateHandle);
        this.handles.push(rotateHandle);

        this.applyHandleRotation(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    }

    removeHandles() {
        this.handles.forEach(handle => handle.remove());
        this.handles = [];
    }

    applyHandleRotation(centerX, centerY) {
        if (this.rotation === 0) return;
        this.handles.forEach(handle => {
            handle.setAttribute('transform', `rotate(${this.rotation} ${centerX} ${centerY})`);
        });
    }

    isHitTarget(target) {
        if (!this.svgElement) return false;
        return target === this.svgElement || this.svgElement.contains(target);
    }

    getBoundingBox() {
        return null;
    }

    updateSvgPosition() {}
    updateSvgScale() {}
    updateSvgRotation() {}
}

export default InteractiveElement;
