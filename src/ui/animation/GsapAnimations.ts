import { gsap } from 'gsap';

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function animateCards(root: HTMLElement): void {
  const cards = root.querySelectorAll<HTMLElement>('.card, .collection-card, .menu-option');
  cards.forEach((card) => {
    card.addEventListener('pointerenter', () => {
      gsap.to(card, {
        filter: 'brightness(1.12)',
        duration: 0.18,
        overwrite: 'auto',
      });
    });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, {
        filter: '',
        duration: 0.22,
        overwrite: 'auto',
      });
    });
  });
}

function restoreVisibility(root: HTMLElement): void {
  gsap.set(root.querySelectorAll('.screen, .screen *'), {
    clearProps: 'opacity,visibility',
  });
}

function animateMainMenu(root: HTMLElement): void {
  const timeline = gsap.timeline();
  const panel = root.querySelector('.main-menu-panel');
  timeline
    .from(root.querySelectorAll('.main-menu-banner span'), {
      opacity: 0,
      y: -8,
      stagger: 0.06,
      duration: 0.34,
      clearProps: 'opacity,transform',
    })
    .from(
      root.querySelectorAll('.menu-option'),
      {
        opacity: 0,
        x: 28,
        stagger: 0.07,
        duration: 0.42,
        clearProps: 'opacity,transform',
      },
      '-=0.15',
    )
  if (panel) {
    timeline.from(
      panel,
      {
        opacity: 0,
        scale: 0.97,
        duration: 0.45,
        clearProps: 'opacity,transform',
      },
      '-=0.22',
    );
  }

  gsap.to(root.querySelectorAll('.main-menu-ambient span'), {
    y: '+=12',
    x: '+=8',
    opacity: 0.75,
    duration: 2.8,
    repeat: -1,
    yoyo: true,
    stagger: 0.32,
    ease: 'sine.inOut',
  });
}

function animateCollection(root: HTMLElement): void {
  gsap.from(root.querySelectorAll('.collection-tabs a'), {
    opacity: 0,
    y: -10,
    stagger: 0.05,
    duration: 0.28,
    clearProps: 'opacity,transform',
  });

  gsap.from(root.querySelectorAll('.collection-section.is-active .collection-card'), {
    opacity: 0,
    y: 22,
    scale: 0.96,
    stagger: { each: 0.035, from: 'start' },
    duration: 0.42,
    clearProps: 'opacity,transform',
  });

  const progressFill = root.querySelector('.collection-progress-bar i');
  if (progressFill) {
    gsap.fromTo(
      progressFill,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.75, ease: 'power2.out' },
    );
  }
}

function animateMap(root: HTMLElement): void {
  gsap.from(root.querySelectorAll('.map-hero-panel, .map-info-card'), {
    opacity: 0,
    y: 14,
    stagger: 0.08,
    duration: 0.36,
    clearProps: 'opacity,transform',
  });

  gsap.from(root.querySelectorAll('.map-floor-label'), {
    opacity: 0,
    x: -18,
    stagger: 0.025,
    duration: 0.3,
    clearProps: 'opacity,transform',
  });

  gsap.from(root.querySelectorAll('.map-node'), {
    opacity: 0,
    scale: 0.55,
    stagger: { each: 0.018, from: 'end' },
    duration: 0.38,
    ease: 'back.out(1.8)',
    clearProps: 'opacity,transform',
  });
}

function animateCombat(root: HTMLElement): void {
  const arena = root.querySelector('.combat-arena');
  if (arena) {
    gsap.from(arena, {
      opacity: 0,
      scale: 0.985,
      duration: 0.45,
      clearProps: 'opacity,transform',
    });
  }

  gsap.from(root.querySelectorAll('.enemy-card'), {
    opacity: 0,
    y: -24,
    scale: 0.92,
    stagger: 0.08,
    duration: 0.42,
    ease: 'back.out(1.4)',
    clearProps: 'opacity,transform',
  });

  gsap.from(root.querySelectorAll('.hand-card-slot'), {
    opacity: 0,
    y: 60,
    rotate: 6,
    stagger: { each: 0.045, from: 'center' },
    duration: 0.48,
    ease: 'back.out(1.25)',
    clearProps: 'opacity,transform',
  });

  gsap.to(root.querySelectorAll('.enemy-card'), {
    y: '-=5',
    duration: 1.8,
    repeat: -1,
    yoyo: true,
    stagger: 0.18,
    ease: 'sine.inOut',
  });

  const energyRing = root.querySelector('.arena-energy-ring');
  if (energyRing) {
    gsap.to(energyRing, {
      rotate: 360,
      duration: 18,
      repeat: -1,
      ease: 'none',
    });
  }
}

export function runGsapAnimations(root: HTMLElement): void {
  if (prefersReducedMotion()) return;

  try {
    gsap.defaults({ ease: 'power3.out' });
    gsap.killTweensOf(root.querySelectorAll('*'));

    const screen = root.querySelector('.screen');
    if (screen) {
      gsap.from(screen, {
        y: 18,
        scale: 0.995,
        duration: 0.28,
        clearProps: 'transform',
      });
    }

    if (root.querySelector('.main-menu')) animateMainMenu(root);
    if (root.querySelector('.collection-screen')) animateCollection(root);
    if (root.querySelector('.map-screen')) animateMap(root);
    if (root.querySelector('.combat-screen')) animateCombat(root);

    animateCards(root);
  } catch (error) {
    console.warn('[GSAP] animations skipped:', error);
    restoreVisibility(root);
  }
}
