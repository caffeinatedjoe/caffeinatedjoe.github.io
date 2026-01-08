class ClipboardService {
    constructor({ elementRegistry, selectionService, onChange }) {
        this.elementRegistry = elementRegistry;
        this.selectionService = selectionService;
        this.onChange = onChange;
        this.clipboard = [];
        this.clipboardPasteIndex = 0;
    }

    copySelection() {
        const selected = this.selectionService.getSelected();
        if (selected.length === 0) {
            this.clipboard = [];
            this.clipboardPasteIndex = 0;
            return;
        }
        this.clipboard = selected
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
            this.elementRegistry.add(newElement);
            pastedElements.push(newElement);
        });

        if (pastedElements.length > 0) {
            this.selectionService.setSelection(pastedElements);
            if (this.onChange) {
                this.onChange();
            }
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

        if (descriptor.type === 'rectangle' || descriptor.type === 'node') {
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
}

export default ClipboardService;
