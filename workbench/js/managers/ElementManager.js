import { rotatePoint } from '../core/geometry.js';

class ElementManager {
    constructor() {
        this.elements = [];
        this.selectedElements = [];
        this.groupHandles = [];
        this.groupRotation = 0;
        this.groupRotationCenter = null;
        this.clipboard = [];
        this.clipboardPasteIndex = 0;
    }

    addElement(element) {
        this.elements.push(element);
    }

    getElementById(id) {
        return this.elements.find(element => element.id === id);
    }

    removeElement(element) {
        const index = this.elements.indexOf(element);
        if (index > -1) {
            this.elements.splice(index, 1);
        }
        this.deselectElement(element);
    }

    selectElement(element, shiftKey = false) {
        const wasSelected = this.selectedElements.includes(element);
        if (!shiftKey) {
            this.deselectAll();
        }
        if (wasSelected && shiftKey) {
            this.deselectElement(element);
        } else {
            this.selectedElements.push(element);
            element.select();
        }
        this.groupRotation = 0;
        this.groupRotationCenter = null;
        this.updateHandles();
    }

    deselectElement(element) {
        const index = this.selectedElements.indexOf(element);
        if (index > -1) {
            this.selectedElements.splice(index, 1);
            element.deselect();
            this.groupRotation = 0;
            this.groupRotationCenter = null;
            this.updateHandles();
        }
    }

    deselectAll() {
        this.removeIndividualHandles();
        this.removeGroupHandles();
        this.selectedElements.forEach(element => element.deselect());
        this.selectedElements = [];
        this.groupRotation = 0;
        this.groupRotationCenter = null;
    }

    setSelection(elements) {
        this.deselectAll();
        this.selectedElements = [];
        elements.forEach(element => {
            if (!element) return;
            element.selected = true;
            this.selectedElements.push(element);
        });
        this.groupRotation = 0;
        this.groupRotationCenter = null;
        this.updateHandles();
    }

    getSelected() {
        return this.selectedElements;
    }

    handleClick(event, shiftKey = false) {
        let targetElement = null;
        for (const element of this.elements) {
            if (element.isHitTarget && element.isHitTarget(event.target)) {
                targetElement = element;
                break;
            }
        }
        if (targetElement) {
            this.selectElement(targetElement, shiftKey);
        } else {
            this.deselectAll();
        }
    }

    handleKeyDown(event, { createElementFromDescriptor, cursorWorld } = {}) {
        const key = event.key.toLowerCase();
        const hasModifier = event.ctrlKey || event.metaKey;

        if (hasModifier && key === 'c') {
            this.copySelection();
            event.preventDefault();
            return;
        }

        if (hasModifier && key === 'v') {
            this.pasteClipboard(createElementFromDescriptor, cursorWorld);
            event.preventDefault();
            return;
        }

        if ((key === 'delete' || key === 'backspace') && this.selectedElements.length > 0) {
            const selected = this.selectedElements.slice();
            this.selectedElements = [];
            this.removeIndividualHandles();
            this.removeGroupHandles();
            selected.forEach(element => {
                element.delete();
                this.removeElement(element);
            });
            document.dispatchEvent(new CustomEvent('nodeflow:changed'));
            event.preventDefault();
        }
    }

    copySelection() {
        if (this.selectedElements.length === 0) {
            this.clipboard = [];
            this.clipboardPasteIndex = 0;
            return;
        }
        this.clipboard = this.selectedElements
            .map(element => this.serializeElement(element))
            .filter(Boolean);
        this.clipboardPasteIndex = 0;
    }

    pasteClipboard(createElementFromDescriptor, cursorWorld) {
        if (!createElementFromDescriptor || this.clipboard.length === 0) {
            return [];
        }
        let offsetX = 0;
        let offsetY = 0;

        if (cursorWorld && Number.isFinite(cursorWorld.x) && Number.isFinite(cursorWorld.y)) {
            const bounds = this.getClipboardBounds();
            if (bounds) {
                offsetX = cursorWorld.x - (bounds.x + bounds.width / 2);
                offsetY = cursorWorld.y - (bounds.y + bounds.height / 2);
            }
        } else {
            this.clipboardPasteIndex += 1;
            const offset = 20 * this.clipboardPasteIndex;
            offsetX = offset;
            offsetY = offset;
        }
        const pastedElements = [];

        this.clipboard.forEach(descriptor => {
            const offsetDescriptor = this.offsetDescriptor(descriptor, offsetX, offsetY);
            const newElement = createElementFromDescriptor(offsetDescriptor);
            if (!newElement) return;
            this.addElement(newElement);
            pastedElements.push(newElement);
        });

        if (pastedElements.length > 0) {
            this.setSelection(pastedElements);
            document.dispatchEvent(new CustomEvent('nodeflow:changed'));
        }

        return pastedElements;
    }

    getClipboardBounds() {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        this.clipboard.forEach(descriptor => {
            const bbox = this.getDescriptorBoundingBox(descriptor);
            if (!bbox) return;
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        });

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return null;
        }

        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    getDescriptorBoundingBox(descriptor) {
        if (!descriptor) return null;

        if (descriptor.type === 'circle') {
            const r = descriptor.r * descriptor.scale;
            return {
                x: descriptor.position.x - r,
                y: descriptor.position.y - r,
                width: 2 * r,
                height: 2 * r
            };
        }

        if (descriptor.type === 'line') {
            const minX = Math.min(descriptor.x1, descriptor.x2);
            const minY = Math.min(descriptor.y1, descriptor.y2);
            const maxX = Math.max(descriptor.x1, descriptor.x2);
            const maxY = Math.max(descriptor.y1, descriptor.y2);
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }

        if (descriptor.type === 'rectangle') {
            const halfW = (descriptor.width * descriptor.scale) / 2;
            const halfH = (descriptor.height * descriptor.scale) / 2;
            const rotationRad = (descriptor.rotation || 0) * Math.PI / 180;
            if (rotationRad === 0) {
                return {
                    x: descriptor.position.x - halfW,
                    y: descriptor.position.y - halfH,
                    width: halfW * 2,
                    height: halfH * 2
                };
            }
            const cos = Math.cos(rotationRad);
            const sin = Math.sin(rotationRad);
            const corners = [
                { x: -halfW, y: -halfH },
                { x: halfW, y: -halfH },
                { x: halfW, y: halfH },
                { x: -halfW, y: halfH }
            ];
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            corners.forEach(offset => {
                const worldX = descriptor.position.x + offset.x * cos - offset.y * sin;
                const worldY = descriptor.position.y + offset.x * sin + offset.y * cos;
                minX = Math.min(minX, worldX);
                minY = Math.min(minY, worldY);
                maxX = Math.max(maxX, worldX);
                maxY = Math.max(maxY, worldY);
            });
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }

        if (descriptor.type === 'node') {
            const halfW = (descriptor.width * descriptor.scale) / 2;
            const halfH = (descriptor.height * descriptor.scale) / 2;
            const rotationRad = (descriptor.rotation || 0) * Math.PI / 180;
            if (rotationRad === 0) {
                return {
                    x: descriptor.position.x - halfW,
                    y: descriptor.position.y - halfH,
                    width: halfW * 2,
                    height: halfH * 2
                };
            }
            const cos = Math.cos(rotationRad);
            const sin = Math.sin(rotationRad);
            const corners = [
                { x: -halfW, y: -halfH },
                { x: halfW, y: -halfH },
                { x: halfW, y: halfH },
                { x: -halfW, y: halfH }
            ];
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            corners.forEach(offset => {
                const worldX = descriptor.position.x + offset.x * cos - offset.y * sin;
                const worldY = descriptor.position.y + offset.x * sin + offset.y * cos;
                minX = Math.min(minX, worldX);
                minY = Math.min(minY, worldY);
                maxX = Math.max(maxX, worldX);
                maxY = Math.max(maxY, worldY);
            });
            return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }

        if (descriptor.type === 'text') {
            return { x: descriptor.position.x, y: descriptor.position.y, width: 0, height: 0 };
        }

        return null;
    }

    serializeElement(element) {
        const base = {
            type: element.type,
            position: { x: element.position.x, y: element.position.y },
            scale: element.scale,
            rotation: element.rotation
        };

        if (element.type === 'rectangle') {
            return {
                ...base,
                width: element.width,
                height: element.height
            };
        }

        if (element.type === 'node') {
            return {
                ...base,
                width: element.width,
                height: element.height,
                inputCount: element.inputCount,
                outputCount: element.outputCount,
                cornerRadius: element.cornerRadius,
                textValue: typeof element.getTextValue === 'function' ? element.getTextValue() : ''
            };
        }

        if (element.type === 'circle') {
            return {
                ...base,
                r: element.r
            };
        }

        if (element.type === 'line') {
            return {
                ...base,
                x1: element.x1,
                y1: element.y1,
                x2: element.x2,
                y2: element.y2
            };
        }

        if (element.type === 'text') {
            return {
                ...base,
                text: element.text,
                baseFontSize: element.baseFontSize,
                fontFamily: element.fontFamily,
                fill: element.fill
            };
        }

        return null;
    }

    offsetDescriptor(descriptor, offsetX, offsetY) {
        const offsetDescriptor = {
            ...descriptor,
            position: descriptor.position
                ? { x: descriptor.position.x + offsetX, y: descriptor.position.y + offsetY }
                : descriptor.position
        };

        if (descriptor.type === 'line') {
            offsetDescriptor.x1 = descriptor.x1 + offsetX;
            offsetDescriptor.y1 = descriptor.y1 + offsetY;
            offsetDescriptor.x2 = descriptor.x2 + offsetX;
            offsetDescriptor.y2 = descriptor.y2 + offsetY;
        }

        return offsetDescriptor;
    }

    getElementBoundingBox(element) {
        const bbox = element.getBoundingBox();
        if (!bbox) return null;
        if (!element.rotation || element.rotation === 0 || (element.type !== 'rectangle' && element.type !== 'node')) {
            return bbox;
        }
        const centerX = element.position.x;
        const centerY = element.position.y;
        const rad = element.rotation * Math.PI / 180;
        const corners = [
            { x: bbox.x, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
            { x: bbox.x, y: bbox.y + bbox.height }
        ].map(point => rotatePoint(point.x, point.y, centerX, centerY, rad));
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        corners.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    getGroupLocalBoundingBox() {
        const center = this.groupRotationCenter;
        if (!center) return null;
        const invRad = -this.groupRotation * Math.PI / 180;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        this.selectedElements.forEach(element => {
            if (element.type === 'circle') {
                const localCenter = rotatePoint(element.position.x, element.position.y, center.x, center.y, invRad);
                const r = element.r * element.scale;
                minX = Math.min(minX, localCenter.x - r);
                minY = Math.min(minY, localCenter.y - r);
                maxX = Math.max(maxX, localCenter.x + r);
                maxY = Math.max(maxY, localCenter.y + r);
                return;
            }

            if (element.type === 'line') {
                const p1 = rotatePoint(element.x1, element.y1, center.x, center.y, invRad);
                const p2 = rotatePoint(element.x2, element.y2, center.x, center.y, invRad);
                minX = Math.min(minX, p1.x, p2.x);
                minY = Math.min(minY, p1.y, p2.y);
                maxX = Math.max(maxX, p1.x, p2.x);
                maxY = Math.max(maxY, p1.y, p2.y);
                return;
            }

            if (element.type === 'rectangle') {
                const halfW = (element.width * element.scale) / 2;
                const halfH = (element.height * element.scale) / 2;
                const rotationRad = (element.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rotationRad);
                const sin = Math.sin(rotationRad);
                const corners = [
                    { x: -halfW, y: -halfH },
                    { x: halfW, y: -halfH },
                    { x: halfW, y: halfH },
                    { x: -halfW, y: halfH }
                ];
                corners.forEach(offset => {
                    const worldX = element.position.x + offset.x * cos - offset.y * sin;
                    const worldY = element.position.y + offset.x * sin + offset.y * cos;
                    const local = rotatePoint(worldX, worldY, center.x, center.y, invRad);
                    minX = Math.min(minX, local.x);
                    minY = Math.min(minY, local.y);
                    maxX = Math.max(maxX, local.x);
                    maxY = Math.max(maxY, local.y);
                });
                return;
            }

            if (element.type === 'node') {
                const halfW = (element.width * element.scale) / 2;
                const halfH = (element.height * element.scale) / 2;
                const rotationRad = (element.rotation || 0) * Math.PI / 180;
                const cos = Math.cos(rotationRad);
                const sin = Math.sin(rotationRad);
                const corners = [
                    { x: -halfW, y: -halfH },
                    { x: halfW, y: -halfH },
                    { x: halfW, y: halfH },
                    { x: -halfW, y: halfH }
                ];
                corners.forEach(offset => {
                    const worldX = element.position.x + offset.x * cos - offset.y * sin;
                    const worldY = element.position.y + offset.x * sin + offset.y * cos;
                    const local = rotatePoint(worldX, worldY, center.x, center.y, invRad);
                    minX = Math.min(minX, local.x);
                    minY = Math.min(minY, local.y);
                    maxX = Math.max(maxX, local.x);
                    maxY = Math.max(maxY, local.y);
                });
                return;
            }

            const bbox = this.getElementBoundingBox(element);
            if (!bbox) return;
            const corners = [
                { x: bbox.x, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y },
                { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
                { x: bbox.x, y: bbox.y + bbox.height }
            ];
            corners.forEach(point => {
                const local = rotatePoint(point.x, point.y, center.x, center.y, invRad);
                minX = Math.min(minX, local.x);
                minY = Math.min(minY, local.y);
                maxX = Math.max(maxX, local.x);
                maxY = Math.max(maxY, local.y);
            });
        });

        if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
            return null;
        }
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    calculateBoundingBox() {
        if (this.selectedElements.length === 0) return null;
        if (this.selectedElements.length > 1 && this.groupRotation !== 0 && this.groupRotationCenter) {
            const rotatedBox = this.getGroupLocalBoundingBox();
            if (rotatedBox) return rotatedBox;
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        this.selectedElements.forEach(element => {
            const bbox = this.getElementBoundingBox(element);
            if (!bbox) return;
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + bbox.width);
            maxY = Math.max(maxY, bbox.y + bbox.height);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    updateHandles() {
        if (this.selectedElements.length > 1) {
            this.removeIndividualHandles();
            this.renderGroupHandles();
        } else if (this.selectedElements.length === 1) {
            this.removeGroupHandles();
            this.selectedElements[0].renderHandles();
        } else {
            this.removeIndividualHandles();
            this.removeGroupHandles();
            this.groupRotation = 0;
            this.groupRotationCenter = null;
        }
    }

    removeIndividualHandles() {
        this.selectedElements.forEach(element => element.removeHandles());
    }

    removeGroupHandles() {
        this.groupHandles.forEach(handle => handle.remove());
        this.groupHandles = [];
    }

    renderGroupHandles() {
        this.removeGroupHandles();
        const bbox = this.calculateBoundingBox();
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
        this.elements[0].container.appendChild(border);
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
            this.elements[0].container.appendChild(handle);
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
        this.elements[0].container.appendChild(rotateHandle);
        this.groupHandles.push(rotateHandle);

        if (this.groupRotation !== 0) {
            const center = this.groupRotationCenter || {
                x: bbox.x + bbox.width / 2,
                y: bbox.y + bbox.height / 2
            };
            this.groupHandles.forEach(handle => {
                handle.setAttribute('transform', `rotate(${this.groupRotation} ${center.x} ${center.y})`);
            });
        }
    }
}

export default ElementManager;
