function getOppositeCorner(corner, bbox) {
    switch (corner) {
        case 'top-left': return { x: bbox.x + bbox.width, y: bbox.y + bbox.height };
        case 'top-right': return { x: bbox.x, y: bbox.y + bbox.height };
        case 'bottom-right': return { x: bbox.x, y: bbox.y };
        case 'bottom-left': return { x: bbox.x + bbox.width, y: bbox.y };
        case 'top': return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height };
        case 'right': return { x: bbox.x, y: bbox.y + bbox.height / 2 };
        case 'bottom': return { x: bbox.x + bbox.width / 2, y: bbox.y };
        case 'left': return { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 };
        default: return { x: bbox.x, y: bbox.y };
    }
}

function getOppositeCornerName(corner) {
    switch (corner) {
        case 'top-left': return 'bottom-right';
        case 'top-right': return 'bottom-left';
        case 'bottom-right': return 'top-left';
        case 'bottom-left': return 'top-right';
        case 'top': return 'bottom';
        case 'right': return 'left';
        case 'bottom': return 'top';
        case 'left': return 'right';
        default: return corner;
    }
}

function getCornerPositions(bbox) {
    return {
        'top-left': { x: bbox.x, y: bbox.y },
        'top-right': { x: bbox.x + bbox.width, y: bbox.y },
        'bottom-right': { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
        'bottom-left': { x: bbox.x, y: bbox.y + bbox.height },
        top: { x: bbox.x + bbox.width / 2, y: bbox.y },
        right: { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2 },
        bottom: { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height },
        left: { x: bbox.x, y: bbox.y + bbox.height / 2 }
    };
}

function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function rotatePoint(px, py, cx, cy, angleRad) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = px - cx;
    const dy = py - cy;
    return {
        x: cx + dx * cos - dy * sin,
        y: cy + dx * sin + dy * cos
    };
}

export {
    distance,
    getCornerPositions,
    getOppositeCorner,
    getOppositeCornerName,
    rotatePoint
};
