class HandleRenderer {
    constructor({ container }) {
        this.container = container;
        this.groupHandles = [];
    }

    removeGroupHandles() {
        this.groupHandles.forEach(handle => handle.remove());
        this.groupHandles = [];
    }

    renderGroupHandles({ bbox, groupRotation, groupRotationCenter }) {
        this.removeGroupHandles();
        if (!bbox || !this.container) return;

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
        this.groupHandles.push(border);

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
            this.groupHandles.push(handle);
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
        this.groupHandles.push(rotateHandle);

        if (groupRotation) {
            const center = groupRotationCenter || {
                x: bbox.x + bbox.width / 2,
                y: bbox.y + bbox.height / 2
            };
            this.groupHandles.forEach(handle => {
                handle.setAttribute('transform', `rotate(${groupRotation} ${center.x} ${center.y})`);
            });
        }
    }
}

export default HandleRenderer;
