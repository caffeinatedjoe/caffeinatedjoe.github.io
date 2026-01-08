import InteractiveElement from './InteractiveElement.js';

class TextElement extends InteractiveElement {
    constructor(id, x, y, text, container, options = {}) {
        super(id, 'text', { x, y }, container);
        this.text = text;
        this.baseFontSize = options.fontSize || 18;
        this.fontFamily = options.fontFamily || 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
        this.fill = options.fill || 'rgba(0, 0, 0, 0.8)';
        this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        this.svgElement.textContent = text;
        this.svgElement.setAttribute('x', x);
        this.svgElement.setAttribute('y', y);
        this.svgElement.setAttribute('fill', this.fill);
        this.svgElement.setAttribute('font-size', this.baseFontSize);
        this.svgElement.setAttribute('font-family', this.fontFamily);
    }

    render() {
        this.container.appendChild(this.svgElement);
    }

    getBoundingBox() {
        try {
            const bbox = this.svgElement.getBBox();
            return {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
            };
        } catch (err) {
            return null;
        }
    }

    updateSvgPosition() {
        this.svgElement.setAttribute('x', this.position.x);
        this.svgElement.setAttribute('y', this.position.y);
    }

    updateSvgScale() {
        const newSize = Math.max(1, this.baseFontSize * this.scale);
        this.svgElement.setAttribute('font-size', newSize);
        this.updateSvgPosition();
        if (this.rotation !== 0) {
            this.updateSvgRotation();
        }
    }

    updateSvgRotation() {
        this.svgElement.setAttribute('transform', `rotate(${this.rotation} ${this.position.x} ${this.position.y})`);
    }
}

export default TextElement;
