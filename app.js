// app.js — separated from index.html for maintainability
// Implements Carousel with accessibility improvements, focus trap for modal,
// IntersectionObserver to start autoplay only when visible, and respects prefers-reduced-motion.

const slides = [
  {
    title: "🍰 Local Bakery Landing",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    description: "A stunning brochure site for artisan bakeries with integrated ordering system, beautiful product showcase, and mobile-first design.",
    tags: ["E-commerce", "Lead Capture", "Mobile-First"]
  },
  {
    title: "🎨 Artist & Creative Portfolio",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80",
    description: "Image-optimized portfolio showcasing visual work with fast load times, SEO optimization for discoverability, and smooth transitions.",
    tags: ["Portfolio", "Image Gallery", "SEO Optimized"]
  },
  {
    title: "🚀 Startup MVP Landing Page",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
    description: "High-converting lead capture landing page with email integration, analytics tracking, and conversion optimization.",
    tags: ["Lead Generation", "Analytics", "Conversion Optimized"]
  }
];

class Carousel {
  constructor(opts = {}) {
    this.wrapper = document.getElementById('carouselWrapper');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.dotsContainer = document.getElementById('dotsContainer');
    this.currentIndex = 0;
    this.autoPlayInterval = null;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.renderSlides();
    this.createDots();
    this.attachEventListeners();
    this.updateCarousel();
  }

  renderSlides() {
    this.wrapper.innerHTML = '';
    slides.forEach((slide, i) => {
      const slideEl = document.createElement('div');
      slideEl.className = 'carousel-slide';
      slideEl.setAttribute('role', 'group');
      slideEl.setAttribute('aria-roledescription', 'slide');
      slideEl.setAttribute('aria-label', `${i + 1} of ${slides.length} — ${slide.title}`);
      slideEl.setAttribute('aria-hidden', 'true');

      // Use responsive images
      slideEl.innerHTML = `
        <div class="slide-image">
          <img src="${slide.image}" loading="lazy" alt="${slide.title} — screenshot"
               srcset="${slide.image.replace('&w=800','&w=400')} 400w, ${slide.image} 800w"
               sizes="(max-width:600px) 320px, 480px">
        </div>
        <div class="slide-content">
          <h3>${slide.title}</h3>
          <p>${slide.description}</p>
          <div class="slide-tags">
            ${slide.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
      this.wrapper.appendChild(slideEl);
    });
    this.slides = this.wrapper.querySelectorAll('.carousel-slide');
  }

  createDots() {
    this.dotsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `dot ${index === 0 ? 'active' : ''}`;
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      dot.setAttribute('aria-controls', 'carouselWrapper');
      dot.addEventListener('click', () => { this.goToSlide(index); this.resetAutoPlay(); });
      this.dotsContainer.appendChild(dot);
    });
    this.dots = this.dotsContainer.querySelectorAll('.dot');
  }

  attachEventListeners() {
    this.prevBtn.addEventListener('click', () => { this.prevSlide(); this.resetAutoPlay(); });
    this.nextBtn.addEventListener('click', () => { this.nextSlide(); this.resetAutoPlay(); });

    // Keyboard support on wrapper (focusable)
    this.wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); this.nextSlide(); this.resetAutoPlay(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.prevSlide(); this.resetAutoPlay(); }
      if (e.key === 'Home') { e.preventDefault(); this.goToSlide(0); this.resetAutoPlay(); }
      if (e.key === 'End') { e.preventDefault(); this.goToSlide(slides.length - 1); this.resetAutoPlay(); }
    });

    // Announce slide changes for screen readers
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);
  }

  nextSlide() { this.currentIndex = (this.currentIndex + 1) % slides.length; this.updateCarousel(); }
  prevSlide() { this.currentIndex = (this.currentIndex - 1 + slides.length) % slides.length; this.updateCarousel(); }
  goToSlide(index) { this.currentIndex = index; this.updateCarousel(); }

  updateCarousel() {
    this.slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev', 'next');
      slide.setAttribute('aria-hidden', 'true');
      if (index === this.currentIndex) {
        slide.classList.add('active');
        slide.setAttribute('aria-hidden', 'false');
      } else if (index < this.currentIndex) {
        slide.classList.add('prev');
      } else {
        slide.classList.add('next');
      }
    });

    this.dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
      dot.setAttribute('aria-selected', index === this.currentIndex ? 'true' : 'false');
    });

    // Update live region for screen readers (brief)
    if (this.liveRegion) {
      const title = slides[this.currentIndex].title;
      this.liveRegion.textContent = `Slide ${this.currentIndex + 1}: ${title}`;
    }
  }

  startAutoPlay() {
    if (this.isReducedMotion) return; // do not autoplay for reduced motion
    if (this.autoPlayInterval) return;
    this.autoPlayInterval = setInterval(() => this.nextSlide(), 6000);
  }

  stopAutoPlay() { clearInterval(this.autoPlayInterval); this.autoPlayInterval = null; }

  resetAutoPlay() { this.stopAutoPlay(); this.startAutoPlay(); }
}

// Focus trap utility for modal (simple implementation)
function trapFocus(modal) {
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  const focusable = Array.from(modal.querySelectorAll(focusableSelector));
  if (focusable.length === 0) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKey(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  document.addEventListener('keydown', handleKey);
  first.focus();

  return () => document.removeEventListener('keydown', handleKey);
}

// Simple utility to set inert-like behaviour by toggling aria-hidden and tabindex
function setInert(container, inert = true) {
  container.querySelectorAll('a, button, input, textarea, select, [tabindex]').forEach(el => {
    if (!container.contains(el)) {
      if (inert) {
        el.dataset.prevTab = el.getAttribute('tabindex');
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-hidden', 'true');
      } else {
        if (el.dataset.prevTab != null) { el.setAttribute('tabindex', el.dataset.prevTab); delete el.dataset.prevTab; }
        else el.removeAttribute('tabindex');
        el.removeAttribute('aria-hidden');
      }
    }
  });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Create carousel instance but start autoplay only when the carousel is visible
  const carousel = new Carousel();

  const carouselWrapper = document.getElementById('carouselWrapper');
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      carousel.startAutoPlay();
    } else {
      carousel.stopAutoPlay();
    }
  }, { threshold: 0.5 });
  io.observe(carouselWrapper);

  // Modal behaviour
  const contactModal = document.getElementById('contactModal');
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModal');
  const mainContent = document.getElementById('mainContent');
  let releaseTrap = null;
  let lastFocused = null;

  openModalBtn.addEventListener('click', () => {
    lastFocused = document.activeElement;
    contactModal.classList.add('open');
    contactModal.setAttribute('aria-hidden', 'false');
    mainContent.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'hidden';
    setInert(document.body, true);
    releaseTrap = trapFocus(contactModal);
  });

  function closeModal() {
    contactModal.classList.remove('open');
    contactModal.setAttribute('aria-hidden', 'true');
    mainContent.removeAttribute('aria-hidden');
    document.body.style.overflow = '';
    setInert(document.body, false);
    if (releaseTrap) releaseTrap();
    if (lastFocused) lastFocused.focus();
  }

  closeModalBtn.addEventListener('click', closeModal);
  contactModal.addEventListener('click', (e) => { if (e.target === contactModal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && contactModal.classList.contains('open')) closeModal(); });

  // Profile image fallback — ensure placeholder if image fails
  const profileImg = document.getElementById('profileImg');
  if (profileImg) {
    profileImg.addEventListener('error', () => {
      const parent = profileImg.parentElement;
      if (parent) parent.innerHTML = '<div class="profile-placeholder" aria-hidden="false">👨‍💻</div>';
    });
  }

  // Make carousel wrapper focusable for keyboard support
  carouselWrapper.setAttribute('tabindex', '0');

  // Respect reduced motion — stop animations if requested
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    carousel.stopAutoPlay();
  }
});
