import InteractiveElement from './InteractiveElement.js';
import { rotatePoint } from '../core/geometry.js';

class NodeElement extends InteractiveElement {
    constructor(id, x, y, width, height, container, options = {}) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        super(id, 'node', { x: centerX, y: centerY }, container);
        this.width = width;
        this.height = height;
        this.inputCount = options.inputCount ?? 1;
        this.outputCount = options.outputCount ?? 1;
        this.cornerRadius = options.cornerRadius ?? 12;
        this.connectorRadius = options.connectorRadius ?? 5;
        this.addButtonRadius = options.addButtonRadius ?? 7;
        this.addButtonOffset = options.addButtonOffset ?? 12;
        this.hoverPadExtra = options.hoverPadExtra ?? (this.addButtonOffset + this.addButtonRadius + 4);
        this.connections = [];
        this.onChange = typeof options.onChange === 'function' ? options.onChange : null;

        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgElement.setAttribute('data-element-id', this.id);
        this.svgElement.classList.add('node');

        this.hoverPad = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.hoverPad.classList.add('node-hover-pad');
        this.svgElement.appendChild(this.hoverPad);

        this.rectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.rectElement.classList.add('node-rect');
        this.rectElement.setAttribute('fill', 'rgba(236, 240, 241, 0.95)');
        this.rectElement.setAttribute('stroke', '#2c3e50');
        this.rectElement.setAttribute('stroke-width', 1.5);
        this.rectElement.setAttribute('rx', this.cornerRadius);
        this.rectElement.setAttribute('ry', this.cornerRadius);
        this.svgElement.appendChild(this.rectElement);

        this.textContainer = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        this.textContainer.classList.add('node-text-container');
        this.textInput = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
        this.textInput.type = 'text';
        this.textInput.classList.add('node-text-input');
        this.textInput.value = options.textValue ?? '';
        this.textInput.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        this.textInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        this.textInput.addEventListener('input', () => {
            this.notifyChange();
        });
        this.textContainer.appendChild(this.textInput);
        this.svgElement.appendChild(this.textContainer);

        this.inputConnectors = this.createConnectors('input', this.inputCount);
        this.outputConnectors = this.createConnectors('output', this.outputCount);
        this.inputAddButton = this.createAddButton('input');
        this.outputAddButton = this.createAddButton('output');
    }

    createConnector(type, index, beforeNode = null) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.classList.add('node-connector', `node-connector-${type}`);
        circle.setAttribute('r', this.connectorRadius);
        circle.setAttribute('fill', '#ffffff');
        circle.setAttribute('stroke', '#2c3e50');
        circle.setAttribute('stroke-width', 1.2);
        circle.dataset.connectorType = type;
        circle.dataset.connectorIndex = String(index);
        circle.dataset.nodeId = this.id;
        if (beforeNode && beforeNode.parentNode === this.svgElement) {
            this.svgElement.insertBefore(circle, beforeNode);
        } else {
            this.svgElement.appendChild(circle);
        }
        return circle;
    }

    createConnectors(type, count) {
        const connectors = [];
        for (let i = 0; i < count; i += 1) {
            connectors.push(this.createConnector(type, i));
        }
        return connectors;
    }

    createAddButton(type) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('node-add', `node-add-${type}`);
        group.dataset.addType = type;

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', this.addButtonRadius);
        circle.classList.add('node-add-circle');
        group.appendChild(circle);

        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', -4);
        hLine.setAttribute('y1', 0);
        hLine.setAttribute('x2', 4);
        hLine.setAttribute('y2', 0);
        hLine.classList.add('node-add-line');
        group.appendChild(hLine);

        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', 0);
        vLine.setAttribute('y1', -4);
        vLine.setAttribute('x2', 0);
        vLine.setAttribute('y2', 4);
        vLine.classList.add('node-add-line');
        group.appendChild(vLine);

        group.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        group.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.addConnector(type);
            this.notifyChange();
        });

        this.svgElement.appendChild(group);
        return group;
    }

    addConnector(type) {
        const index = type === 'input' ? this.inputCount : this.outputCount;
        if (type === 'input') {
            this.inputCount += 1;
        } else {
            this.outputCount += 1;
        }
        const beforeNode = this.inputAddButton || null;
        const connector = this.createConnector(type, index, beforeNode);
        if (type === 'input') {
            this.inputConnectors.push(connector);
        } else {
            this.outputConnectors.push(connector);
        }
        this.updateConnectorPositions();
        this.updateConnections();
    }

    getConnectorElement(type, index) {
        const list = type === 'input' ? this.inputConnectors : this.outputConnectors;
        return list[index] || null;
    }

    removeConnector(type, index) {
        const list = type === 'input' ? this.inputConnectors : this.outputConnectors;
        if (!list[index]) return [];

        const removedConnections = [];
        this.connections.slice().forEach(connection => {
            if (type === 'input' && connection.toNode === this) {
                if (connection.toIndex === index) {
                    removedConnections.push(connection);
                } else if (connection.toIndex > index) {
                    connection.toIndex -= 1;
                }
            }
            if (type === 'output' && connection.fromNode === this) {
                if (connection.fromIndex === index) {
                    removedConnections.push(connection);
                } else if (connection.fromIndex > index) {
                    connection.fromIndex -= 1;
                }
            }
        });

        const removed = list.splice(index, 1)[0];
        if (removed) {
            removed.remove();
        }

        if (type === 'input') {
            this.inputCount = Math.max(0, this.inputCount - 1);
        } else {
            this.outputCount = Math.max(0, this.outputCount - 1);
        }

        list.forEach((connector, idx) => {
            connector.dataset.connectorIndex = String(idx);
        });

        this.updateConnectorPositions();
        this.updateConnections();
        return removedConnections;
    }

    render() {
        this.container.appendChild(this.svgElement);
        this.updateSvgPosition();
        this.updateSvgRotation();
    }

    registerConnection(connection) {
        this.connections.push(connection);
    }

    unregisterConnection(connection) {
        const index = this.connections.indexOf(connection);
        if (index > -1) {
            this.connections.splice(index, 1);
        }
    }

    updateConnections() {
        this.connections.forEach(connection => connection.update());
    }

    notifyChange() {
        if (this.onChange) {
            this.onChange();
            return;
        }
        document.dispatchEvent(new CustomEvent('nodeflow:changed'));
    }

    getBoundingBox() {
        return {
            x: this.position.x - (this.width * this.scale) / 2,
            y: this.position.y - (this.height * this.scale) / 2,
            width: this.width * this.scale,
            height: this.height * this.scale
        };
    }

    getConnectorWorldPosition(type, index) {
        const positions = this.getConnectorBasePositions();
        const list = type === 'input' ? positions.inputs : positions.outputs;
        const base = list[index];
        if (!base) return { x: this.position.x, y: this.position.y };
        if (!this.rotation) {
            return { x: base.x, y: base.y };
        }
        const rad = this.rotation * Math.PI / 180;
        return rotatePoint(base.x, base.y, this.position.x, this.position.y, rad);
    }

    getConnectorNormalWorld(type) {
        const normal = type === 'input' ? { x: -1, y: 0 } : { x: 1, y: 0 };
        if (!this.rotation) {
            return normal;
        }
        const rad = this.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return {
            x: normal.x * cos - normal.y * sin,
            y: normal.x * sin + normal.y * cos
        };
    }

    getConnectorBasePositions() {
        const halfW = (this.width * this.scale) / 2;
        const halfH = (this.height * this.scale) / 2;
        const leftX = this.position.x - halfW;
        const rightX = this.position.x + halfW;

        const inputs = [];
        const outputs = [];
        const inputGap = this.height * this.scale / (this.inputCount + 1);
        const outputGap = this.height * this.scale / (this.outputCount + 1);

        for (let i = 0; i < this.inputCount; i += 1) {
            inputs.push({
                x: leftX,
                y: this.position.y - halfH + inputGap * (i + 1)
            });
        }
        for (let i = 0; i < this.outputCount; i += 1) {
            outputs.push({
                x: rightX,
                y: this.position.y - halfH + outputGap * (i + 1)
            });
        }
        return { inputs, outputs };
    }

    updateConnectorPositions() {
        const positions = this.getConnectorBasePositions();
        this.inputConnectors.forEach((connector, index) => {
            const pos = positions.inputs[index];
            connector.setAttribute('cx', pos.x);
            connector.setAttribute('cy', pos.y);
        });
        this.outputConnectors.forEach((connector, index) => {
            const pos = positions.outputs[index];
            connector.setAttribute('cx', pos.x);
            connector.setAttribute('cy', pos.y);
        });
    }

    updateAddButtonPositions() {
        const halfW = (this.width * this.scale) / 2;
        const halfH = (this.height * this.scale) / 2;
        const offset = this.addButtonOffset * this.scale;
        const y = this.position.y + halfH + offset;
        const leftX = this.position.x - halfW + offset;
        const rightX = this.position.x + halfW - offset;
        if (this.inputAddButton) {
            this.inputAddButton.setAttribute('transform', `translate(${leftX} ${y})`);
        }
        if (this.outputAddButton) {
            this.outputAddButton.setAttribute('transform', `translate(${rightX} ${y})`);
        }
    }

    updateHoverPad() {
        if (!this.hoverPad) return;
        const bbox = this.getBoundingBox();
        const extra = this.hoverPadExtra * this.scale;
        this.hoverPad.setAttribute('x', bbox.x);
        this.hoverPad.setAttribute('y', bbox.y);
        this.hoverPad.setAttribute('width', bbox.width);
        this.hoverPad.setAttribute('height', bbox.height + extra);
    }

    updateSvgPosition() {
        const bbox = this.getBoundingBox();
        this.rectElement.setAttribute('x', bbox.x);
        this.rectElement.setAttribute('y', bbox.y);
        this.rectElement.setAttribute('width', bbox.width);
        this.rectElement.setAttribute('height', bbox.height);
        this.updateHoverPad();
        const padding = 8 * this.scale;
        const textWidth = Math.max(0, bbox.width - padding * 2);
        const textHeight = Math.max(0, bbox.height - padding * 2);
        this.textContainer.setAttribute('x', bbox.x + padding);
        this.textContainer.setAttribute('y', bbox.y + padding);
        this.textContainer.setAttribute('width', textWidth);
        this.textContainer.setAttribute('height', textHeight);
        this.updateConnectorPositions();
        this.updateAddButtonPositions();
        this.updateConnections();
    }

    updateSvgScale(origin) {
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
        this.updateSvgRotation();
    }

    updateSvgRotation() {
        const bbox = this.getBoundingBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        if (this.rotation) {
            this.svgElement.setAttribute('transform', `rotate(${this.rotation} ${centerX} ${centerY})`);
        } else {
            this.svgElement.removeAttribute('transform');
        }
        this.updateConnections();
    }

    delete() {
        const connections = this.connections.slice();
        connections.forEach(connection => connection.destroy());
        super.delete();
    }

    getTextValue() {
        return this.textInput ? this.textInput.value : '';
    }

    setTextValue(value) {
        if (this.textInput) {
            this.textInput.value = value ?? '';
        }
    }
}

export default NodeElement;
