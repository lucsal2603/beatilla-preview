(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* innerWidth può essere 0 in contesti di prerender/anteprima: fallback su screen.width */
    const isMobile = () => (window.innerWidth || screen.width || 1024) <= 768;

    /* ---------- Hero video: load only on desktop (saves ~7MB on mobile) ---------- */
    (() => {
      const v = document.querySelector('.hero__video video');
      if (!v || isMobile() || prefersReduced) return;
      const src = v.getAttribute('data-src');
      if (!src) return;
      v.setAttribute('src', src);
      v.load();
      const play = () => v.play().catch(() => {});
      if (v.readyState >= 2) play(); else v.addEventListener('canplay', play, { once: true });
    })();

    /* ---------- NAV: solid on scroll ---------- */
    const nav = document.getElementById('nav');
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.65) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Mobile nav menu ---------- */
    (() => {
      const toggle = document.getElementById('navToggle');
      const links = document.querySelector('.nav__links');
      if (!toggle || !links) return;
      const overlay = document.createElement('div');
      overlay.className = 'nav__overlay';
      overlay.id = 'navOverlay';
      overlay.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('nav');
      inner.className = 'nav__overlay-links';
      inner.setAttribute('aria-label', 'Menu');
      inner.innerHTML = links.innerHTML;
      overlay.appendChild(inner);
      document.body.appendChild(overlay);
      const open = () => {
        document.body.classList.add('menu-open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Chiudi menu');
        overlay.setAttribute('aria-hidden', 'false');
      };
      const close = () => {
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Apri menu');
        overlay.setAttribute('aria-hidden', 'true');
      };
      toggle.addEventListener('click', () => {
        document.body.classList.contains('menu-open') ? close() : open();
      });
      inner.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      window.addEventListener('resize', () => { if (window.innerWidth > 768) close(); });
    })();

    /* ---------- TESTIMONIALS auto-rotate ---------- */
    (function testimonials() {
      const items = Array.from(document.querySelectorAll('.testi__item'));
      const dotsWrap = document.getElementById('testiDots');
      if (!items.length) return;
      let idx = 0, timer = null;
      items.forEach((_, i) => {
        const b = document.createElement('button');
        b.className = 'testi__dot' + (i === 0 ? ' active' : '');
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Testimonianza ' + (i + 1));
        b.addEventListener('click', () => { show(i); restart(); });
        dotsWrap.appendChild(b);
      });
      const dots = Array.from(dotsWrap.children);
      function show(n) {
        items[idx].classList.remove('active'); dots[idx].classList.remove('active');
        idx = (n + items.length) % items.length;
        items[idx].classList.add('active'); dots[idx].classList.add('active');
      }
      function start() { timer = setInterval(() => show(idx + 1), 4000); }
      function restart() { clearInterval(timer); start(); }
      start();
    })();

    /* ---------- CONTACT FORM (no backend; graceful feedback) ---------- */
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        status.textContent = 'Inserisci nome ed email validi per inviare la richiesta.';
        return;
      }
      status.textContent = 'Grazie, ' + name + '. Ti risponderemo al più presto.';
      form.reset();
    });

    /* ============================================================
       GSAP-DEPENDENT ANIMATIONS
       ============================================================ */
    if (typeof gsap === 'undefined') return; // fail-safe: site still works statically
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    /* Parti dall'alto: evita che un reload a metà pagina mostri il pin in uno stato sbagliato */
    if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; window.scrollTo(0, 0); }

    /* ---------- LENIS: smooth scroll con inerzia, sincronizzato con ScrollTrigger ----------
       Sul touch resta lo scorrimento nativo (Lenis smootha solo la rotella): niente lag su telefono. */
    let lenis = null;
    if (!prefersReduced && typeof Lenis !== 'undefined') {
      lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      /* Ancore interne fluide (menu, overlay, frecce): passano da Lenis */
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
          const id = a.getAttribute('href');
          if (id.length < 2) return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target, { duration: 1.3 });
        });
      });
    }

    /* ---------- HERO load animation ---------- */
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (!prefersReduced) {
      heroTl.to('.hero__media', { scale: 1.0, duration: 1.6, ease: 'power2.out' }, 0);
      heroTl.from('.hero__title .word', { yPercent: 110, opacity: 0, duration: 1.2, stagger: 0.12 }, 0.15);
      heroTl.from('.hero__label', { y: 20, opacity: 0, duration: 0.9 }, 0.1);
      heroTl.from('.hero__scroll', { opacity: 0, duration: 0.8 }, 1.0);
      /* La nav scende dall'alto insieme all'hero (transform non è nella transition CSS della nav) */
      heroTl.from('.nav', { yPercent: -100, opacity: 0, duration: 0.9 }, 0.35);
    }

    /* ---------- HERO exit parallax: il contenuto sale e sfuma mentre scorri via ---------- */
    if (!prefersReduced) {
      gsap.to('.hero__inner', {
        yPercent: -14, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '75% top', scrub: true }
      });
      gsap.fromTo('.hero__scroll', { opacity: 1 }, {
        opacity: 0, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '.hero', start: '3% top', end: '22% top', scrub: true }
      });
      if (!isMobile()) {
        gsap.to(['.hero__media', '.hero__video'], {
          yPercent: 10, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
      }
    }

    /* ---------- INTRO line-by-line clip reveal (desktop) / fade unico (mobile) ---------- */
    if (isMobile()) {
      gsap.from('.intro__lead', {
        y: 26, opacity: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: '.intro__lead', start: 'top 82%' }
      });
    } else {
      gsap.utils.toArray('.reveal-line > span').forEach((line) => {
        gsap.from(line, {
          yPercent: 110,
          ease: 'power3.out',
          duration: 1.0,
          scrollTrigger: { trigger: line, start: 'top 80%' }
        });
      });
    }

    /* ---------- GENERIC fade-up [data-fade] ---------- */
    gsap.utils.toArray('[data-fade]').forEach((el) => {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 0.9, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 80%' }
      });
    });

    /* ---------- IMAGE BREAK parallax ---------- */
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      if (prefersReduced || isMobile()) return; /* su telefono niente parallax scrub: lo scroll resta fluido */
      gsap.fromTo(el, { yPercent: -18 }, {
        yPercent: 18, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- CAMERE ----------
       Telefono: rullino orizzontale swipabile — card a fuoco quando centrata + pallini.
       Desktop: foto svelata con clip laterale + zoom, testo a cascata (come prima). */
    if (isMobile()) {
      (() => {
        const rooms = document.querySelector('.rooms');
        const track = document.getElementById('roomsTrack');
        const dotsWrap = document.getElementById('roomsDots');
        if (!rooms || !track || !dotsWrap) return;
        rooms.classList.add('rooms--roll');
        const realCards = Array.from(track.querySelectorAll('.room'));
        const N = realCards.length;

        /* LOOP CIRCOLARE: clono l'ultima camera in testa e la prima in coda.
           Quando lo scroll si ferma su un clone, salto senza animazione sulla
           gemella vera (identica → il salto è invisibile). Così dal primo si
           torna all'ultimo andando a sinistra, e viceversa. */
        const cloneLast = realCards[N - 1].cloneNode(true);
        const cloneFirst = realCards[0].cloneNode(true);
        [cloneLast, cloneFirst].forEach((c) => { c.setAttribute('aria-hidden', 'true'); c.classList.add('room--clone'); });
        track.insertBefore(cloneLast, realCards[0]);
        track.appendChild(cloneFirst);
        const allCards = [cloneLast, ...realCards, cloneFirst];
        const realIndexOf = (el) => el === cloneLast ? N - 1 : el === cloneFirst ? 0 : realCards.indexOf(el);

        const centerOf = (el) => el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
        const goTo = (el, smooth) => track.scrollTo({ left: centerOf(el), behavior: smooth && !prefersReduced ? 'smooth' : 'auto' });

        /* si parte dalla prima camera VERA (subito dopo il clone in testa) */
        goTo(realCards[0], false);
        window.addEventListener('load', () => { if (!track.dataset.touched) goTo(realCards[0], false); }, { once: true });
        track.addEventListener('touchstart', () => { track.dataset.touched = '1'; }, { once: true, passive: true });

        /* ingresso della striscia da destra quando la sezione entra */
        if (!prefersReduced) {
          gsap.from(track, {
            x: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: rooms, start: 'top 78%' }
          });
        }

        /* pallini: uno per camera VERA, tap per saltare a quella camera */
        const dots = realCards.map((card, i) => {
          const d = document.createElement('button');
          d.type = 'button';
          d.className = 'rooms__dot';
          d.setAttribute('aria-label', 'Vai alla camera ' + (i + 1));
          d.addEventListener('click', () => goTo(card, true));
          dotsWrap.appendChild(d);
          return d;
        });

        /* card "a fuoco" quando occupa il centro del rullino (cloni compresi) */
        const setActive = (el) => {
          const i = realIndexOf(el);
          allCards.forEach((c) => c.classList.toggle('is-active', c === el));
          dots.forEach((d, j) => d.classList.toggle('active', j === i));
        };
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => { if (en.isIntersecting) setActive(en.target); });
        }, { root: track, threshold: 0.6 });
        allCards.forEach((c) => io.observe(c));
        setActive(realCards[0]);

        /* a scroll fermo: se siamo su un clone, teletrasporto sulla gemella vera */
        let settleT;
        track.addEventListener('scroll', () => {
          clearTimeout(settleT);
          settleT = setTimeout(() => {
            const center = track.scrollLeft + track.clientWidth / 2;
            let best = null, bd = Infinity;
            allCards.forEach((c) => {
              const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
              if (d < bd) { bd = d; best = c; }
            });
            if (best === cloneLast) goTo(realCards[N - 1], false);
            else if (best === cloneFirst) goTo(realCards[0], false);
          }, 140);
        }, { passive: true });
      })();
    } else {
      gsap.utils.toArray('.room').forEach((room) => {
        const img = room.querySelector('[data-room-img]');
        const photo = img.querySelector('img');
        const text = room.querySelector('[data-room-text]');
        const dir = img.getAttribute('data-room-img') === 'right' ? 1 : -1;
        const bits = text.querySelectorAll('.room__num, .room__title, .room__desc, .link-more');

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          scrollTrigger: { trigger: room, start: 'top 75%' }
        });
        if (prefersReduced) {
          tl.from([img, text], { opacity: 0, duration: 0.8, stagger: 0.15 });
        } else {
          tl.fromTo(img,
              { clipPath: dir < 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)', xPercent: dir * 9 },
              { clipPath: 'inset(0 0% 0 0%)', xPercent: 0, duration: 1.15, ease: 'power4.inOut' })
            .fromTo(photo, { scale: 1.14 }, { scale: 1, duration: 1.4 }, '<')
            .from(bits, { y: 28, opacity: 0, duration: 0.75, stagger: 0.09 }, '-=.75');
        }
      });
    }

    /* ---------- HORIZONTAL SCROLL GALLERY (desktop only) ----------
       Il pin è gestito da CSS position:sticky (vedi .gallery__pin), così la striscia
       resta confinata DENTRO la sezione e non può sovrapporsi alle Camere.
       GSAP qui muove solo il track in orizzontale, in base allo scroll. */
    const track = document.getElementById('galleryTrack');
    const pin = document.getElementById('galleryPin');
    const gallerySection = document.getElementById('gallery');
    const galleryHead = gallerySection ? gallerySection.querySelector('.gallery__head') : null;
    if (track && pin && gallerySection && !isMobile() && !prefersReduced) {
      const getScrollX = () => Math.max(0, track.scrollWidth - pin.clientWidth);
      /* Titolo dentro il pin: l'altezza extra della sezione (per lo scroll
         orizzontale mentre è agganciata) è solo la larghezza da scorrere. */
      const sizeSection = () => {
        gallerySection.style.height = (pin.offsetHeight + getScrollX()) + 'px';
      };
      sizeSection();
      /* Reimposta l'altezza ad ogni ricalcolo, PRIMA che ScrollTrigger misuri le posizioni */
      ScrollTrigger.addEventListener('refreshInit', sizeSection);

      /* Lo scroll orizzontale è ancorato alla SEZIONE. start = quando il pin si
         aggancia (top sezione = top schermo); end = +larghezza da scorrere. */
      const slideStart = () => Math.round(gallerySection.getBoundingClientRect().top + window.scrollY);
      const slide = gsap.fromTo(track, { x: 0 }, {
        x: () => -getScrollX(),
        ease: 'none',
        scrollTrigger: {
          trigger: gallerySection,
          start: () => slideStart(),
          end: () => slideStart() + getScrollX(),
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

    }

    /* ---------- SIPARIO FOTO (telefono): due colonne che scorrono DA SOLE ----------
       Solo marquee infinito: sinistra in su, destra in giù, fessura di luce
       fissa al centro. Nessuna animazione legata allo scroll: la pagina ci
       scorre attraverso normalmente ed Esperienze arriva sotto come sempre.
       Un set di 5 foto = 1/3 esatto della striscia → loop senza stacchi.
       In pausa quando la sezione è fuori schermo. */
    if (isMobile() && !prefersReduced) {
      const curtain = document.getElementById('curtain');
      if (curtain) {
        const trkL = curtain.querySelector('.curtain__col--left .curtain__track');
        const trkR = curtain.querySelector('.curtain__col--right .curtain__track');
        const marqL = gsap.to(trkL, { yPercent: -100 / 3, duration: 26, ease: 'none', repeat: -1 });
        const marqR = gsap.fromTo(trkR, { yPercent: -100 / 3 }, { yPercent: 0, duration: 26, ease: 'none', repeat: -1 });
        ScrollTrigger.create({
          trigger: curtain, start: 'top bottom', end: 'bottom top',
          onToggle: (self) => { marqL.paused(!self.isActive); marqR.paused(!self.isActive); }
        });

        /* RIALZO INIZIALE: mentre la banda entra in scena, il tag delle nuvole
           (Esperienze) si alza da sotto fino a COPRIRNE LA METÀ, poi restano
           agganciati così e scorrono insieme. Scrub 1:1 esatto, zero molleggi. */
        const expSec = document.querySelector('.exp');
        if (expSec) {
          curtain.classList.add('curtain--rise');
          const half = () => Math.round(curtain.querySelector('.curtain__pin').offsetHeight / 2);
          gsap.fromTo(expSec, { y: () => half() }, {
            y: 0, ease: 'none',
            scrollTrigger: {
              trigger: curtain,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
              invalidateOnRefresh: true
            }
          });
        }
      }
    }

    /* ---------- RISTORANTE: image clip reveal from bottom + text ---------- */
    gsap.utils.toArray('[data-clip-up]').forEach((el) => {
      gsap.from(el, {
        clipPath: prefersReduced ? 'inset(0% 0 0% 0)' : 'inset(100% 0 0% 0)',
        scaleY: prefersReduced ? 1 : 1.04,
        duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%' }
      });
    });

    /* ---------- WORKSHOP: foto svelata dall'alto con zoom che si assesta ---------- */
    (() => {
      const slot = document.querySelector('.workshop__media .img-slot');
      if (!slot) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.workshop__media', start: 'top 82%' } });
      tl.from(slot, {
          clipPath: prefersReduced ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
          duration: 1.15, ease: 'power4.inOut'
        })
        .from(slot.querySelector('img'), { scale: prefersReduced ? 1 : 1.15, duration: 1.4, ease: 'power3.out' }, '<');
    })();

    /* ---------- IMMAGINE FULL-BLEED "Beatilla": clip verticale al passaggio ---------- */
    gsap.from('.video .img-slot', {
      clipPath: prefersReduced ? 'inset(0 0 0 0)' : 'inset(12% 0 12% 0)',
      duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '.video', start: 'top 80%' }
    });

    /* ---------- STATS count-up ---------- */
    gsap.utils.toArray('[data-count]').forEach((el) => {
      const target = parseFloat(el.getAttribute('data-count'));
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: target, duration: 1.8, ease: 'power2.out',
            onUpdate: () => { el.textContent = Math.round(obj.val); }
          });
        }
      });
    });

    /* ---------- ESPERIENZE: staggered cards via batch() ---------- */
    gsap.set('[data-card]', { y: 50, opacity: 0 });
    ScrollTrigger.batch('[data-card]', {
      start: 'top 85%',
      onEnter: (batch) => gsap.to(batch, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power2.out', stagger: 0.15, overwrite: true
      })
    });

    /* ---------- STATS: linee divisorie che crescono, label a salire ---------- */
    if (!prefersReduced) {
      gsap.from('.stats__divider', {
        scaleY: 0, transformOrigin: 'top', duration: 1, ease: 'power3.out', stagger: 0.15,
        scrollTrigger: { trigger: '.stats', start: 'top 80%' }
      });
      gsap.from('.stat__label', {
        y: 16, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.12, delay: 0.25,
        scrollTrigger: { trigger: '.stats', start: 'top 80%' }
      });
    }

    /* ---------- SERVIZI: le icone "sbocciano" dentro le card ---------- */
    if (!prefersReduced) {
      ScrollTrigger.batch('.service__icon', {
        start: 'top 90%',
        onEnter: (batch) => gsap.fromTo(batch,
          { scale: 0.3, rotation: -12, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)', stagger: 0.07, overwrite: true })
      });
    }

    /* ---------- FAQ: le domande entrano una dopo l'altra ---------- */
    gsap.set('.faq__item', { y: 26, opacity: 0 });
    ScrollTrigger.batch('.faq__item', {
      start: 'top 90%',
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.07, overwrite: true })
    });

    /* ---------- COME RAGGIUNGERCI: mappa svelata, percorsi e distanze in sequenza ---------- */
    gsap.from('.gethere__map', {
      clipPath: prefersReduced ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
      duration: 1.2, ease: 'power4.inOut',
      scrollTrigger: { trigger: '.gethere__map', start: 'top 85%' }
    });
    gsap.set('.route, .gethere__tip', { y: 30, opacity: 0 });
    ScrollTrigger.batch('.route, .gethere__tip', {
      start: 'top 90%',
      onEnter: (batch) => gsap.to(batch, { y: 0, opacity: 1, duration: 0.75, ease: 'power2.out', stagger: 0.1, overwrite: true })
    });
    gsap.from('.distances__title', {
      y: 22, opacity: 0, duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: '.distances', start: 'top 90%' }
    });
    gsap.set('.distances__item', { x: 28, opacity: 0 });
    ScrollTrigger.batch('.distances__item', {
      start: 'top 94%',
      onEnter: (batch) => gsap.to(batch, { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.07, overwrite: true })
    });

    /* ---------- TESTIMONIANZE: il blocco sale dolcemente ---------- */
    gsap.from('.testi__viewport, .testi__dots', {
      y: 30, opacity: 0, duration: 0.9, ease: 'power2.out', stagger: 0.15,
      scrollTrigger: { trigger: '.testi', start: 'top 78%' }
    });

    /* ---------- CONTATTI: righe info e campi del form in cascata ---------- */
    gsap.from('.contact__row, .contact__social', {
      y: 24, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08,
      scrollTrigger: { trigger: '#prenota', start: 'top 62%' }
    });
    gsap.from('.contact__right .field, .contact__right .form__submit', {
      y: 24, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08,
      scrollTrigger: { trigger: '#prenota', start: 'top 62%' }
    });

    /* ---------- BOOK-FAB (mobile): il bottone Prenota sboccia dopo l'hero ---------- */
    (() => {
      const fab = document.querySelector('.book-fab');
      if (!fab || !isMobile() || prefersReduced) return;
      gsap.fromTo(fab,
        { scale: 0, rotation: -8, opacity: 0, transition: 'none' },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: 'back.out(2)', delay: 1.2,
          onComplete() { gsap.set(fab, { clearProps: 'all' }); } });
    })();

    /* ---------- SERVIZI: mostra solo i primi, espandi il resto ---------- */
    (() => {
      const grid = document.getElementById('servicesGrid');
      const btn = document.getElementById('servicesToggle');
      if (!grid || !btn) return;
      const VISIBLE = 6;
      const services = Array.from(grid.querySelectorAll('.service'));
      const extras = services.slice(VISIBLE);
      if (extras.length === 0) { btn.parentElement.remove(); return; }
      extras.forEach((s) => s.classList.add('service--extra'));
      grid.classList.add('is-collapsed');
      const label = btn.querySelector('.services__toggle-label');
      btn.addEventListener('click', () => {
        const collapsed = grid.classList.toggle('is-collapsed');
        btn.setAttribute('aria-expanded', String(!collapsed));
        label.textContent = collapsed ? 'Tutti i servizi' : 'Mostra meno';
        if (!collapsed && !prefersReduced) {
          gsap.fromTo(extras, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05, overwrite: true });
        }
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
      });
    })();

    /* ---------- CONTACT panels slide in from opposite sides ---------- */
    gsap.utils.toArray('[data-slide]').forEach((el) => {
      const fromLeft = el.getAttribute('data-slide') === 'left';
      gsap.from(el, {
        xPercent: prefersReduced ? 0 : (fromLeft ? -12 : 12),
        opacity: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: '#prenota', start: 'top 75%' }
      });
    });

    /* ---------- SCROLL PROGRESS BAR ---------- */
    gsap.to('#scrollProgress', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
    });

    /* ---------- HEADING WORD REVEAL ---------- */
    const splitWords = (el) => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      const spans = [];
      words.forEach((w, i) => {
        const mask = document.createElement('span');
        mask.className = 'w-mask';
        const word = document.createElement('span');
        word.className = 'w-word';
        word.textContent = w;
        mask.appendChild(word);
        el.appendChild(mask);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
        spans.push(word);
      });
      return spans;
    };
    document.querySelectorAll('[data-words]').forEach((h) => {
      const words = splitWords(h);
      gsap.from(words, {
        yPercent: 115,
        duration: 1.0, ease: 'power3.out', stagger: 0.07,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });

    /* ---------- INNER-IMAGE PARALLAX (depth) ---------- */
    gsap.utils.toArray('[data-img-parallax]').forEach((img) => {
      if (prefersReduced || isMobile()) return; /* su telefono niente drift interno: evita scatti e blocchi durante lo scroll */
      if (img.closest('.room__media, .workshop__media')) return; /* camere e workshop restano interi: niente drift verticale che li ritaglierebbe */
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---------- GALLERY IMAGE DRIFT (solo desktop: su mobile basta lo scrub del pin) ---------- */
    if (!prefersReduced && !isMobile()) {
      gsap.utils.toArray('.gallery__item img').forEach((img) => {
        gsap.fromTo(img, { scale: 1.12 }, {
          scale: 1, ease: 'none',
          scrollTrigger: { trigger: '#galleryPin', start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    }

    /* ---------- PULL-QUOTE REVEAL ---------- */
    gsap.utils.toArray('.pullquote').forEach((q) => {
      gsap.from(q, {
        clipPath: prefersReduced ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
        duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: q, start: 'top 85%' }
      });
    });

    /* ---------- FOOTER REVEAL ---------- */
    gsap.from('.footer__inner', {
      y: 30, opacity: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: '.footer', start: 'top 92%' }
    });

    /* ---------- ART STUDIO: PENNELLATA BLU ----------
       Appare come una vera verniciatura: tre mani successive.
       Ogni mano è un fronte che attraversa l'immagine (destra, poi
       ritorno, poi ancora destra) e ne aumenta la copertura di 1/3,
       come passate di pennello che caricano il colore. */
    const stroke = document.querySelector('.workshop__stroke');
    if (stroke && !prefersReduced) {
      const mani = [0, 1 / 3, 2 / 3, 1];
      /* il fronte corre da -8 a 108 così a inizio mano la sfumatura
         è tutta fuori dall'immagine e non lascia scie sul bordo */
      const st = { mano: 0, x: -8 };
      const dipingi = () => {
        const versoDx = st.mano % 2 === 0;
        const dietro = mani[st.mano + 1], davanti = mani[st.mano];
        const m = `linear-gradient(${versoDx ? 90 : 270}deg,` +
          ` rgba(0,0,0,${dietro}) ${st.x - 8}%,` +
          ` rgba(0,0,0,${davanti}) ${st.x + 8}%)`;
        stroke.style.webkitMaskImage = m;
        stroke.style.maskImage = m;
      };
      dipingi(); /* parte invisibile */
      const tl = gsap.timeline({ paused: true });
      for (let c = 0; c < 3; c++) {
        tl.set(st, { mano: c, x: -8 }, c === 0 ? 0 : '>+.14')
          .to(st, { x: 108, duration: .6, ease: 'power2.inOut', onUpdate: dipingi });
      }
      ScrollTrigger.create({ trigger: stroke, start: 'top 85%', once: true, onEnter: () => tl.play() });
    }

    /* Il cerchio dorato dietro il testo della Residency resta fisso, senza animazione. */

    /* ---------- FOGLIE CHE CADONO ----------
       Ogni pochi secondi una foglia si stacca dalla CIMA della pagina e
       scende oscillando fino al fondo del sito. Tutto in coordinate di
       documento, non di schermo: anche se si sta leggendo a metà pagina,
       le foglie partono comunque dall'inizio del sito e passano davanti
       solo quando arrivano a quell'altezza. */
    if (!prefersReduced) {
      const FOGLIE = ['img/foglia-1.webp', 'img/foglia-2.webp', 'img/foglia-3.webp', 'img/foglia-4.webp', 'img/foglia-5.webp'];
      const cielo = document.createElement('div');
      cielo.className = 'leaves';
      cielo.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cielo);
      const MAX_FOGLIE = 14; /* tetto di sicurezza: mai più di così in volo */

      /* le foglie si fermano sul mucchio al bordo dei contatti, non oltre */
      const suolo = () => {
        const c = document.getElementById('prenota');
        return c ? c.getBoundingClientRect().top + window.scrollY
                 : document.documentElement.scrollHeight;
      };

      const cadi = (partenzaY) => {
        const vw = window.innerWidth || screen.width || 375;
        const img = document.createElement('img');
        img.src = FOGLIE[(Math.random() * FOGLIE.length) | 0];
        img.alt = '';
        const size = 26 + Math.random() * 20;
        img.style.width = size + 'px';
        cielo.appendChild(img);
        const amp = 26 + Math.random() * 40;   /* ampiezza dell'oscillazione */
        const x0 = amp / 2 + Math.random() * Math.max(40, vw - amp - size * 2);
        const fine = suolo() - size * 1.3;     /* atterra sulla cresta del mucchio (il file ha una cornice di bagliore attorno al corpo) */
        const y0 = partenzaY !== undefined ? partenzaY : -70;
        const velocita = 150 + Math.random() * 70; /* px/s: né lenta né veloce */
        gsap.set(img, { x: x0, y: y0, rotation: Math.random() * 360, scaleX: Math.random() < .5 ? -1 : 1 });
        gsap.to(img, {
          y: fine, duration: Math.max(1, (fine - y0) / velocita), ease: 'none',
          onComplete: () => {
            gsap.killTweensOf(img);
            gsap.to(img, { opacity: 0, duration: .8, onComplete: () => img.remove() });
          }
        });
        gsap.to(img, { x: x0 + amp, duration: 1.7 + Math.random() * 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.to(img, { rotation: `+=${34 + Math.random() * 40}`, duration: 2.1 + Math.random() * 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      };

      /* all'arrivo il cielo è già in moto: qualche foglia sparsa lungo la pagina,
         come se cadessero da un po' */
      window.addEventListener('load', () => setTimeout(() => {
        const limite = suolo();
        for (let i = 0; i < 6; i++) cadi(Math.random() * limite * .8);
      }, 400));

      const goccia = () => {
        if (cielo.childElementCount < MAX_FOGLIE) cadi();
        setTimeout(goccia, 2600 + Math.random() * 2800); /* ogni tot secondi */
      };
      setTimeout(goccia, 1500);
    }

    /* Recalculate on resize / after images load for pinned/scrub triggers.
       Dopo il refresh riporto sempre la pagina in cima: così un reload riparte dall'hero col video,
       non da metà pagina (es. le Camere). Gestisco anche il ritorno dalla bfcache con "pageshow". */
    const toTop = () => { if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0); };
    window.addEventListener('load', () => { ScrollTrigger.refresh(); toTop(); });
    window.addEventListener('pageshow', toTop);
    /* PERF telefono: prima OGNI immagine lazy caricata scatenava un
       ScrollTrigger.refresh() completo (decine di ricalcoli pesanti proprio
       mentre si scrolla → pagina che si "blocca"). Ora i caricamenti vengono
       raggruppati in UN solo refresh, quando sono fermi da 300ms. */
    let imgRefreshT;
    const queueImgRefresh = () => {
      clearTimeout(imgRefreshT);
      imgRefreshT = setTimeout(() => ScrollTrigger.refresh(), 300);
    };
    document.querySelectorAll('img').forEach((img) => {
      if (!img.complete) img.addEventListener('load', queueImgRefresh, { once: true });
    });
    /* I font (Cormorant/Jost) caricano in "swap": quando arrivano cambiano l'altezza dei titoli
       e spostano tutte le sezioni. Senza questo refresh il pin della galleria resta calcolato
       sulla posizione vecchia e si sovrappone alle Camere. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
    const heroVid = document.querySelector('.hero__video video');
    if (heroVid) heroVid.addEventListener('loadeddata', () => ScrollTrigger.refresh(), { once: true });
  })();

  /* ---------- CUSTOM CURSOR (foglia) ---------- */
  (() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const leaf = document.createElement('div'); leaf.className = 'cursor-leaf';
    leaf.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16Z" fill="#7A6A52"/><path d="M5.5 18.5C9 13 13.5 9 19.5 6" stroke="#FAF8F4" stroke-width="1.2" stroke-linecap="round"/></svg>';
    document.body.append(dot, leaf);
    document.body.classList.add('has-cursor');
    const interactive = 'a, button, [role="button"], input, textarea, select, .service, .exp__card, .visit__card, .press__item';
    let mx = 0, my = 0, lx = 0, ly = 0, rot = 0;
    const ease = reduce ? 1 : 0.16;
    const show = () => { dot.style.opacity = '1'; leaf.style.opacity = '1'; };
    const hide = () => { dot.style.opacity = '0'; leaf.style.opacity = '0'; };
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      show();
    });
    const loop = () => {
      const dx = mx - lx, dy = my - ly;
      lx += dx * ease; ly += dy * ease;
      const target = Math.max(-26, Math.min(26, dx * 1.4));
      rot += (target - rot) * (reduce ? 1 : 0.12);
      leaf.style.left = lx + 'px'; leaf.style.top = ly + 'px';
      leaf.style.transform = 'translate(-50%, -50%) rotate(' + rot.toFixed(2) + 'deg)';
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener('mouseover', (e) => { if (e.target.closest(interactive)) leaf.classList.add('is-hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest(interactive)) leaf.classList.remove('is-hover'); });
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) hide(); });
    document.addEventListener('mouseover', show);
    window.addEventListener('blur', hide);
  })();
