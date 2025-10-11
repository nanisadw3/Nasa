class ElectricBorder {
    constructor(containerId, options = {}) {
        this.rootRef = document.getElementById(containerId);
        if (!this.rootRef) {
            console.error(`ElectricBorder: Container with id #${containerId} not found.`);
            return;
        }

        this.options = {
            color: '#5227FF',
            speed: 1,
            chaos: 1,
            thickness: 2,
            ...options,
        };

        this.rawId = 'eb' + Math.random().toString(36).substr(2, 9);
        this.filterId = `turbulent-displace-${this.rawId}`;

        this.init();
    }

    init() {
        // Wrap existing content
        const existingContent = [...this.rootRef.childNodes];
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'eb-content';
        existingContent.forEach(node => contentWrapper.appendChild(node));

        // Clear root and build new structure
        this.rootRef.innerHTML = '';
        this.rootRef.className = `electric-border ${this.rootRef.className}`.trim();
        this.rootRef.style.setProperty('--electric-border-color', this.options.color);
        this.rootRef.style.setProperty('--eb-border-width', `${this.options.thickness}px`);

        this.rootRef.appendChild(this.createSVG());
        this.rootRef.appendChild(this.createLayers());
        this.rootRef.appendChild(contentWrapper);

        this.strokeRef = this.rootRef.querySelector('.eb-stroke');

        // Initial animation setup
        this.updateAnim();

        // Attach resize observer
        const ro = new ResizeObserver(() => this.updateAnim());
        ro.observe(this.rootRef);
        this.resizeObserver = ro;
    }

    createSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'eb-svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        
        svg.innerHTML = `
            <defs>
                <filter id="${this.filterId}" color-interpolation-filters="sRGB" x="-200%" y="-200%" width="500%" height="500%">
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise1" seed="1" />
                    <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
                        <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise2" seed="1" />
                    <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
                        <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise1" seed="2" />
                    <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
                        <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" result="noise2" seed="2" />
                    <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
                        <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
                    </feOffset>
                    <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
                    <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
                    <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
                    <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B" />
                </filter>
            </defs>`;
        this.svgRef = svg;
        return svg;
    }

    createLayers() {
        const layers = document.createElement('div');
        layers.className = 'eb-layers';
        layers.innerHTML = `
            <div class="eb-stroke"></div>
            <div class="eb-glow-1"></div>
            <div class="eb-glow-2"></div>
            <div class="eb-background-glow"></div>`;
        return layers;
    }

    updateAnim() {
        if (!this.svgRef || !this.rootRef) return;

        if (this.strokeRef) {
            this.strokeRef.style.filter = `url(#${this.filterId})`;
        }

        const width = Math.max(1, Math.round(this.rootRef.clientWidth));
        const height = Math.max(1, Math.round(this.rootRef.clientHeight));

        const dyAnims = Array.from(this.svgRef.querySelectorAll('feOffset > animate[attributeName="dy"]'));
        if (dyAnims.length >= 2) {
            dyAnims[0].setAttribute('values', `${height}; 0`);
            dyAnims[1].setAttribute('values', `0; -${height}`);
        }

        const dxAnims = Array.from(this.svgRef.querySelectorAll('feOffset > animate[attributeName="dx"]'));
        if (dxAnims.length >= 2) {
            dxAnims[0].setAttribute('values', `${width}; 0`);
            dxAnims[1].setAttribute('values', `0; -${width}`);
        }

        const baseDur = 6;
        const dur = Math.max(0.001, baseDur / (this.options.speed || 1));
        [...dyAnims, ...dxAnims].forEach(a => a.setAttribute('dur', `${dur}s`));

        const disp = this.svgRef.querySelector('feDisplacementMap');
        if (disp) disp.setAttribute('scale', String(30 * (this.options.chaos || 1)));

        requestAnimationFrame(() => {
            [...dyAnims, ...dxAnims].forEach(a => {
                if (typeof a.beginElement === 'function') {
                    try { a.beginElement(); } catch {}
                }
            });
        });
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
    }
}
