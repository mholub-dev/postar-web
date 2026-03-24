/* =============================================
   POŠTÁR — script.js
   Agency: Paperclip | Version: 1.0.0
   ============================================= */

'use strict';

/* ── Utility ── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* =============================================
   1. STICKY HEADER
   ============================================= */
(function initHeader() {
  const header = qs('#header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* =============================================
   2. HAMBURGER / MOBILE MENU
   ============================================= */
(function initHamburger() {
  const hamburger = qs('.hamburger');
  const navMenu   = qs('.nav-menu');
  if (!hamburger || !navMenu) return;

  const toggle = () => {
    const isOpen = hamburger.classList.toggle('open');
    navMenu.classList.toggle('mobile-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    hamburger.setAttribute('aria-expanded', String(isOpen));
  };

  const close = () => {
    hamburger.classList.remove('open');
    navMenu.classList.remove('mobile-open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', toggle);

  // Close on nav link click
  qsa('.nav-menu a').forEach(link => link.addEventListener('click', close));

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
})();

/* =============================================
   3. SMOOTH SCROLL (for browsers that need it)
   ============================================= */
(function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id     = anchor.getAttribute('href').slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--header-h')) || 72;

      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* =============================================
   4. ACTIVE NAV LINK (Intersection Observer)
   ============================================= */
(function initActiveNav() {
  const sections = qsa('section[id], div[id]').filter(el =>
    qs(`.nav-menu a[href="#${el.id}"]`)
  );

  if (!sections.length) return;

  const navLinks = {};
  sections.forEach(sec => {
    const link = qs(`.nav-menu a[href="#${sec.id}"]`);
    if (link) navLinks[sec.id] = link;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        Object.values(navLinks).forEach(l => l.classList.remove('active'));
        const link = navLinks[entry.target.id];
        if (link) link.classList.add('active');
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0
  });

  sections.forEach(sec => observer.observe(sec));
})();

/* =============================================
   5. SCROLL REVEAL
   ============================================= */
(function initReveal() {
  const els = qsa('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => observer.observe(el));
})();

/* =============================================
   6. HERO CANVAS — GOLDEN PARTICLES
   ============================================= */
(function initHeroCanvas() {
  const canvas = qs('#hero-canvas');
  if (!canvas) return;

  const ctx    = canvas.getContext('2d');
  const COLORS = ['#c9a84c', '#f0d878', '#8a6820'];

  let W, H, particles, mouse = { x: 0, y: 0 }, rafId;

  /* Particle factory */
  function createParticle() {
    return {
      x:       Math.random() * W,
      y:       H + Math.random() * 80,
      r:       Math.random() * 2 + 1,           // 1–3 px
      vx:      (Math.random() - 0.5) * 0.3,
      vy:      -(Math.random() * 0.6 + 0.2),    // 0.2–0.8 px/frame upward
      alpha:   Math.random() * 0.3 + 0.3,        // 0.3–0.6
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    };
  }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;

    const count = Math.round((W * H) / 8000); // density
    particles = Array.from({ length: count }, createParticle);
    // Scatter them vertically on first load
    particles.forEach(p => { p.y = Math.random() * H; });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const mx = (mouse.x / W - 0.5) * 40;  // ±20 px parallax
    const my = (mouse.y / H - 0.5) * 40;

    particles.forEach(p => {
      p.twinkle += 0.02;
      const alpha = p.alpha * (0.85 + 0.15 * Math.sin(p.twinkle));

      ctx.beginPath();
      ctx.arc(p.x + mx * (p.r / 3), p.y + my * (p.r / 3), p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();

      // Move upward
      p.x += p.vx;
      p.y += p.vy;

      // Reset when off screen
      if (p.y < -10) {
        Object.assign(p, createParticle());
        p.y = H + 10;
      }
    });

    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(draw);
  }

  // Mouse parallax
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  // Touch support
  document.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouse.x = t.clientX;
    mouse.y = t.clientY;
  }, { passive: true });

  // ResizeObserver
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(rafId);
    resize();
    draw();
  });
  ro.observe(canvas.parentElement);

  resize();
  draw();

  // Pause when tab hidden (performance)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      draw();
    }
  });
})();

/* =============================================
   7. LAZY LOADING IMAGES
   ============================================= */
(function initLazyImages() {
  if ('loading' in HTMLImageElement.prototype) return; // native lazy supported

  const images = qsa('img[loading="lazy"]');
  if (!images.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => observer.observe(img));
})();

/* =============================================
   8. STATS COUNTER — easeOutQuart, 2s
   ============================================= */
(function initCounters() {
  const counters = qsa('.stat-number[data-target]');
  if (!counters.length) return;

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000; // ms
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value    = Math.round(easeOutQuart(progress) * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(el => observer.observe(el));
})();

/* =============================================
   9. GALLERY LIGHTBOX
   ============================================= */
(function initLightbox() {
  const lightbox  = qs('#lightbox');
  if (!lightbox) return;

  const lbImg     = qs('.lightbox-img',     lightbox);
  const lbCaption = qs('.lightbox-caption', lightbox);
  const lbClose   = qs('.lightbox-close',   lightbox);
  const lbPrev    = qs('.lightbox-prev',     lightbox);
  const lbNext    = qs('.lightbox-next',     lightbox);

  let items   = [];
  let current = 0;

  function getItems() {
    return qsa('.gallery-item img');
  }

  function open(index) {
    items   = getItems();
    current = index;
    show(current);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function show(index) {
    const img = items[index];
    if (!img) return;
    lbImg.src         = img.src;
    lbImg.alt         = img.alt;
    lbCaption.textContent = img.alt;
    lbPrev.style.visibility = items.length > 1 ? 'visible' : 'hidden';
    lbNext.style.visibility = items.length > 1 ? 'visible' : 'hidden';
  }

  function prev() {
    current = (current - 1 + items.length) % items.length;
    show(current);
  }

  function next() {
    current = (current + 1) % items.length;
    show(current);
  }

  // Open on gallery item click
  document.addEventListener('click', e => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const img = item.querySelector('img');
    if (!img) return;
    const allImgs = getItems();
    const idx     = allImgs.indexOf(img);
    open(idx >= 0 ? idx : 0);
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click',  prev);
  lbNext.addEventListener('click',  next);

  // Keyboard
  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // Click backdrop to close
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });

  // Touch swipe on mobile
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) < 40) return;
    delta < 0 ? next() : prev();
  }, { passive: true });
})();

/* =============================================
   10. CONTACT FORM — Validation & Submit
   ============================================= */

// FORM SUBMIT HANDLER
const poptavkaForm = document.getElementById('poptavka-form');
if (poptavkaForm) {

  // Nastav minimální datum na dnešek
  const datumInput = document.getElementById('datum');
  if (datumInput) {
    datumInput.min = new Date().toISOString().split('T')[0];
  }

  // Resetuj tlačítko při načtení stránky
  const submitBtn = poptavkaForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = false;
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    if (btnText) btnText.hidden = false;
    if (btnLoading) btnLoading.hidden = true;
  }

  poptavkaForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validace
    let isValid = true;
    const requiredFields = poptavkaForm.querySelectorAll('[required]');
    requiredFields.forEach(function(field) {
      if (field.type === 'checkbox') {
        if (!field.checked) {
          isValid = false;
          field.style.outlineColor = 'var(--color-red-accent, #c0392b)';
        } else {
          field.style.outlineColor = '';
        }
      } else if (!field.value.trim()) {
        isValid = false;
        field.style.borderColor = 'var(--color-red-accent, #c0392b)';
        field.style.boxShadow = '0 0 0 2px rgba(192,57,43,0.2)';
      } else {
        field.style.borderColor = '';
        field.style.boxShadow = '';
      }
    });

    if (!isValid) {
      const firstError = poptavkaForm.querySelector('[required]:invalid, [required][value=""]');
      if (firstError) firstError.focus();
      return;
    }

    // Zobraz loading stav
    const btn = poptavkaForm.querySelector('button[type="submit"]');
    const btnText = btn ? btn.querySelector('.btn-text') : null;
    const btnLoading = btn ? btn.querySelector('.btn-loading') : null;

    if (btn) btn.disabled = true;
    if (btnText) btnText.hidden = true;
    if (btnLoading) btnLoading.hidden = false;

    // Sbírej data formuláře
    const jmeno   = poptavkaForm.querySelector('[name="jmeno"]')?.value || '';
    const email   = poptavkaForm.querySelector('[name="email"]')?.value || '';
    const telefon = poptavkaForm.querySelector('[name="telefon"]')?.value || '';
    const typAkce = poptavkaForm.querySelector('[name="typ-akce"]')?.value || '';
    const datum   = poptavkaForm.querySelector('[name="datum"]')?.value || '';
    const misto   = poptavkaForm.querySelector('[name="misto"]')?.value || '';
    const zprava  = poptavkaForm.querySelector('[name="zprava"]')?.value || '';
    const fullDay = poptavkaForm.querySelector('[name="full-day"]')?.checked ? 'Ano' : 'Ne';

    // Sestav mailto
    const subject = encodeURIComponent('Poptávka Poštár — ' + (typAkce || 'web') + ' — ' + jmeno);
    const body    = encodeURIComponent(
      'Jméno: ' + jmeno +
      '\nEmail: ' + email +
      '\nTelefon: ' + telefon +
      '\nTyp akce: ' + typAkce +
      '\nDatum: ' + datum +
      '\nMísto: ' + misto +
      '\nSvatební den bez starostí: ' + fullDay +
      '\n\nZpráva:\n' + zprava
    );

    // Krátká prodleva pro UX efekt, pak otevři email klienta
    setTimeout(function() {
      window.location.href = 'mailto:info@postar.cz?subject=' + subject + '&body=' + body;

      // Reset tlačítka
      if (btn) btn.disabled = false;
      if (btnText) btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;

      // Zobraz success zprávu
      const successMsg = poptavkaForm.querySelector('.form-success');
      if (successMsg) {
        successMsg.hidden = false;
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Reset formuláře
      setTimeout(function() {
        poptavkaForm.reset();
      }, 600);

    }, 900);
  });
}
