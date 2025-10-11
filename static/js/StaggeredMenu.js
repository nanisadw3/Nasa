class StaggeredMenu {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container with id #${containerId} not found.`);
            return;
        }

        this.options = {
            position: 'right',
            colors: ['#B19EEF', '#5227FF'],
            items: [],
            socialItems: [],
            displaySocials: true,
            displayItemNumbering: true,
            logoUrl: '',
            menuButtonColor: '#fff',
            openMenuButtonColor: '#fff',
            accentColor: '#5227FF',
            changeMenuColorOnOpen: true,
            isFixed: true,
            ...options,
        };

        this.open = false;
        this.busy = false;
        this.textLines = ['Menu', 'Close'];

        this.render();
        this.init();
    }

    render() {
        const { 
            position, items, socialItems, displaySocials, displayItemNumbering, 
            logoUrl, accentColor, isFixed 
        } = this.options;

        const prelayersHTML = this.options.colors.slice(0, 4).map(c => 
            `<div class="sm-prelayer" style="background: ${c}"></div>`
        ).join('');

        const menuItemsHTML = items.length ? items.map((it, idx) => `
            <li class="sm-panel-itemWrap">
                <a class="sm-panel-item" href="${it.link}" aria-label="${it.ariaLabel}" data-index="${idx + 1}">
                    <span class="sm-panel-itemLabel">${it.label}</span>
                </a>
            </li>`).join('') : '<li class="sm-panel-itemWrap" aria-hidden="true"><span class="sm-panel-item"><span class="sm-panel-itemLabel">No items</span></span></li>';

        const socialItemsHTML = displaySocials && socialItems.length ? `
            <div class="sm-socials" aria-label="Social links">
                <h3 class="sm-socials-title">Socials</h3>
                <ul class="sm-socials-list" role="list">
                    ${socialItems.map(s => `
                    <li class="sm-socials-item">
                        <a href="${s.link}" target="_blank" rel="noopener noreferrer" class="sm-socials-link">${s.label}</a>
                    </li>`).join('')}
                </ul>
            </div>` : '';

        const html = `
        <div class="staggered-menu-wrapper ${isFixed ? 'fixed-wrapper' : ''}" style="--sm-accent: ${accentColor};" data-position="${position}">
            <div class="sm-prelayers" aria-hidden="true">${prelayersHTML}</div>
            <header class="staggered-menu-header" aria-label="Main navigation header">
                ${logoUrl ? `<div class="sm-logo" aria-label="Logo"><img src="${logoUrl}" alt="Logo" class="sm-logo-img" draggable="false" width="110" height="24"/></div>` : '<div></div>'}
                <button class="sm-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="staggered-menu-panel" type="button">
                    <span class="sm-toggle-textWrap" aria-hidden="true">
                        <span class="sm-toggle-textInner">
                            ${this.textLines.map(l => `<span class="sm-toggle-line">${l}</span>`).join('')}
                        </span>
                    </span>
                    <span class="sm-icon" aria-hidden="true">
                        <span class="sm-icon-line"></span>
                        <span class="sm-icon-line sm-icon-line-v"></span>
                    </span>
                </button>
            </header>
            <aside id="staggered-menu-panel" class="staggered-menu-panel" aria-hidden="true">
                <div class="sm-panel-inner">
                    <ul class="sm-panel-list" role="list" ${displayItemNumbering ? 'data-numbering' : ''}>${menuItemsHTML}</ul>
                    ${socialItemsHTML}
                </div>
            </aside>
        </div>`;

        this.container.innerHTML = html;
    }

    init() {
        this.wrapper = this.container.querySelector('.staggered-menu-wrapper');
        this.panelRef = this.container.querySelector('.staggered-menu-panel');
        this.preLayersRef = this.container.querySelector('.sm-prelayers');
        this.preLayerElsRef = Array.from(this.container.querySelectorAll('.sm-prelayer'));
        this.plusHRef = this.container.querySelector('.sm-icon-line:not(.sm-icon-line-v)');
        this.plusVRef = this.container.querySelector('.sm-icon-line-v');
        this.iconRef = this.container.querySelector('.sm-icon');
        this.textInnerRef = this.container.querySelector('.sm-toggle-textInner');
        this.toggleBtnRef = this.container.querySelector('.sm-toggle');

        this.initGSAP();
        this.attachEventListeners();
    }

    initGSAP() {
        const offscreen = this.options.position === 'left' ? -100 : 100;
        gsap.set([this.panelRef, ...this.preLayerElsRef], { xPercent: offscreen });
        gsap.set(this.plusHRef, { transformOrigin: '50% 50%', rotate: 0 });
        gsap.set(this.plusVRef, { transformOrigin: '50% 50%', rotate: 90 });
        gsap.set(this.iconRef, { rotate: 0, transformOrigin: '50% 50%' });
        gsap.set(this.textInnerRef, { yPercent: 0 });
        gsap.set(this.toggleBtnRef, { color: this.options.menuButtonColor });
    }

    attachEventListeners() {
        this.toggleBtnRef.addEventListener('click', () => this.toggleMenu());
    }

    toggleMenu() {
        this.open = !this.open;
        this.wrapper.dataset.open = this.open ? 'true' : '';
        this.toggleBtnRef.setAttribute('aria-expanded', this.open);
        this.panelRef.setAttribute('aria-hidden', !this.open);

        if (this.open) {
            this.options.onMenuOpen?.();
            this.playOpen();
        } else {
            this.options.onMenuClose?.();
            this.playClose();
        }
        this.animateIcon(this.open);
        this.animateColor(this.open);
        this.animateText(this.open);
    }

    playOpen() {
        if (this.busy) return;
        this.busy = true;

        const tl = this.buildOpenTimeline();
        if (tl) {
            tl.eventCallback('onComplete', () => { this.busy = false; });
            tl.play(0);
        } else {
            this.busy = false;
        }
    }

    buildOpenTimeline() {
        if (this.openTl) this.openTl.kill();
        if (this.closeTween) this.closeTween.kill();

        const itemEls = Array.from(this.panelRef.querySelectorAll('.sm-panel-itemLabel'));
        const numberEls = Array.from(this.panelRef.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        const socialTitle = this.panelRef.querySelector('.sm-socials-title');
        const socialLinks = Array.from(this.panelRef.querySelectorAll('.sm-socials-link'));

        const layerStates = this.preLayerElsRef.map(el => ({ el, start: Number(gsap.getProperty(el, 'xPercent')) }));
        const panelStart = Number(gsap.getProperty(this.panelRef, 'xPercent'));

        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        if (numberEls.length) gsap.set(numberEls, { '--sm-num-opacity': 0 });
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        const tl = gsap.timeline();
        this.openTl = tl;

        layerStates.forEach((ls, i) => {
            tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
        });

        const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
        const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
        const panelDuration = 0.65;
        tl.fromTo(this.panelRef, { xPercent: panelStart }, { xPercent: 0, duration: panelDuration, ease: 'power4.out' }, panelInsertTime);

        if (itemEls.length) {
            const itemsStart = panelInsertTime + panelDuration * 0.15;
            tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } }, itemsStart);
            if (numberEls.length) {
                tl.to(numberEls, { duration: 0.6, ease: 'power2.out', '--sm-num-opacity': 1, stagger: { each: 0.08, from: 'start' } }, itemsStart + 0.1);
            }
        }

        if (socialTitle || socialLinks.length) {
            const socialsStart = panelInsertTime + panelDuration * 0.4;
            if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
            if (socialLinks.length) {
                tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08, from: 'start' }, onComplete: () => gsap.set(socialLinks, { clearProps: 'opacity' }) }, socialsStart + 0.04);
            }
        }
        return tl;
    }

    playClose() {
        if (this.openTl) this.openTl.kill();
        if (this.itemEntranceTween) this.itemEntranceTween.kill();
        if (this.closeTween) this.closeTween.kill();

        const offscreen = this.options.position === 'left' ? -100 : 100;
        this.closeTween = gsap.to([this.panelRef, ...this.preLayerElsRef], {
            xPercent: offscreen,
            duration: 0.32,
            ease: 'power3.in',
            overwrite: 'auto',
            onComplete: () => { this.busy = false; }
        });
    }

    animateIcon(opening) {
        if (this.spinTween) this.spinTween.kill();
        if (opening) {
            this.spinTween = gsap.to(this.iconRef, { rotate: 225, duration: 0.8, ease: 'power4.out', overwrite: 'auto' });
        } else {
            this.spinTween = gsap.to(this.iconRef, { rotate: 0, duration: 0.35, ease: 'power3.inOut', overwrite: 'auto' });
        }
    }

    animateColor(opening) {
        if (this.colorTween) this.colorTween.kill();
        if (this.options.changeMenuColorOnOpen) {
            const targetColor = opening ? this.options.openMenuButtonColor : this.options.menuButtonColor;
            this.colorTween = gsap.to(this.toggleBtnRef, { color: targetColor, delay: 0.18, duration: 0.3, ease: 'power2.out' });
        } else {
            gsap.set(this.toggleBtnRef, { color: this.options.menuButtonColor });
        }
    }

    animateText(opening) {
        if (this.textCycleAnim) this.textCycleAnim.kill();

        const targetLabel = opening ? 'Close' : 'Menu';

        // Set initial opacity to 1 to ensure it's visible before fading
        gsap.set(this.textInnerRef, { opacity: 1 });

        this.textCycleAnim = gsap.to(this.textInnerRef, { 
            opacity: 0, 
            duration: 0.2, 
            ease: 'power2.in',
            onComplete: () => {
                this.textInnerRef.innerHTML = `<span class="sm-toggle-line">${targetLabel}</span>`;
                gsap.to(this.textInnerRef, {
                    opacity: 1,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            }
        });
    }
}
