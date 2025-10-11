class BlurText {
    constructor(element, {
        text,
        delay = 150,
        animateBy = 'words',
        direction = 'top',
    } = {}) {
        this.element = element;
        this.text = text || element.textContent;
        this.delay = delay;
        this.animateBy = animateBy;
        this.direction = direction;

        this.init();
    }

    init() {
        this.element.style.display = 'flex';
        this.element.style.flexWrap = 'wrap';
        this.element.style.justifyContent = 'center';
        this.element.style.opacity = 0; // Hide original text

        const segments = this.animateBy === 'words' ? this.text.split(' ') : this.text.split('');

        const fragment = document.createDocumentFragment();
        this.spans = segments.map(segment => {
            const span = document.createElement('span');
            span.className = 'blur-text-segment';
            span.style.display = 'inline-block';
            span.style.willChange = 'transform, filter, opacity';
            span.textContent = segment === ' ' ? '\u00A0' : segment;
            if (this.animateBy === 'words') {
                span.style.marginRight = '0.5em'; // Add space between words
            }
            fragment.appendChild(span);
            return span;
        });

        this.element.innerHTML = ''; // Clear original content
        this.element.appendChild(fragment);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.animate();
                observer.unobserve(this.element);
            }
        }, { threshold: 0.1 });

        observer.observe(this.element);
    }

    animate() {
        this.element.style.opacity = 1;
        const y = this.direction === 'top' ? -50 : 50;

        gsap.fromTo(this.spans, {
            filter: 'blur(10px)',
            opacity: 0,
            y: y
        }, {
            filter: 'blur(0px)',
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: this.delay / 1000,
            ease: 'power3.out',
        });
    }
}