class RadialMenu {
    constructor(config = {}) {
        this.config = {
            innerDiameter: config.innerDiameter || 60,
            outerDiameter: config.outerDiameter || 160,
            sections: config.sections || [],
            container: config.container || document.body
        };
        this.menuElement = null;
        this.sectionPaths = new Map();
        this.activeSectionId = null;
        this.isOpen = false;
        this.closeHandler = null;
        this.init();
    }

    init() {
        this.createMenuElement();
        this.config.container.appendChild(this.menuElement);
        this.menuElement.style.display = 'none';
    }

    createMenuElement() {
        const svg = this.generateSVG();
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'radial-menu';
        this.menuElement.appendChild(svg);
    }

    generateSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const maxStrokeWidth = 3;
        const halfStroke = maxStrokeWidth / 2;
        const padding = maxStrokeWidth;
        const viewBoxMinX = -(padding + halfStroke);
        const viewBoxMaxX = this.config.outerDiameter + padding + halfStroke;
        const viewBoxMinY = viewBoxMinX;
        const viewBoxMaxY = viewBoxMaxX;
        const viewBoxWidth = viewBoxMaxX - viewBoxMinX;
        const viewBoxHeight = viewBoxWidth;
        const center = this.config.outerDiameter / 2;
        const innerRadius = this.config.innerDiameter / 2;
        const outerRadius = this.config.outerDiameter / 2;

        svg.setAttribute('width', viewBoxWidth);
        svg.setAttribute('height', viewBoxHeight);
        svg.setAttribute('viewBox', `${viewBoxMinX} ${viewBoxMinY} ${viewBoxWidth} ${viewBoxHeight}`);

        const numSections = this.config.sections.length;

        this.sectionPaths.clear();
        this.config.sections.forEach((section, index) => {
            const path = this.createSlicePath(center, innerRadius, outerRadius, section.id, index, numSections);
            path.setAttribute('data-section-id', section.id);
            path.addEventListener('click', () => this.handleSectionClick(section));

            const label = this.createLabel(center, innerRadius, outerRadius, section.icon, index, numSections);

            svg.appendChild(path);
            svg.appendChild(label);

            this.sectionPaths.set(section.id, path);
        });

        return svg;
    }

    createSlicePath(center, innerRadius, outerRadius, sectionId, index, total) {
        const anglePerSection = (2 * Math.PI) / total;
        const startAngle = -Math.PI / 2 + (index * anglePerSection);
        const endAngle = startAngle + anglePerSection;

        const x1 = center + outerRadius * Math.cos(startAngle);
        const y1 = center + outerRadius * Math.sin(startAngle);
        const x2 = center + outerRadius * Math.cos(endAngle);
        const y2 = center + outerRadius * Math.sin(endAngle);
        const x3 = center + innerRadius * Math.cos(endAngle);
        const y3 = center + innerRadius * Math.sin(endAngle);
        const x4 = center + innerRadius * Math.cos(startAngle);
        const y4 = center + innerRadius * Math.sin(startAngle);

        const largeArcFlag = anglePerSection > Math.PI ? 1 : 0;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`);
        path.setAttribute('fill', 'rgba(0,0,0,0.1)');
        path.setAttribute('stroke', 'rgba(0,0,0,1)');
        path.setAttribute('stroke-width', '1');
        path.style.cursor = 'pointer';

        path.addEventListener('mouseover', () => {
            this.applyHighlight(path);
        });
        path.addEventListener('mouseout', () => {
            if (this.activeSectionId !== sectionId) {
                this.resetHighlight(path);
            }
        });

        return path;
    }

    createLabel(center, innerRadius, outerRadius, iconConfig, index, total) {
        const anglePerSection = (2 * Math.PI) / total;
        const midAngle = -Math.PI / 2 + (index * anglePerSection) + (anglePerSection / 2);
        const labelRadius = 0.95 * (innerRadius + (outerRadius - innerRadius) / 2);

        const x = center + labelRadius * Math.cos(midAngle);
        const y = center + labelRadius * Math.sin(midAngle);

        const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        iconGroup.setAttribute('transform', `translate(${x}, ${y})`);

        const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        iconPath.setAttribute('d', iconConfig.path);
        iconPath.setAttribute('stroke', iconConfig.color || 'rgba(0,0,0,0.8)');
        iconPath.setAttribute('fill', 'none');
        iconPath.setAttribute('stroke-width', '2');
        iconPath.setAttribute('vector-effect', 'non-scaling-stroke');
        iconPath.setAttribute('pointer-events', 'none');

        const scale = (iconConfig.size || 14) / 24;
        iconPath.setAttribute('transform', `scale(${scale})`);

        iconGroup.appendChild(iconPath);

        return iconGroup;
    }

    handleSectionClick(section) {
        if (section.action) {
            section.action();
        }
        this.close();
    }

    getSectionForAngle(angleRadians) {
        const total = this.config.sections.length;
        if (!total) return null;
        const anglePerSection = (2 * Math.PI) / total;
        const startAngle = -Math.PI / 2;
        const normalized = (angleRadians - startAngle + (2 * Math.PI)) % (2 * Math.PI);
        const index = Math.min(total - 1, Math.floor(normalized / anglePerSection));
        return this.config.sections[index];
    }

    setActiveSection(sectionId) {
        if (this.activeSectionId === sectionId) return;
        if (this.activeSectionId && this.sectionPaths.has(this.activeSectionId)) {
            this.resetHighlight(this.sectionPaths.get(this.activeSectionId));
        }
        this.activeSectionId = sectionId;
        if (sectionId && this.sectionPaths.has(sectionId)) {
            this.applyHighlight(this.sectionPaths.get(sectionId));
        }
    }

    clearActiveSection() {
        this.setActiveSection(null);
    }

    triggerSectionById(sectionId) {
        const section = this.config.sections.find((entry) => entry.id === sectionId);
        if (section) {
            this.handleSectionClick(section);
        } else {
            this.close();
        }
    }

    openAt(x, y) {
        if (this.isOpen) return;

        const maxStrokeWidth = 3;
        const halfStroke = maxStrokeWidth / 2;
        const padding = maxStrokeWidth;
        const viewBoxMinX = -(padding + halfStroke);
        const viewBoxMaxX = this.config.outerDiameter + padding + halfStroke;
        const viewBoxWidth = viewBoxMaxX - viewBoxMinX;
        const menuSize = viewBoxWidth;
        let left = x - (menuSize / 2);
        let top = y - (menuSize / 2);

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (left < 10) left = 10;
        if (top < 10) top = 10;
        if (left + menuSize > viewportWidth - 10) left = viewportWidth - menuSize - 10;
        if (top + menuSize > viewportHeight - 10) top = viewportHeight - menuSize - 10;

        this.menuElement.style.left = `${left}px`;
        this.menuElement.style.top = `${top}px`;
        this.menuElement.style.width = `${menuSize}px`;
        this.menuElement.style.height = `${menuSize}px`;
        this.menuElement.style.display = 'block';
        this.isOpen = true;

        setTimeout(() => {
            document.addEventListener('click', this.closeHandler = () => this.close());
        }, 0);
    }

    close() {
        if (!this.isOpen) return;

        this.menuElement.style.display = 'none';
        this.isOpen = false;
        this.clearActiveSection();

        if (this.closeHandler) {
            document.removeEventListener('click', this.closeHandler);
            this.closeHandler = null;
        }
    }

    getCenter() {
        if (!this.menuElement) return null;
        const rect = this.menuElement.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    getInnerRadius() {
        return this.config.innerDiameter / 2;
    }

    getContainer() {
        return this.config.container;
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        const newSvg = this.generateSVG();
        this.menuElement.replaceChild(newSvg, this.menuElement.querySelector('svg'));
    }

    setSections(sections) {
        this.updateConfig({ sections });
    }

    destroy() {
        this.close();
        if (this.menuElement && this.menuElement.parentNode) {
            this.menuElement.parentNode.removeChild(this.menuElement);
        }
    }

    applyHighlight(path) {
        path.setAttribute('fill', 'rgba(160, 160, 160, 0.1)');
        path.setAttribute('stroke-width', '2');
    }

    resetHighlight(path) {
        path.setAttribute('fill', 'rgba(0,0,0,0.1)');
        path.setAttribute('stroke-width', '1');
    }
}

export default RadialMenu;
