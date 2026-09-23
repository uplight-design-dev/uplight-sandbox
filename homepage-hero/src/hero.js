import { animate, createAnimatable, createTimeline, stagger, spring, onScroll, utils } from 'animejs';

const root = document.getElementById('uh');
const html = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = root) => el.querySelector(s);
const $$ = (s, el = root) => [...el.querySelectorAll(s)];

/* ---------- Mobile menu ---------- */
const menu = $('.uh__menu');
const setMenu = (open) => {
  root.classList.toggle('is-open', open);
  menu.setAttribute('aria-expanded', open);
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open && !reduce) {
    animate($$('.uh__drawer a'), { opacity: [0, 1], y: [-6, 0], delay: stagger(35), duration: 320, ease: 'outQuad' });
  }
};
menu.addEventListener('click', () => setMenu(!root.classList.contains('is-open')));
$$('.uh__drawer a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ---------- Contact us: fill circle starts where the cursor enters / heads to where it leaves ---------- */
const ctaDesk = $('.uh__cta--desk');
const aimFill = (e) => {
  const r = ctaDesk.getBoundingClientRect();
  ctaDesk.style.setProperty('--x', `${e.clientX - r.left}px`);
  ctaDesk.style.setProperty('--y', `${e.clientY - r.top}px`);
};
ctaDesk.addEventListener('pointerenter', aimFill);
ctaDesk.addEventListener('pointerleave', aimFill);

/* ---------- Utility / Residential toggle ---------- */
const toggle = $('.uh__toggle');
const pill = $('.uh__pill');
const tabs = $$('[role="tab"]', toggle);
const pillSpring = spring({ bounce: 0.28, duration: 520 });

const placePill = (tab, instant) => {
  const x = tab.offsetLeft - tabs[0].offsetLeft;
  const props = { x, width: tab.offsetWidth };
  if (instant || reduce) utils.set(pill, props);
  else animate(pill, { ...props, ease: pillSpring });
};

const showPanel = (panel, on) => {
  panel.setAttribute('aria-hidden', !on);
  panel.inert = !on;
};

/* Cards follow the toggle: each card cross-fades to the other audience's photo, label and link.
   The incoming photo is raised above the outgoing one and faded from an opacity that matches
   what is currently on screen, so fast back-and-forth clicks never jump. */
const cards = $$('.uh__card');
const setAudience = (name) => {
  cards.forEach((card, i) => {
    card.href = card.dataset[name === 'utility' ? 'hrefUtility' : 'hrefResidential'];
    const inImg = card.querySelector(`img[data-aud="${name}"]`);
    const outImg = card.querySelector(`img[data-aud]:not([data-aud="${name}"])`);
    const inLbl = card.querySelector(`.uh__card-label[data-aud="${name}"]`);
    const outLbl = card.querySelector(`.uh__card-label[data-aud]:not([data-aud="${name}"])`);
    inLbl.removeAttribute('aria-hidden');
    outLbl.setAttribute('aria-hidden', 'true');

    if (reduce) {
      utils.set(inImg, { zIndex: 2, opacity: 1 }); utils.set(outImg, { zIndex: 1, opacity: 1 });
      utils.set(inLbl, { opacity: 1 }); utils.set(outLbl, { opacity: 0 });
      return;
    }
    const outShown = parseFloat(getComputedStyle(outImg).opacity);
    utils.remove([inImg, outImg]); // stop any in-flight fade before re-stacking
    const outOnTop = (parseInt(getComputedStyle(outImg).zIndex, 10) || 0) > (parseInt(getComputedStyle(inImg).zIndex, 10) || 0);
    if (outOnTop) {
      utils.set(inImg, { zIndex: 2, opacity: 1 - outShown });
      utils.set(outImg, { zIndex: 1, opacity: 1 });
    }
    animate(inImg, { opacity: 1, duration: 750, delay: i * 90, ease: 'out(2)' });
    animate(outLbl, { opacity: 0, duration: 200, ease: 'out(2)' });
    animate(inLbl, { opacity: 1, duration: 420, delay: 140 + i * 90, ease: 'out(3)' });
  });
};

const select = (name) => {
  if (toggle.dataset.active === name) return;
  const next = tabs.find((t) => t.dataset.tab === name);
  const prev = tabs.find((t) => t.dataset.tab === toggle.dataset.active);
  const outPanel = document.getElementById(prev.getAttribute('aria-controls'));
  const inPanel = document.getElementById(next.getAttribute('aria-controls'));

  toggle.dataset.active = name;
  tabs.forEach((t) => {
    const on = t === next;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
  });
  placePill(next);
  setAudience(name);

  if (reduce) {
    showPanel(outPanel, false); utils.set(outPanel, { opacity: 0, visibility: 'hidden' });
    showPanel(inPanel, true); utils.set(inPanel, { opacity: 1, y: 0, visibility: 'visible' });
    return;
  }

  // Cross-fade in place. Animations start from the current values, so rapid
  // back-and-forth clicks reverse smoothly instead of snapping.
  inPanel.style.visibility = 'visible';
  outPanel.style.visibility = 'visible';
  showPanel(inPanel, true);
  outPanel.setAttribute('aria-hidden', 'true');
  outPanel.inert = true;
  animate(outPanel, {
    opacity: 0, y: -4, duration: 220, ease: 'out(2)',
    onComplete: () => { if (outPanel.getAttribute('aria-hidden') === 'true') outPanel.style.visibility = 'hidden'; },
  });
  const hiddenNow = parseFloat(getComputedStyle(inPanel).opacity) < 0.05;
  if (hiddenNow) utils.set(inPanel, { opacity: 0, y: 6 });
  animate(inPanel, { opacity: 1, y: 0, duration: 520, delay: hiddenNow ? 150 : 0, ease: 'out(3)' });
};

tabs.forEach((t) => {
  t.addEventListener('click', () => select(t.dataset.tab));
  t.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = t.dataset.tab === 'utility' ? 'residential' : 'utility';
    select(n);
    toggle.querySelector(`[data-tab="${n}"]`).focus();
  });
});
placePill(tabs[0], true);
window.addEventListener('resize', () => placePill(tabs.find((t) => t.dataset.tab === toggle.dataset.active), true));

/* ---------- Card hover: lift, slow photo pan, shimmer outline, green overlay + CTA ---------- */
let lastUserScroll = 0;
let autoScroll = null; // the running eased page scroll, if any
['wheel', 'touchmove', 'keydown', 'mousedown'].forEach((ev) => window.addEventListener(ev, () => {
  lastUserScroll = Date.now();
  if (autoScroll) { autoScroll.cancel(); autoScroll = null; } // the visitor always wins
}, { passive: true }));

// Eased page scroll driven by anime.js (native smooth scroll is too quick and can't be tuned)
const easeScrollBy = (dist) => {
  if (autoScroll) autoScroll.cancel();
  const pos = { y: window.scrollY };
  autoScroll = animate(pos, {
    y: pos.y + dist,
    duration: Math.min(1500, 900 + dist * 2), // longer trips take a little longer
    ease: 'inOut(3)',
    onUpdate: () => window.scrollTo(0, pos.y),
    onComplete: () => { autoScroll = null; },
  });
};
if (canHover && !reduce) {
  $$('.uh__card').forEach((card) => {
    const imgs = card.querySelectorAll('.uh__card-media img');
    const overlay = card.querySelector('.uh__card-overlay');
    const cta = card.querySelector('.uh__card-cta');
    const arrow = card.querySelector('.uh__card-arrow');
    const glows = card.querySelectorAll('.uh__card-glow');
    const rest = [...imgs].map((im) => getComputedStyle(im).objectPosition);
    const panTo = rest.map((p) => '12% ' + p.split(' ')[1]);
    utils.set(cta, { y: 14 });
    const lift = spring({ bounce: 0.2, duration: 600 });

    const enter = () => {
      animate(card, { y: -6, ease: lift });
      // Slow pan through the part of the photo the card crops off (no zoom)
      imgs.forEach((im, k) => animate(im, { objectPosition: panTo[k], duration: 2600, ease: 'inOut(2)' }));
      card.classList.add('is-hover');
      animate(glows, { opacity: 1, duration: 500, ease: 'out(2)' });
      animate(overlay, { opacity: 1, duration: 380, ease: 'out(2)' });
      animate(cta, { opacity: 1, y: 0, duration: 480, delay: 70, ease: 'out(3)' });
      animate(arrow, { x: { from: -6, to: 0 }, duration: 520, delay: 120, ease: 'out(3)' });
    };
    const leave = () => {
      animate(card, { y: 0, ease: lift });
      imgs.forEach((im, k) => animate(im, { objectPosition: rest[k], duration: 1400, ease: 'inOut(2)' }));
      animate(glows, { opacity: 0, duration: 350, ease: 'out(2)', onComplete: () => card.classList.remove('is-hover') });
      animate(overlay, { opacity: 0, duration: 320, ease: 'out(2)' });
      animate(cta, { opacity: 0, y: 10, duration: 240, ease: 'out(2)' });
    };
    // Hover-intent reveal: if the card's bottom (where the call to action sits) is cut off by the
    // bottom of the viewport, gently scroll just enough to show it. Waits for a short, deliberate
    // hover and never fights a scroll the visitor is already doing.
    let revealTimer = null;
    const reveal = () => {
      if (Date.now() - lastUserScroll < 400) return;
      const margin = 32;
      const overflow = card.getBoundingClientRect().bottom + margin - window.innerHeight;
      if (overflow <= 0) return;
      // content layers rise ~0.34px per px scrolled, so the card closes the gap faster than the page moves
      easeScrollBy(Math.ceil(overflow / 1.34));
    };
    card.addEventListener('mouseenter', () => { enter(); clearTimeout(revealTimer); revealTimer = setTimeout(reveal, 280); });
    card.addEventListener('mouseleave', () => { clearTimeout(revealTimer); leave(); });
    card.addEventListener('focus', () => { if (card.matches(':focus-visible')) enter(); });
    card.addEventListener('blur', leave);
  });
}

/* ---------- Scroll depth ----------
   Background: moves at ~40% of the scroll speed (lags behind the page) and fades out fully by the
   time the hero is about halfway scrolled away (starting as the cards rise over it).
   Content: each layer gets extra upward travel — nearer layers travel further, which reads as depth. */
if (!reduce) {
  const range = () => root.offsetHeight;
  const layers = [
    ['.uh__intro', 0.16],
    ['.uh__copy', 0.24],
    ['.uh__cards', 0.34],
  ];
  const scrollAnims = layers.map(([sel, rate]) => animate($(sel), {
    y: { from: 0, to: () => -range() * rate },
    ease: 'linear',
    autoplay: onScroll({ target: root, enter: 'top top', leave: 'top bottom' /* container edge, target edge */, sync: 0.18 }),
  }));
  scrollAnims.push(animate($('.uh__bgtrack'), {
    y: { from: 0, to: () => range() * 0.6, duration: 1000, ease: 'linear' },
    opacity: [
      { to: 1, duration: 150 },                // solid while the cards start rising over it
      { to: 0, duration: 330, ease: 'out(2)' }, // then fade out quickly…
      { to: 0, duration: 520 },                // …gone by roughly halfway through the hero's scroll
    ],
    autoplay: onScroll({ target: root, enter: 'top top', leave: 'top bottom', sync: 0.18 }),
  }));
  window.addEventListener('resize', () => scrollAnims.forEach((a) => a.refresh()));
}

/* ---------- Pointer depth: photo drifts against the cursor ---------- */
if (canHover && !reduce) {
  const bgImg = $('.uh__bg img');
  utils.set(bgImg, { scale: 1.03 }); // just enough headroom so the drift never shows an edge
  const bgMove = createAnimatable(bgImg, { x: 1800, y: 1800, ease: 'out(3)' });
  const clamp = (v) => Math.max(-1, Math.min(1, v));
  root.addEventListener('pointermove', (e) => {
    const r = root.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
    const ny = clamp(((e.clientY - Math.max(r.top, 0)) / Math.min(r.height, window.innerHeight)) * 2 - 1);
    bgMove.x(-nx * 9); bgMove.y(-ny * 5);
  });
  root.addEventListener('pointerleave', () => { bgMove.x(0); bgMove.y(0); });
}

/* ---------- Load-in sequence ---------- */
const reveal = () => html.classList.remove('uh-anim');
if (reduce || !html.classList.contains('uh-anim')) {
  reveal();
} else {
  const inEls = $$('[data-in]');
  utils.set(inEls, { opacity: 0 });
  reveal();
  createTimeline({ defaults: { ease: 'outExpo', duration: 1100 } })
    .add('.uh__bg', { opacity: [0, 1], scale: [1.08, 1], duration: 2200, ease: 'outQuart' }, 0)
    .add($$('[data-in="nav"]'), { opacity: [0, 1], y: [-14, 0], delay: stagger(70) }, 150)
    .add($$('.uh__title span'), { opacity: [0, 1], y: [48, 0], delay: stagger(110) }, 300)
    .add($$('[data-in="intro"]'), { opacity: [0, 1], y: [24, 0], delay: stagger(90) }, 620)
    .add($$('[data-in="copy"]'), { opacity: [0, 1], y: [20, 0], delay: stagger(80) }, 900)
    .add($$('.uh__card'), { opacity: [0, 1], y: [40, 0], scale: [0.96, 1], delay: stagger(100) }, 950);
}
