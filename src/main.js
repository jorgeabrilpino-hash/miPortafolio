import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

// The inline fallback in index.html un-hides content if this module never runs.
clearTimeout(window.__animFallback);

const root = document.documentElement;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) root.classList.add('no-anim');

/* ----------------------------------------------------------
   Split hero title into characters
   ---------------------------------------------------------- */
function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = ch === ' ' ? ' ' : ch;
    span.setAttribute('aria-hidden', 'true');
    el.appendChild(span);
  }
}

/* ----------------------------------------------------------
   Intro + scroll animations
   ---------------------------------------------------------- */
function initMotion() {
  $$('[data-split]').forEach(splitChars);

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .set('.hero__title .split, .hero__title .accent', { autoAlpha: 1 })
    .from('.hero__sphere', { scale: 1.15, autoAlpha: 0, duration: 2.2, ease: 'power2.out' }, 0)
    .from('.nav', { yPercent: -100, autoAlpha: 0, duration: 1 }, 0.1)
    .from('.hero__title .char', { yPercent: 110, rotate: 6, duration: 1.2, stagger: 0.035 }, 0.15)
    .from('.hero__title .accent', { scale: 0, autoAlpha: 0, duration: 0.8, ease: 'back.out(3)' }, '-=0.6')
    .fromTo('[data-hero]', { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1 }, '-=0.9');

  // Stat counters
  $$('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const obj = { v: 0 };
    intro.to(obj, {
      v: target,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => { el.textContent = Math.round(obj.v); },
    }, '-=0.8');
  });

  // Hero parallax on scroll
  gsap.to('.hero__sphere', {
    yPercent: -35,
    rotate: 8,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    y: -80,
    autoAlpha: 0.2,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true },
  });

  // Generic reveals, batched so siblings stagger together
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => gsap.fromTo(batch,
      { y: 40, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });

  // Project cards: clip-path reveal on the screenshot
  $$('.project').forEach((card) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
    tl.fromTo(card, { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'expo.out' })
      .fromTo($('.project__media img', card),
        { clipPath: 'inset(0 0 100% 0)', scale: 1.15 },
        { clipPath: 'inset(0 0 0% 0)', scale: 1, duration: 1.3, ease: 'expo.out', clearProps: 'transform' }, 0.1)
      .fromTo($$('.project__body > *', card),
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, 0.25);
  });

  // Timeline progress line
  gsap.to('.timeline__progress', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '#timeline', start: 'top 70%', end: 'bottom 60%', scrub: 0.4 },
  });

  // Marquee: constant drift that speeds up with scroll velocity
  const track = $('.marquee__track');
  if (track) {
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    let settle;
    ScrollTrigger.create({
      onUpdate: (self) => {
        const boost = Math.min(Math.abs(self.getVelocity()) / 400, 6);
        gsap.to(loop, { timeScale: 1 + boost, duration: 0.3, overwrite: true });
        clearTimeout(settle);
        settle = setTimeout(() => gsap.to(loop, { timeScale: 1, duration: 1.2, overwrite: true }), 150);
      },
    });
  }

  // Contact ambient light
  gsap.fromTo('.contact__glow', { scale: 0.6, autoAlpha: 0 }, {
    scale: 1, autoAlpha: 1, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center center', scrub: true },
  });

  // Magnetic buttons (pointer devices only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }
}

/* ----------------------------------------------------------
   Nav: scrolled state + active section
   ---------------------------------------------------------- */
function initNav() {
  const nav = $('#nav');
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    onToggle: (self) => nav.classList.toggle('is-scrolled', self.isActive),
  });

  const links = $$('[data-nav]');
  links.forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });
}

/* ----------------------------------------------------------
   Mobile menu
   ---------------------------------------------------------- */
function initMobileMenu() {
  const toggle = $('#nav-toggle');
  const menu = $('#mobile-menu');
  if (!toggle || !menu) return;

  const items = $$('a', menu);
  const tl = gsap.timeline({ paused: true })
    .to(menu, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' })
    .fromTo(items, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out' }, 0.1);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) tl.timeScale(1).play();
    else tl.timeScale(1.6).reverse();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  items.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false);
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ----------------------------------------------------------
   Project filters (GSAP Flip)
   ---------------------------------------------------------- */
function initFilters() {
  const grid = $('#project-grid');
  const buttons = $$('.filter');
  const cards = $$('.project', grid);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      const state = Flip.getState(cards);
      cards.forEach((card) => {
        const tags = card.dataset.tags.split(' ');
        card.classList.toggle('is-hidden', filter !== 'all' && !tags.includes(filter));
      });

      Flip.from(state, {
        duration: reduceMotion ? 0 : 0.7,
        ease: 'expo.inOut',
        absolute: true,
        scale: true,
        onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.5 }),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.3 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    });
  });
}

/* ----------------------------------------------------------
   Copy email + toast
   ---------------------------------------------------------- */
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  gsap.killTweensOf(el);
  gsap.timeline()
    .fromTo(el, { autoAlpha: 0, y: 20, xPercent: -50 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'expo.out' })
    .to(el, { autoAlpha: 0, y: 20, duration: 0.3, ease: 'power2.in' }, '+=1.8');
}

function initCopyEmail() {
  const btn = $('#copy-email');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      toast('Correo copiado al portapapeles');
    } catch {
      window.location.href = `mailto:${email}`;
    }
  });
}

/* ----------------------------------------------------------
   Boot
   ---------------------------------------------------------- */
initNav();
initMobileMenu();
initFilters();
initCopyEmail();

if (!reduceMotion) {
  try {
    initMotion();
  } catch (err) {
    console.error('[motion] disabled after error', err);
    root.classList.add('no-anim');
  }
} else {
  gsap.set('.timeline__progress', { scaleY: 1 });
}

// Lazy images change layout height; keep trigger positions accurate.
window.addEventListener('load', () => ScrollTrigger.refresh());
