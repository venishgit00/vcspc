/* ============================================================
   A Birthday Under the Stars — animations
   GSAP + ScrollTrigger + ScrollSmoother + SplitText
   preloader · smooth scroll · hero cascade · word reveal ·
   wishes (pinned horizontal) · interlude · timeline scrub ·
   letter (pinned) · balloons · fireworks · music disc
   ============================================================ */
(() => {
  "use strict";

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------
     0 · SMOOTH SCROLLING
  ------------------------------------------------------------ */
  let smoother = null;
  if (!reduceMotion) {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 0.8,
      effects: true,
      smoothTouch: 0.1,
    });
  }

  /* ------------------------------------------------------------
     1 · STARFIELD  (fixed canvas behind everything)
  ------------------------------------------------------------ */
  const canvas  = $("#stars");
  const ctx     = canvas.getContext("2d");
  let stars = [], W = 0, H = 0, dpr = 1;

  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeStars() {
    const count = Math.floor((W * H) / 2600);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      base: Math.random() * 0.5 + 0.35,
      tw: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005,
      gold: Math.random() > 0.82,
    }));
  }

  let shooting = [];
  function spawnShootingStar() {
    const fromLeft = Math.random() > 0.5;
    shooting.push({
      x: fromLeft ? -60 : W + 60,
      y: Math.random() * H * 0.45,
      vx: (fromLeft ? 1 : -1) * (Math.random() * 7 + 5),
      vy: Math.random() * 3 + 2,
      life: 1,
    });
  }

  function drawStars(t) {
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      const a = s.base + Math.sin(t * s.speed + s.tw) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.gold
        ? `rgba(247, 224, 166, ${Math.max(0, a)})`
        : `rgba(226, 226, 250, ${Math.max(0, a)})`;
      ctx.fill();
    }

    for (let i = shooting.length - 1; i >= 0; i--) {
      const m = shooting[i];
      m.x += m.vx; m.y += m.vy; m.life -= 0.012;
      const tailX = m.x - m.vx * 9, tailY = m.y - m.vy * 9;
      const g = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
      g.addColorStop(0, `rgba(247, 224, 166, ${Math.max(0, m.life)})`);
      g.addColorStop(1, "rgba(247, 224, 166, 0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      if (m.life <= 0) shooting.splice(i, 1);
    }
  }

  function animate(t) {
    drawStars(t / 1000);
    requestAnimationFrame(animate);
  }

  sizeCanvas();
  makeStars();
  if (!reduceMotion) {
    requestAnimationFrame(animate);
    setInterval(spawnShootingStar, 4200 + Math.random() * 2500);
    gsap.ticker.lagSmoothing(500, 33);
  } else {
    drawStars(0);
  }
  window.addEventListener("resize", () => { sizeCanvas(); makeStars(); });

  /* ------------------------------------------------------------
     2 · CURSOR / FINGER SPARKLE TRAIL
  ------------------------------------------------------------ */
  if (!reduceMotion) {
    let last = 0;
    const spawn = (x, y, big) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const el = document.createElement("span");
      el.className = big ? "cursor-spark touch-spark" : "cursor-spark";
      el.style.left = x + "px";
      el.style.top  = y + "px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 800);
    };

    if (window.matchMedia("(pointer: fine)").matches) {
      document.addEventListener("mousemove", (e) => spawn(e.clientX, e.clientY, false));
    } else {
      document.addEventListener("touchstart", (e) => {
        for (const t of e.changedTouches) spawn(t.clientX, t.clientY, true);
      }, { passive: true });
      document.addEventListener("touchmove", (e) => {
        for (const t of e.changedTouches) spawn(t.clientX, t.clientY, false);
      }, { passive: true });
    }
  }

  /* ------------------------------------------------------------
     3 · FIREFLIES — soft drifting lights
  ------------------------------------------------------------ */
  const fliesEl = $("#fireflies");
  if (!reduceMotion && fliesEl) {
    for (let i = 0; i < 14; i++) {
      const f = document.createElement("span");
      f.className = "firefly";
      const s = gsap.utils.random(3, 6);
      f.style.width = f.style.height = s + "px";
      fliesEl.appendChild(f);
      gsap.set(f, {
        x: gsap.utils.random(0, window.innerWidth),
        y: gsap.utils.random(0, window.innerHeight),
        opacity: 0,
      });
      gsap.to(f, {
        x: "+=" + gsap.utils.random(-160, 160),
        y: "+=" + gsap.utils.random(-160, 160),
        opacity: gsap.utils.random(0.25, 0.85),
        duration: gsap.utils.random(3.5, 8),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: gsap.utils.random(0, 3),
      });
    }
  }

  /* ------------------------------------------------------------
     4 · HERO SPARKLE PARTICLES
  ------------------------------------------------------------ */
  const hero = $("#hero");
  const sparklePool = $("#heroSparkles");
  const SPARK_SYMBOLS = ["✦", "✧", "⋆", "·"];
  let sparkleInterval = null;

  function spawnSparkle() {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = SPARK_SYMBOLS[Math.floor(Math.random() * SPARK_SYMBOLS.length)];
    s.style.left = Math.random() * 100 + "%";
    s.style.bottom = "-30px";
    s.style.fontSize = (8 + Math.random() * 10) + "px";
    const dur = 5 + Math.random() * 6;
    s.style.animationDuration = dur + "s";
    sparklePool.appendChild(s);
    setTimeout(() => s.remove(), dur * 1000);
  }

  ScrollTrigger.create({
    trigger: hero,
    start: "top top",
    end: "bottom top",
    onEnter: () => { sparkleInterval = setInterval(spawnSparkle, 650); },
    onLeaveBack: () => {},
    onLeave: () => clearInterval(sparkleInterval),
  });
  if (!sparkleInterval) spawnSparkle();

  /* ------------------------------------------------------------
     5 · PRELOADER → HERO ENTRANCE
  ------------------------------------------------------------ */
  let heroTL = null;
  let titleChars = null;

  if (!reduceMotion) {
    titleChars = new SplitText("#heroTitle", { type: "chars" }).chars;
    gsap.set(titleChars, { willChange: "transform" });

    heroTL = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    heroTL
      .to('[data-hero="eyebrow"]', { opacity: 1, duration: 1.1 }, 0.1)
      .from(titleChars, { yPercent: 115, duration: 1.3, stagger: 0.04, ease: "power4.out" }, 0.3)
      .to('[data-hero="sub"]', { opacity: 1, duration: 1.2 }, 1)
      .to(".hero-hint", { opacity: 1, duration: 1 }, 1.2)
      .to("#scrollCue", { opacity: 1, duration: 1 }, 1.4)
      .from("#moon", { y: -80, opacity: 0, duration: 1.6, ease: "power2.out" }, 0.5);
  } else {
    gsap.set(
      "[data-hero='eyebrow'], [data-hero='sub'], .hero-hint, #scrollCue, #moon",
      { opacity: 1 }
    );
  }

  const preloader = $("#preloader");
  const preTL = gsap.timeline({
    onComplete: () => {
      preloader.classList.add("done");
      if (heroTL) heroTL.play();
      else preloader.remove();
    },
  });
  preTL
    .fromTo(".preloader-star",
      { scale: 0.3, opacity: 0, rotation: -120 },
      { scale: 1.1, opacity: 1, rotation: 40, duration: 1, ease: "power3.out" })
    .to(".preloader-star", { scale: 1, rotation: 400, duration: 1.1, ease: "power1.inOut" }, "-=0.4")
    .fromTo(".preloader-text", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.5")
    .to(".preloader", { opacity: 0, duration: 0.7, ease: "power2.inOut" }, "+=0.2");

  /* Hero parallax + fade on scroll */
  gsap.to("#heroContent", {
    yPercent: -24,
    opacity: 0.12,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "80% top", scrub: true },
  });
  gsap.to("#moon", {
    y: 140,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "top top", end: "100% top", scrub: true },
  });
  gsap.to("#scrollCue", {
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: hero, start: "10% top", end: "45% top", scrub: true },
  });

  /* Smooth nav clicks */
  const navLinks = $$(".nav-links a");
  if (smoother) {
    $(".nav-links").addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) {
        e.preventDefault();
        smoother.scrollTo(a.getAttribute("href"), true, "top 90px");
      }
    });
  }

  /* Nav background + progress bar */
  ScrollTrigger.create({
    start: 40,
    onUpdate: (self) => $("#nav").classList.toggle("scrolled", self.scroll() > 40),
  });
  gsap.to("#progressBar", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.15 },
  });

  /* Active nav link */
  navLinks.forEach((link) => {
    const target = $(link.getAttribute("href"));
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => {
        navLinks.forEach((l) => l.classList.remove("active"));
        if (self.isActive) link.classList.add("active");
      },
    });
  });

  /* ------------------------------------------------------------
     6 · INTRO QUOTE — words light up as you scroll (scrubbed)
  ------------------------------------------------------------ */
  if (!reduceMotion) {
    $$(".quote-main").forEach((line) => {
      const split = new SplitText(line, { type: "words" });
      const targetColor = line.classList.contains("accent")
        ? "rgba(233, 201, 126, 1)"
        : "rgba(233, 230, 246, 1)";
      gsap.fromTo(split.words,
        { opacity: 0.08, color: "rgba(233, 230, 246, 0.3)" },
        {
          opacity: 1,
          color: targetColor,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: line,
            start: "top 86%",
            end: "top 38%",
            scrub: true,
          },
        }
      );
    });
  } else {
    gsap.set(".quote-main", { opacity: 1 });
  }

  gsap.from(".intro-sign", {
    opacity: 0, y: 20, duration: 1, delay: 0.2, ease: "power2.out",
    scrollTrigger: { trigger: ".intro-sign", start: "top 92%" },
  });

  /* ------------------------------------------------------------
     7 · SECTION HEADS
  ------------------------------------------------------------ */
  $$(".section-head").forEach((head) => {
    gsap.from(head, {
      y: 46, opacity: 0, duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: head, start: "top 84%", toggleActions: "play none none reverse" },
    });
  });

  /* ------------------------------------------------------------
     8 · REASONS — a constellation that draws itself
  ------------------------------------------------------------ */
  const cstField  = $("#constellation");
  const cstLine   = $("#cstLine");
  const cstGlow   = $("#cstGlow");
  const cstWalker = $("#cstWalker");
  const cstNodes  = $$("[data-cst]");
  const cstPaths  = [cstLine, cstGlow].filter(Boolean);

  /* below 700px the star map keeps its desktop shape and is pinned and read
     sideways instead of downward, so nothing has to shrink to squeeze it in */
  const cstSideways = !!window.matchMedia("(max-width: 700px)").matches;
  const cstStage    = $(".cst-stage");
  const cstFrame    = $(".cst-viewport");
  const getCstDist  = () =>
    cstStage && cstFrame ? Math.max(0, cstStage.offsetWidth - cstFrame.clientWidth) : 0;
  const cstEnd      = () => "+=" + Math.max(1, getCstDist());

  let cstLen = 0;
  let cstMeasured = false;

  function smoothPath(pts) {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function buildConstellation() {
    if (!cstField || !cstLine || !cstNodes.length) return;
    /* measure against the stage, not the section: on phones the stage is what
       travels, and dot-minus-stage stays correct whatever it is translated to */
    const box = (cstStage || cstField).getBoundingClientRect();
    if (!box.width || !box.height) return;

    /* measure every star, then stitch a smooth curve through them */
    const pts = cstNodes.map((node) => {
      const dot = node.querySelector(".cst-dot").getBoundingClientRect();
      return { x: dot.left + dot.width / 2 - box.left, y: dot.top + dot.height / 2 - box.top };
    });

    const d = smoothPath(pts);
    cstLine.parentNode.setAttribute("viewBox", `0 0 ${box.width.toFixed(1)} ${box.height.toFixed(1)}`);
    cstPaths.forEach((p) => p.setAttribute("d", d));

    try {
      cstLen = cstLine.getTotalLength();
    } catch (err) {
      cstLen = 0;
      return;
    }

    cstPaths.forEach((p) => {
      p.style.strokeDasharray = cstLen;
      /* only seed the hidden state once — after that the timeline owns it,
         so a refresh can never strand a scrolled-past line in mid-draw */
      if (!cstMeasured || reduceMotion) p.style.strokeDashoffset = reduceMotion ? 0 : cstLen;
    });
    cstMeasured = true;
  }

  if (cstField && cstLine && cstNodes.length) {
    /* scattered background stars */
    for (let i = 0; i < 30; i++) {
      const s = document.createElement("span");
      s.className = "cst-field-star";
      const size = gsap.utils.random(1.2, 3.2);
      s.style.left = gsap.utils.random(0, 100).toFixed(2) + "%";
      s.style.top = gsap.utils.random(0, 100).toFixed(2) + "%";
      s.style.width = s.style.height = size.toFixed(1) + "px";
      s.style.animationDuration = gsap.utils.random(2.4, 6).toFixed(2) + "s";
      s.style.animationDelay = (-gsap.utils.random(0, 6)).toFixed(2) + "s";
      cstField.appendChild(s);
    }

    buildConstellation();

    const cstOrbs = cstNodes.map((n) => n.querySelector(".cst-orb"));
    const cstLabels = cstNodes.map((n) => n.querySelector(".cst-label"));

    /* Where along the drawn line each star actually sits. The spark walks the
       path in step with progress, so a star's own fraction of the path IS the
       moment the spark reaches it — that is the only anchor that keeps the
       copy and the star honest to each other on every screen size. Measured by
       walking the path, not guessed from x position, because a node's dot can
       sit anywhere along --dx inside its own column. */
    const cstStopAt = (i) => {
      if (!cstLen) return 1;
      const node = cstNodes[i];
      const dot = node && node.querySelector(".cst-dot");
      if (!dot) return 1;
      const box = (cstStage || cstField).getBoundingClientRect();
      const d = dot.getBoundingClientRect();
      const tx = d.left + d.width / 2 - box.left;
      const ty = d.top + d.height / 2 - box.top;
      /* coarse sweep, then a short binary refine — getPointAtLength is not
         monotonic in x, so a plain ratio guess can land on the wrong pass */
      let best = 0, bestD = Infinity;
      for (let k = 0; k <= 60; k++) {
        const f = k / 60;
        const p = cstLine.getPointAtLength(cstLen * f);
        const dd = (p.x - tx) * (p.x - tx) + (p.y - ty) * (p.y - ty);
        if (dd < bestD) { bestD = dd; best = f; }
      }
      let lo = Math.max(0, best - 1 / 60), hi = Math.min(1, best + 1 / 60);
      for (let k = 0; k < 18; k++) {
        const mid = (lo + hi) / 2;
        const pm = cstLine.getPointAtLength(cstLen * mid);
        const dl = (pm.x - tx) * (pm.x - tx) + (pm.y - ty) * (pm.y - ty);
        const pl = cstLine.getPointAtLength(cstLen * lo);
        const d0 = (pl.x - tx) * (pl.x - tx) + (pl.y - ty) * (pl.y - ty);
        if (dl < d0) hi = mid; else lo = mid;
      }
      return Math.min(1, Math.max(0, (lo + hi) / 2));
    };

    /* Where each star sits along the line. This is pure geometry: the path and
       the star positions only move when the layout does, so measuring it on
       every frame meant ~470 getPointAtLength calls (each one a forced layout
       read) per frame just to recompute a value that had not changed. Caching
       it on refresh is what removes that stutter; only the progress-driven
       opacity/scale below still runs per frame. */
    let cstStops = [];

    /* Each star lights up as the spark arrives at it. The distance and the
       arrival point are re-read every frame, so rotating the phone or resizing
       re-times the whole reveal to the new geometry instead of keeping
       positions that were baked in at load. The pop completes slightly BEFORE
       the spark lands, so the copy is already readable the instant it arrives
       rather than fading in underneath it. */
    const revealOnArrival = (self) => {
      /* cstLen is the real gate: on desktop the stage never travels, so the
         travel distance is legitimately 0 and must NOT skip the reveal. */
      if (!cstLen) return;

      const POP = 0.06; /* a star lands over 6% of the journey, not 6 seconds */

      for (let i = 0; i < cstNodes.length; i++) {
        const orb = cstOrbs[i], label = cstLabels[i];
        if (!orb || !label) continue;

        const arrive = cstStops[i];
        if (arrive === undefined) continue;
        /* finish the reveal just ahead of the spark */
        const t = Math.min(1, Math.max(0, (self.progress - (arrive - POP)) / POP));
        const pop = t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);

        gsap.set(orb, { scale: pop, opacity: t });
        gsap.set(label, { opacity: t, y: 26 * (1 - t) });
      }
    };

    if (!reduceMotion) {
      const cstRange = cstSideways
        ? { trigger: "#reasons", start: "top top", end: cstEnd, pin: true, anticipatePin: 1 }
        : { trigger: "#reasons", start: "top 74%", end: "bottom 70%" };

      /* The spark rides the line, so it has to be moved by the SAME smoothed value
         that draws the line. It used to sit on its own scrub:true trigger,
         which applies no smoothing at all — the spark therefore jumped to raw
         scroll position while the line it was travelling along eased, and the
         two visibly juddered against each other. */
      let sparkP = 0;
      const moveSpark = () => {
        if (!cstWalker || !cstLen) return;
        const pt = cstLine.getPointAtLength(cstLen * sparkP);
        cstWalker.style.transform = `translate(${pt.x}px, ${pt.y}px) translate(-50%, -50%)`;
      };

      /* measure the arrival points once per layout, not once per frame */
      const measureStops = () => {
        buildConstellation();
        cstStops = cstNodes.map((_, i) => cstStopAt(i));
      };
      measureStops();

      /* Everything reads this one scrubbed playhead. It used to be split across
         the timeline's own trigger plus a second trigger just for the arrivals
         and the spark; two independently smoothed playheads drift against each
         other by a frame or two, which reads as judder. One playhead means the
         line, the spark, the travelling stage and the copy are all locked to
         the same eased value on the same frame. Declared before cstTL so the
         timeline's config can reference it — ScrollTrigger refreshes the moment
         it is created, which would hit a not-yet-initialised binding. */
      let cstTL = null;
      const syncPlayhead = () => {
        if (!cstTL) return;
        const p = cstTL.progress();
        sparkP = p;
        moveSpark();
        revealOnArrival({ progress: p });
      };

      cstTL = gsap.timeline({
        defaults: { ease: "none" },
        /* This has to hang off the TIMELINE, not the ScrollTrigger.
           ScrollTrigger's own onUpdate only fires on a scroll event, but with
           scrub the playhead keeps easing for a while after the finger stops —
           so driving the spark and the copy from onUpdate updated them in
           discrete jumps and then froze for the rest of each ease, which is
           exactly the stutter this section had. The timeline's onUpdate fires
           on every rendered frame of that ease instead. */
        onUpdate: syncPlayhead,
        scrollTrigger: {
          ...cstRange,
          /* long enough to iron out finger jitter without the section feeling
             like it is lagging behind the scroll */
          scrub: 0.3,
          invalidateOnRefresh: true,
          /* rebuild the path and re-measure where each star sits on it, then
             repaint at the current point so a resize can't leave the stars
             blank or stuck at full brightness */
          onRefresh: () => { measureStops(); syncPlayhead(); },
        },
      });

      /* the line writes itself across the sky */
      cstTL.fromTo(cstPaths, { strokeDashoffset: () => cstLen }, { strokeDashoffset: 0, duration: 5 }, 0);

      /* The star lights as the spark reaches it, on every screen size. An
         earlier version used a fixed cascade on desktop; that lit the copy
         while the spark was still travelling to it, so the text could sit
         dark on a star the spark had not arrived at yet. Both the copy and the
         logo now wait on the same measured arrival point. */

      /* a spark of light runs the line as it draws */
      if (cstWalker) {
        cstTL.fromTo(cstWalker, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.1)
             .to(cstWalker, { opacity: 0, duration: 0.4 }, 4.8);
      }

      /* on phones the whole star map slides in from the right, paced to
         exactly the same stretch of scroll as the line drawing itself — added
         last so its duration covers the finished timeline, not a partial one */
      if (cstSideways && cstStage) {
        cstTL.to(cstStage, { x: () => -getCstDist(), ease: "none", duration: cstTL.duration() }, 0);
      }

      /* seed the hidden state so no star ever flashes in before the first
         scroll lands, and spark/line sit at the start of the journey */
      syncPlayhead();
      if (cstWalker && cstLen) {
        cstWalker.style.transform =
          `translate(${cstLine.getPointAtLength(0).x}px, ${cstLine.getPointAtLength(0).y}px) translate(-50%, -50%)`;
      }
      gsap.set(cstPaths, { strokeDashoffset: cstLen });
    } else {
      gsap.set(cstOrbs, { scale: 1, opacity: 1 });
      gsap.set(cstLabels, { opacity: 1, y: 0 });
    }
  }

  
  /* ------------------------------------------------------------
     9 · WISHES — pinned horizontal scroll
  ------------------------------------------------------------ */
  const wishesTrack = $("#wishesTrack");
  const wishesViewport = $(".wishes-viewport");

if (wishesTrack && wishesViewport && !reduceMotion) {

  const getDist = () => {
    // The track needs to travel exactly far enough for its
    // right edge to reach the right edge of the viewport.
    return Math.max(
      0,
      wishesTrack.scrollWidth - wishesViewport.clientWidth
    );
  };

  const getEnd = () => "+=" + getDist();

  /* ---- depth: each lantern dims, softens and drifts as it passes ---- */
  const wishCards = $$("[data-wish]");
  const wishLifts = wishCards.map((_, i) => (i % 2 ? 1 : -1) * 22);

  function paintWishes() {
    if (!wishCards.length) return;
    const vw = window.innerWidth;
    const infos = wishCards.map((card) => {
      const r = card.getBoundingClientRect();
      if (!r.width) return null;
      const p = gsap.utils.clamp(-1.5, 1.5, (r.left + r.width / 2 - vw / 2) / (vw / 2));
      return { p, near: 1 - Math.min(1, Math.abs(p)) };
    });
    wishCards.forEach((card, i) => {
      const info = infos[i];
      if (!info) return;
      const p = info.p, near = info.near;
      card.style.setProperty("--near", near.toFixed(3));
      if (reduceMotion) return;
      gsap.set(card, {
        opacity: 0.5 + near * 0.5,
        scale: 0.93 + near * 0.07,
        y: wishLifts[i] + p * 34,
      });
    });
  }

  /* ---- the sky drifts behind the lanterns ---- */
  const wishesSky = $("#wishesSky");
  if (wishesSky) {
    for (let i = 0; i < 46; i++) {
      const s = document.createElement("span");
      s.className = "wishes-sky-star";
      const size = gsap.utils.random(1.2, 3);
      s.style.left = gsap.utils.random(0, 100).toFixed(2) + "%";
      s.style.top = gsap.utils.random(0, 100).toFixed(2) + "%";
      s.style.width = s.style.height = size.toFixed(1) + "px";
      s.style.animationDuration = gsap.utils.random(2.6, 6.4).toFixed(2) + "s";
      s.style.animationDelay = (-gsap.utils.random(0, 6.4)).toFixed(2) + "s";
      wishesSky.appendChild(s);
    }
  }

  /* both travel tweens live in ONE timeline, so the section is pinned
     exactly once — sharing a pinned ScrollTrigger would pin it twice and
     the section would slide away as soon as you reached it */
  const wishesTL = gsap.timeline({
    defaults: { ease: "none" },

    scrollTrigger: {
      trigger: "#wishes",
      start: "top top",
      end: getEnd,

      pin: true,
      scrub: 0.5,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: paintWishes,
    },

    onUpdate: paintWishes,
  });

  wishesTL.to(wishesTrack, { x: () => -getDist(), ease: "none" }, 0);
  if (wishesSky) wishesTL.to(wishesSky, { x: () => -getDist() * 0.32, ease: "none" }, 0);

  gsap.to("#wishesProgress", {
    scaleX: 1,
    ease: "none",

    scrollTrigger: {
      trigger: "#wishes",
      start: "top top",
      end: getEnd,

      scrub: 0.5,
      invalidateOnRefresh: true,
    },
  });

  paintWishes();

  // Important when using Google Fonts and responsive layouts.
  window.addEventListener("load", () => {
    buildConstellation();
    ScrollTrigger.refresh();
    paintWishes();
  });
}

  /* ------------------------------------------------------------
     10 · INTERLUDE — giant words swell through the viewport
  ------------------------------------------------------------ */
  if (!reduceMotion) {
    $$(".interlude-text").forEach((el) => {
      gsap.timeline({
        scrollTrigger: { trigger: "#interlude", start: "top 95%", end: "bottom 20%", scrub: true },
      })
        .fromTo(el, { scale: 0.86, opacity: 0.15, y: 60 },
          { scale: 1, opacity: 1, y: 0, ease: "power1.inOut", duration: 1 })
        .to(el, { scale: 1.4, opacity: 0, y: -50, filter: "blur(10px)", ease: "power1.inOut", duration: 1 });
    });
  } else {
    gsap.set(".interlude-text", { opacity: 1 });
  }

  /* ------------------------------------------------------------
     11 · TIMELINE — growing line + scrubbed items
  ------------------------------------------------------------ */
  gsap.to("#timelineFill", {
    height: "100%",
    ease: "none",
    scrollTrigger: { trigger: ".timeline-wrap", start: "top 72%", end: "bottom 55%", scrub: 0.3 },
  });

  $$("[data-tl]").forEach((item, i) => {
    gsap.fromTo(item,
      { x: i % 2 === 0 ? -70 : 70, opacity: 0 },
      {
        x: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: item, start: "top 88%", end: "top 60%", scrub: true },
      }
    );
  });

  /* ------------------------------------------------------------
     12 · LETTER — pinned, lines write themselves as you scroll
  ------------------------------------------------------------ */
  const letterLines = $$(".letter-line, .letter-sign");
  if (!reduceMotion && letterLines.length) {
    // Short, viewport-relative pin: the letter writes itself in about
    // one scroll instead of drifting the card far below the heading.
    const letterDist = () =>
      Math.min(letterLines.length * 130, window.innerHeight * 1.1);

    gsap.fromTo(letterLines,
      { opacity: 0, y: 16 },
      {
        opacity: 1, y: 0, stagger: 0.45, ease: "none",
        scrollTrigger: {
          trigger: "#letterCard",
          start: "top 68%",
          end: () => "+=" + letterDist(),
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      }
    );
  } else {
    gsap.set(letterLines, { opacity: 1, y: 0 });
  }

  /* ------------------------------------------------------------
     13 · BLOOM — the moonflower reveal (pinned + scrubbed)
         story: a bud rises · petals unfold under the moon ·
         her photo blooms from the center · the lines speak
  ------------------------------------------------------------ */
  const bloomSection = $("#bloom");
  if (bloomSection && !reduceMotion) {
    const bloomPhoto = $("#bloomPhoto");
    const bloomDist = () => Math.max(2400, window.innerHeight * 2.4);

    const bloomTL = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#bloom",
        start: "top top",
        end: () => "+=" + bloomDist(),
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => {
          confetti({
            particleCount: 80,
            spread: 110,
            startVelocity: 26,
            gravity: 0.5,
            origin: { y: 0.55 },
            colors: ["#e9c97e", "#f7e0a6", "#f4b8c6", "#c3b5f5"],
            ticks: 200,
            scalar: 0.9,
          });
        },
      },
    });

    bloomTL
      /* the head drifts away as the bud takes the stage */
      .to(".bloom .section-head", { y: -80, opacity: 0, duration: 0.1, ease: "power2.out" }, 0)

      /* the bud rises from the night, the stem reaches up */
      .fromTo("#bloomFlower",
        { y: 210, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.13, ease: "power2.out" }, 0.04)
      .fromTo("#bloomStem",
        { scaleY: 0 },
        { scaleY: 1, duration: 0.18, ease: "power2.out" }, 0.05)

      /* petals unfold, one by one */
      .fromTo(".petal",
        { scaleY: 0.12 },
        { scaleY: 1, duration: 0.17, stagger: 0.016, ease: "back.out(1.4)" }, 0.17)

      /* the bud cover melts away, the halo breathes */
      .to("#bloomBud", { scaleY: 0.15, opacity: 0, duration: 0.1, ease: "power2.in" }, 0.34)
      .to(".bloom-halo", { opacity: 0.95, duration: 0.12 }, 0.38)

      /* and from the center of the flower — her */
      .fromTo("#bloomPhoto",
        { opacity: 0, y: 70, scale: 0.65, rotateX: -20 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.16, ease: "power2.out" }, 0.42)
      .call(() => bloomPhoto.classList.add("revealed"), [], 0.62)

      /* the words, as the scene settles */
      .fromTo(".bloom-line.l1", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.07 }, 0.62)
      .fromTo(".bloom-line.l2", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.07 }, 0.7)
      .fromTo(".bloom-line.l3", { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.09 }, 0.78);
  } else {
    gsap.set(".bloom .section-head, #bloomFlower, #bloomStem, #bloomPhoto, .bloom-line", { opacity: 1, y: 0 });
    gsap.set("#bloomBud", { opacity: 0 });
    gsap.set(".bloom-halo", { opacity: 0.8 });
  }

  /* ------------------------------------------------------------
     14 · THE QUESTION — did you like it?
         the "no" button is shy: it runs away every time
  ------------------------------------------------------------ */
  const qYes = $("#qYes");
  const qNo = $("#qNo");
  const qReply = $("#qReply");
  if (qYes && qNo) {
    const NO_LABELS = ["No", "nope 🙈", "not today 😌", "nice try 😄", "just say yes 💛", "the other one!"];
    let dodges = 0;
    const qSection = $("#question");

    const dodge = () => {
      const sr = qSection.getBoundingClientRect();
      const yr = qYes.getBoundingClientRect();
      const nRect = qNo.getBoundingClientRect();
      const ncX = nRect.left + nRect.width / 2;
      const ncY = nRect.top + nRect.height / 2;
      const noW = qNo.offsetWidth;
      const noH = qNo.offsetHeight;
      const maxX = Math.max(sr.width / 2 - noW / 2 - 12, 40);
      const maxY = Math.max(Math.min(sr.height / 2 - noH / 2 - 12, 260), 40);

      let x = 0, y = 0;
      for (let i = 0; i < 10; i++) {
        x = gsap.utils.random(-maxX, maxX);
        y = gsap.utils.random(-maxY, maxY);
        const cx = ncX + x, cy = ncY + y;
        const hitsYes = cx + noW / 2 > yr.left && cx - noW / 2 < yr.right &&
                        cy + noH / 2 > yr.top && cy - noH / 2 < yr.bottom;
        const inside = cx - noW / 2 > sr.left && cx + noW / 2 < sr.right &&
                       cy - noH / 2 > sr.top && cy + noH / 2 < sr.bottom;
        if (!hitsYes && inside) break;
      }
      gsap.to(qNo, { x, y, rotation: gsap.utils.random(-14, 14), duration: 0.25, ease: "power3.out", overwrite: "auto" });
      gsap.fromTo(qNo, { scale: 1 }, { scale: 1.12, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out" });
      qNo.textContent = NO_LABELS[dodges % NO_LABELS.length];
      dodges++;
    };

    qNo.addEventListener("pointerenter", dodge);
    qNo.addEventListener("pointerdown", (e) => { e.preventDefault(); dodge(); });
    qNo.addEventListener("touchstart", (e) => { e.preventDefault(); dodge(); }, { passive: false });
    qNo.addEventListener("click", (e) => { e.preventDefault(); dodge(); });
    qNo.addEventListener("focus", dodge);

    qYes.addEventListener("click", () => {
      qYes.textContent = "Yay! 💛";
      qYes.style.pointerEvents = "none";
      qNo.style.pointerEvents = "none";
      gsap.to(qYes, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" });
      gsap.to(qNo, { opacity: 0, scale: 0.6, rotation: 30, duration: 0.4, ease: "power2.in" });
      qReply.classList.add("show");

      const heart = confetti.shapeFromText({ text: "💛", scalar: 2 });
      confetti({
        particleCount: 70,
        spread: 120,
        startVelocity: 32,
        origin: { y: 0.6 },
        shapes: [heart],
        scalar: 2,
        ticks: 240,
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          startVelocity: 26,
          origin: { y: 0.6 },
          colors: ["#e9c97e", "#f7e0a6", "#f4b8c6"],
          ticks: 220,
        });
      }, 350);
    });

    gsap.from(".question-box > :not(.question-reply)", {
      y: 34,
      opacity: 0,
      stagger: 0.13,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: "#question", start: "top 82%", toggleActions: "play none none reverse" },
    });
  }

  /* ------------------------------------------------------------
     15 · FINALE — big title + fireworks
  ------------------------------------------------------------ */
  if (!reduceMotion) {
    const finaleSplit = new SplitText("#finaleTitle", { type: "chars" });
    gsap.from(finaleSplit.chars, {
      opacity: 0, y: 90, rotateX: -45, stagger: 0.05, duration: 1.4, ease: "power4.out",
      scrollTrigger: { trigger: "#finaleTitle", start: "top 80%", toggleActions: "play none none reverse" },
    });
  } else {
    gsap.set("#finaleTitle", { opacity: 1, y: 0 });
  }
  gsap.fromTo(".finale-line",
    { opacity: 0, y: 26 },
    {
      opacity: 1, y: 0, duration: 1, delay: 0.3,
      scrollTrigger: { trigger: "#finaleTitle", start: "top 60%", toggleActions: "play none none reverse" },
    }
  );
  gsap.fromTo(".finale-sign",
    { opacity: 0, y: 26 },
    {
      opacity: 1, y: 0, duration: 1.2, delay: 0.5,
      scrollTrigger: { trigger: "#finaleTitle", start: "top 50%", toggleActions: "play none none reverse" },
    }
  );

  /* Canvas fireworks */
  const fwCanvas = $("#fireworks");
  const fwCtx = fwCanvas.getContext("2d");
  let fwRockets = [], fwParticles = [];
  let fireworksActive = false, fwTicker = null;

  function sizeFireworks() {
    fwCanvas.width = fwCanvas.offsetWidth * dpr;
    fwCanvas.height = fwCanvas.offsetHeight * dpr;
    fwCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeFireworks();
  window.addEventListener("resize", sizeFireworks);

  const FW_COLORS = ["#f7e0a6", "#e9c97e", "#f4b8c6", "#c3b5f5", "#9fd7f0"];

  function launchRocket() {
    const x = fwCanvas.offsetWidth * (0.15 + Math.random() * 0.7);
    const targetY = fwCanvas.offsetHeight * (0.18 + Math.random() * 0.35);
    fwRockets.push({ x, y: fwCanvas.offsetHeight, targetY, vy: -(Math.random() * 3 + 4) });
  }

  function explode(x, y) {
    const count = 46 + Math.floor(Math.random() * 30);
    const color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.2;
      const sp = Math.random() * 3.2 + 1;
      fwParticles.push({
        x, y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 1,
        decay: 0.008 + Math.random() * 0.008,
        color,
      });
    }
  }

  function fireworkTick() {
    fwCtx.clearRect(0, 0, fwCanvas.offsetWidth, fwCanvas.offsetHeight);

    for (let i = fwRockets.length - 1; i >= 0; i--) {
      const r = fwRockets[i];
      r.y += r.vy;
      if (r.y <= r.targetY) {
        explode(r.x, r.y);
        fwRockets.splice(i, 1);
        continue;
      }
      fwCtx.fillStyle = "rgba(247, 224, 166, 0.9)";
      fwCtx.beginPath();
      fwCtx.arc(r.x, r.y, 2, 0, Math.PI * 2);
      fwCtx.fill();
    }

    for (let i = fwParticles.length - 1; i >= 0; i--) {
      const p = fwParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.035;
      p.life -= p.decay;
      if (p.life <= 0) { fwParticles.splice(i, 1); continue; }
      fwCtx.fillStyle = p.color;
      fwCtx.globalAlpha = Math.max(0, p.life);
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, 1.7, 0, Math.PI * 2);
      fwCtx.fill();
    }
    fwCtx.globalAlpha = 1;
  }

  function startFireworks() {
    if (fireworksActive || reduceMotion) return;
    fireworksActive = true;
    for (let i = 0; i < 3; i++) setTimeout(launchRocket, i * 320);
    fwTicker = setInterval(() => {
      if (Math.random() > 0.45) launchRocket();
    }, 900);
    gsap.ticker.add(fireworkTick);
    setTimeout(stopFireworks, 14000);
  }
  function stopFireworks() {
    fireworksActive = false;
    clearInterval(fwTicker);
    gsap.ticker.remove(fireworkTick);
    fwRockets = [];
    fwParticles = [];
    fwCtx.clearRect(0, 0, fwCanvas.offsetWidth, fwCanvas.offsetHeight);
  }

  ScrollTrigger.create({
    trigger: "#finale",
    start: "top 55%",
    onEnter: startFireworks,
  });

  /* ------------------------------------------------------------
     16 · MUSIC DISC
  ------------------------------------------------------------ */
  const disc = $("#disc");
  const audio = $("#bgMusic");
  let musicFailed = false;

  audio.addEventListener("error", () => {
    musicFailed = true;
    disc.classList.add("paused");
  });

  function toggleMusic() {
    if (musicFailed) {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { x: 0.85, y: 0.9 },
        colors: ["#e9c97e", "#f7e0a6", "#f4b8c6"],
      });
      return;
    }
    if (audio.paused) {
      audio.play().then(() => {
        disc.classList.add("playing");
        disc.classList.remove("paused");
      }).catch(() => {});
    } else {
      audio.pause();
      disc.classList.remove("playing");
      disc.classList.add("paused");
    }
  }

  disc.addEventListener("click", toggleMusic);
  disc.classList.add("paused");

  /* ------------------------------------------------------------
     17 · Breathe life into everything
  ------------------------------------------------------------ */
  gsap.from(".nav", { y: -40, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });

  ScrollTrigger.refresh();
})();
