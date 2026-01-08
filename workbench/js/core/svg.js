const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, String(v));
    }
    return el;
}

export { SVG_NS, createSvgEl };
