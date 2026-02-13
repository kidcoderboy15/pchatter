/* ============================================================
   OpenClaw Ninja — Interactive Script
   Animations, terminal effect, counters, FAQ, navigation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // ── Scroll Animations ──
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animations for siblings
        const parent = entry.target.parentElement;
        const siblings = parent ? Array.from(parent.querySelectorAll('[data-animate]')) : [];
        const siblingIndex = siblings.indexOf(entry.target);
        const delay = siblingIndex >= 0 ? siblingIndex * 100 : 0;

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        animateOnScroll.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => {
    animateOnScroll.observe(el);
  });

  // ── Hero Animate In ──
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const elements = document.querySelectorAll('.animate-in');
        elements.forEach((el, i) => {
          setTimeout(() => {
            el.classList.add('visible');
          }, i * 150);
        });
        heroObserver.disconnect();
      }
    });
  }, { threshold: 0.1 });

  const heroSection = document.getElementById('hero');
  if (heroSection) {
    heroObserver.observe(heroSection);
  }

  // ── Navigation Scroll Effect ──
  const nav = document.getElementById('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });

  // ── Mobile Navigation Toggle ──
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ── Counter Animation ──
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10);
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 2000;
        const start = performance.now();

        function updateCounter(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(target * eased);
          el.textContent = current + suffix;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          }
        }

        requestAnimationFrame(updateCounter);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(el => {
    counterObserver.observe(el);
  });

  // ── Terminal Animation ──
  const terminalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const lines = entry.target.querySelectorAll('.terminal-line');
        lines.forEach(line => {
          const delay = parseInt(line.getAttribute('data-delay') || '0', 10);
          setTimeout(() => {
            line.classList.add('show');
          }, delay);
        });
        terminalObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const terminalBody = document.querySelector('.terminal-body');
  if (terminalBody) {
    terminalObserver.observe(terminalBody);
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
      });

      // Toggle clicked
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ── Active Navigation Highlight ──
  const sections = document.querySelectorAll('section[id]');
  const navLinksAll = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinksAll.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

  sections.forEach(section => {
    sectionObserver.observe(section);
  });

  // ── Card Glow Effect (mouse follow) ──
  document.querySelectorAll('.card-glow').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // ── Parallax for gradient orbs ──
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const orbs = document.querySelectorAll('.gradient-orb');
        orbs.forEach((orb, i) => {
          const speed = 0.03 + (i * 0.01);
          orb.style.transform = `translateY(${scrollY * speed}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
});
