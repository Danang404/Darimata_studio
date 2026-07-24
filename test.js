
    gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin, SplitText, Draggable);

    // 1. SVG Shape Overlays
    let overlay = document.querySelector(".shape-overlays");
    let paths = document.querySelectorAll(".shape-overlays__path");
    let numPoints = 10;
    let numPaths = paths.length;
    let delayPointsMax = 0.3;
    let delayPerPath = 0.25;
    let isOpened = true; // Start covering the screen
    let pointsDelay = [];
    let allPoints = [];
    
    let shapeTl = gsap.timeline({ onUpdate: renderShape, defaults: { ease: "power2.inOut", duration: 0.9 }});
    for (let i = 0; i < numPaths; i++) {
      let points = [];
      allPoints.push(points);
      for (let j = 0; j < numPoints; j++) { points.push(100); }
    }

    function toggleShape() {
      shapeTl.progress(0).clear();
      for (let i = 0; i < numPoints; i++) { pointsDelay[i] = Math.random() * delayPointsMax; }
      for (let i = 0; i < numPaths; i++) {
        let points = allPoints[i];
        let pathDelay = delayPerPath * (isOpened ? i : (numPaths - i - 1));
        for (let j = 0; j < numPoints; j++) {
          let delay = pointsDelay[j];
          shapeTl.to(points, { [j]: 0 }, delay + pathDelay);
        }
      }
    }

    function renderShape() {
      for (let i = 0; i < numPaths; i++) {
        let path = paths[i];
        let points = allPoints[i];
        let d = "";
        d += isOpened ? `M 0 0 V ${points[0]} C` : `M 0 ${points[0]} C`;
        for (let j = 0; j < numPoints - 1; j++) {
          let p = (j + 1) / (numPoints - 1) * 100;
          let cp = p - (1 / (numPoints - 1) * 100) / 2;
          d += ` ${cp} ${points[j]} ${cp} ${points[j+1]} ${p} ${points[j+1]}`;
        }
        d += isOpened ? ` V 100 H 0` : ` V 0 H 0`;
        path.setAttribute("d", d)
      }
    }
    
    window.addEventListener('load', () => {
        isOpened = false; 
        toggleShape();
        setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 2000);
    });

    // 2. Menu Navigation (Interruptible)
    let isOpenMenu = false;
    let exitSpeed = 1.5;
    let menuTl;
    let enterEndTime = 0;

    function initMenu() {
      menuTl && menuTl.revert();
      gsap.set("#nav", { visibility: "hidden" });
      gsap.set(".nav-bg", { opacity: 0 });
      menuTl = gsap.timeline({ paused: true })
        .set("#nav", { visibility: "visible", pointerEvents: "auto" })
        .to(".nav-bg", { opacity: 1, duration: 0.4, ease: "power2.out" }, 0)
        .fromTo(".nav-panel", { x: "110%", y: 0, rotation: 0 }, { x: "0%", y: 0, duration: 0.6, ease: "back.out", stagger: 0.1 }, 0)
        .fromTo(".nav-item", { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 1.2, ease: "expo.out", stagger: 0.03 }, 0.1)
        .fromTo(".bar-top", { stroke: "var(--white)", attr: { x1: 3, y1: 7, x2: 17, y2: 7 } }, { stroke: "#0e100f", attr: { x1: 5, y1: 5, x2: 15, y2: 15 }, duration: 0.35, ease: "back.out(1.4)" }, 0.06)
        .fromTo(".bar-bot", { stroke: "var(--white)", attr: { x1: 3, y1: 13, x2: 17, y2: 13 } }, { stroke: "#0e100f", attr: { x1: 15, y1: 5, x2: 5, y2: 15 }, duration: 0.35, ease: "back.out(1.4)" }, 0.06)
        .addPause();
      enterEndTime = menuTl.duration();
      menuTl
        .to(".bar", { stroke: "var(--white)", duration: 0.2 })
        .to(".bar-top", { attr: { x1: 3, y1: 7, x2: 17, y2: 7 }, duration: 0.2, ease: "power3.in" }, "<")
        .to(".bar-bot", { attr: { x1: 3, y1: 13, x2: 17, y2: 13 }, duration: 0.2, ease: "power3.in" }, "<")
        .to(".nav-panel", { y: "110vh", rotation: "random(-25, 25)", duration: 1, ease: "power3.in", stagger: { from: "end", each: 0.02 } }, "<")
        .to(".nav-bg", { opacity: 0, duration: 0.3, ease: "power2.in" }, "<0.1")
        .set("#nav", { visibility: "hidden", pointerEvents: "none" });
    }
    initMenu();

    function toggleMenu() {
      isOpenMenu = !isOpenMenu;
      const btn = document.getElementById("menuToggle");
      btn.setAttribute("aria-expanded", isOpenMenu);
      if (isOpenMenu) {
        if (menuTl.time() >= enterEndTime) { menuTl.timeScale(1).restart(); } else { menuTl.timeScale(1).play(); }
      } else {
        if (menuTl.time() < enterEndTime) { menuTl.timeScale(exitSpeed).reverse(); } else { menuTl.timeScale(1).play(); }
      }
    }
    document.getElementById("menuToggle").addEventListener("click", toggleMenu);

    // Also close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if(isOpenMenu) toggleMenu();
      });
    });

    // 3. AutoSplit Hero & Scroll Animations
    document.fonts.ready.then(() => {
      gsap.set(".split", { opacity: 1 });
      let containers = gsap.utils.toArray(".hero-section");
      containers.forEach((container) => {
        let text = container.querySelector(".split");
        SplitText.create(text, {
          type: "words,lines", mask: "lines", linesClass: "line", autoSplit: true,
          onSplit: (instance) => {
            gsap.from(instance.lines, { yPercent: 120, opacity: 0, stagger: 0.1, duration: 1.2, ease: "power3.out", delay: 1 });
            gsap.to(".hero-sub, .hero-cta", { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out", delay: 2, startAt: {y: 20} });
          }
        });
      });

      // Problem Section Scroll Reveal
      const probSplit = new SplitText(".problem-text", {type: "words"});
      gsap.from(probSplit.words, {
        scrollTrigger: { trigger: ".problem-section", start: "top 80%", end: "bottom 50%", scrub: 1 },
        opacity: 0.1, stagger: 0.1
      });
    });

    // 4. Slides Pinning
    var panels = gsap.utils.toArray(".section");
    panels.pop();
    panels.forEach((panel, i) => {
      let innerpanel = panel.querySelector(".section-inner");
      let panelHeight = innerpanel.offsetHeight;
      let windowHeight = window.innerHeight;
      let difference = panelHeight - windowHeight;
      let fakeScrollRatio = difference > 0 ? (difference / (difference + windowHeight)) : 0;
      if (fakeScrollRatio) { panel.style.marginBottom = panelHeight * fakeScrollRatio + "px"; }
      let tl = gsap.timeline({ scrollTrigger:{ trigger: panel, start: "bottom bottom", end: () => fakeScrollRatio ? `+=${innerpanel.offsetHeight}` : "bottom top", pinSpacing: false, pin: true, scrub: true } });
      if (fakeScrollRatio) { tl.to(innerpanel, {yPercent:-100, y: window.innerHeight, duration: 1 / (1 - fakeScrollRatio) - 1, ease: "none"}); }
      tl.fromTo(panel, {scale:1, opacity:1}, {scale: 0.7, opacity: 0.5, duration: 0.9}).to(panel, {opacity:0, duration: 0.1});
    });

    // 5. Infinite Gallery
    let iteration = 0;
    gsap.set('.cards li', {xPercent: 400, opacity: 0, scale: 0});
    const spacing = 0.1, snapTime = gsap.utils.snap(spacing), cards = gsap.utils.toArray('.cards li');
    const animateFunc = element => {
      const tl = gsap.timeline();
      tl.fromTo(element, {scale: 0, opacity: 0}, {scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false})
        .fromTo(element, {xPercent: 400}, {xPercent: -400, duration: 1, ease: "none", immediateRender: false}, 0);
      return tl;
    };
    function buildSeamlessLoop(items, spacing, animateFunc) {
      let overlap = Math.ceil(1 / spacing), startTime = items.length * spacing + 0.5, loopTime = (items.length + overlap) * spacing + 1;
      let rawSequence = gsap.timeline({paused: true}), seamlessLoop = gsap.timeline({ paused: true, repeat: -1, onRepeat() { this._time === this._dur && (this._tTime += this._dur - 0.01); } });
      let l = items.length + overlap * 2, time, i, index;
      for (i = 0; i < l; i++) {
        index = i % items.length; time = i * spacing;
        rawSequence.add(animateFunc(items[index]), time);
        i <= items.length && seamlessLoop.add("label" + i, time);
      }
      rawSequence.time(startTime);
      seamlessLoop.to(rawSequence, { time: loopTime, duration: loopTime - startTime, ease: "none" }).fromTo(rawSequence, {time: overlap * spacing + 1}, { time: startTime, duration: startTime - (overlap * spacing + 1), immediateRender: false, ease: "none" });
      return seamlessLoop;
    }
    let seamlessLoop = buildSeamlessLoop(cards, spacing, animateFunc);
    let playhead = {offset: 0}, wrapTime = gsap.utils.wrap(0, seamlessLoop.duration());
    let scrub = gsap.to(playhead, { offset: 0, onUpdate() { seamlessLoop.time(wrapTime(playhead.offset)); }, duration: 0.5, ease: "power3", paused: true });
    let trigger = ScrollTrigger.create({
      trigger: ".gallery-section",
      start: "top top",
      end: "+=3000",
      pin: true,
      onUpdate(self) {
        scrub.vars.offset = self.progress * seamlessLoop.duration() * 2;
        scrub.invalidate().restart();
      }
    });
    document.querySelector(".next").addEventListener("click", () => {
      window.scrollBy({ top: 3000 / cards.length, behavior: 'smooth' });
    });
    document.querySelector(".prev").addEventListener("click", () => {
      window.scrollBy({ top: -3000 / cards.length, behavior: 'smooth' });
    });
    Draggable.create(".drag-proxy", { 
      type: "x", 
      trigger: ".gallery-section", 
      onPress() { this.startOffset = scrub.vars.offset; }, 
      onDrag() { 
        scrub.vars.offset = this.startOffset + (this.startX - this.x) * 0.001; 
        scrub.invalidate().restart(); 
      } 
    });

    // 6. Add Cart MorphSVG Animation
    document.querySelectorAll('.add-to-cart').forEach(button => {
        let morph = button.querySelector('.morph path'), shirt = button.querySelectorAll('.shirt svg > path');
        button.addEventListener('pointerdown', e => { if(button.classList.contains('active')) return; gsap.to(button, { '--background-scale': .97, duration: .15 }); });
        button.addEventListener('click', e => {
            e.preventDefault(); if(button.classList.contains('active')) return; button.classList.add('active');
            gsap.to(button, { keyframes: [{ '--background-scale': .97, duration: .15 }, { '--background-scale': 1, delay: .125, duration: 1.2, ease: 'elastic.out(1, .6)' }] });
            gsap.to(button, { keyframes: [{ '--shirt-scale': 1, '--shirt-y': '-42px', '--cart-x': '0px', '--cart-scale': 1, duration: .4, ease: 'power1.in' }, { '--shirt-y': '-40px', duration: .3 }, { '--shirt-y': '16px', '--shirt-scale': .9, duration: .25, ease: 'none' }, { '--shirt-scale': 0, duration: .3, ease: 'none' }] });
            gsap.to(button, { '--shirt-second-y': '0px', delay: .835, duration: .12 });
            gsap.to(button, { keyframes: [{ '--cart-clip': '12px', '--cart-clip-x': '3px', delay: .9, duration: .06 }, { '--cart-y': '2px', duration: .1 }, { '--cart-tick-offset': '0px', '--cart-y': '0px', duration: .2, onComplete() { button.style.overflow = 'hidden' } }, { '--cart-x': '52px', '--cart-rotate': '-15deg', duration: .2 }, { '--cart-x': '104px', '--cart-rotate': '0deg', duration: .2, clearProps: true, onComplete() { button.style.overflow = 'hidden'; button.style.setProperty('--text-o', 0); button.style.setProperty('--text-x', '0px'); button.style.setProperty('--cart-x', '-104px'); } }, { '--text-o': 1, '--text-x': '12px', '--cart-x': '-48px', '--cart-scale': .75, duration: .25, clearProps: true, onComplete() { button.classList.remove('active'); } }] });
            gsap.to(button, { keyframes: [{ '--text-o': 0, duration: .3 }] });
            gsap.to(morph, { keyframes: [{ morphSVG: 'M0 12C6 12 20 10 32 0C43.9024 9.99999 58 12 64 12V13H0V12Z', duration: .25, ease: 'power1.out' }, { morphSVG: 'M0 12C6 12 17 12 32 12C47.9024 12 58 12 64 12V13H0V12Z', duration: .15, ease: 'none' }] });
            gsap.to(shirt, { keyframes: [{ morphSVG: 'M4.99997 3L8.99997 1.5C8.99997 1.5 10.6901 3 12 3C13.3098 3 15 1.5 15 1.5L19 3L23.5 8L20.5 11L19 9.5L18 22.5C18 22.5 14 21.5 12 21.5C10 21.5 5.99997 22.5 5.99997 22.5L4.99997 9.5L3.5 11L0.5 8L4.99997 3Z', duration: .25, delay: .25 }, { morphSVG: 'M4.99997 3L8.99997 1.5C8.99997 1.5 10.6901 3 12 3C13.3098 3 15 1.5 15 1.5L19 3L23.5 8L20.5 11L19 9.5L18.5 22.5C18.5 22.5 13.5 22.5 12 22.5C10.5 22.5 5.5 22.5 5.5 22.5L4.99997 9.5L3.5 11L0.5 8L4.99997 3Z', duration: .85, ease: 'elastic.out(1, .5)' }, { morphSVG: 'M4.99997 3L8.99997 1.5C8.99997 1.5 10.6901 3 12 3C13.3098 3 15 1.5 15 1.5L19 3L22.5 8L19.5 10.5L19 9.5L17.1781 18.6093C17.062 19.1901 16.778 19.7249 16.3351 20.1181C15.4265 20.925 13.7133 22.3147 12 23C10.2868 22.3147 8.57355 20.925 7.66487 20.1181C7.22198 19.7249 6.93798 19.1901 6.82183 18.6093L4.99997 9.5L4.5 10.5L1.5 8L4.99997 3Z', duration: 0, delay: 1.25 }] });
540:         });
541:     });
542: 
543:     // Steps Fill Line Animation
544:     gsap.to(".step-line-fill", {
545:       height: "100%", ease: "none",
546:       scrollTrigger: { trigger: ".step-list", start: "top center", end: "bottom center", scrub: true }
547:     });
548: 
549:     // Quiz Logic
550:     let recommendedScent = "Karimun";
551:     function nextQ(num, scent) {
552:       if(scent) recommendedScent = scent;
553:       let current = document.querySelector(".quiz-question.active");
554:       gsap.to(current, {opacity: 0, y: -20, duration: 0.3, onComplete: () => {
555:         current.classList.remove("active");
556:         let next = document.getElementById("q"+num);
557:         next.classList.add("active");
558:         gsap.fromTo(next, {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.4});
559:       }});
560:     }
561:     function showResult() {
562:       document.getElementById("recommended-scent").textContent = recommendedScent;
563:       let current = document.querySelector(".quiz-question.active");
564:       gsap.to(current, {opacity: 0, scale: 0.8, duration: 0.3, onComplete: () => {
565:         current.classList.remove("active");
566:         let res = document.getElementById("q-result");
567:         res.classList.add("active");
568:         gsap.fromTo(res, {opacity: 0, scale: 0.8}, {opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)"});
569:       }});
570:     }
571:     function resetQuiz() {
572:       let res = document.getElementById("q-result");
573:       res.classList.remove("active");
574:       let q1 = document.getElementById("q1");
575:       q1.classList.add("active");
576:       gsap.set(q1, {opacity: 1, y: 0});
577:     }
578: 
579:     // Testimonials Slider
580:     gsap.to(".testi-slider", {
581:       x: () => -(document.querySelector(".testi-slider").scrollWidth - window.innerWidth + 40),
582:       ease: "none",
583:       scrollTrigger: { trigger: ".testi-section", start: "top bottom", end: "bottom top", scrub: true }
584:     });
585: 
586:     // FAQ Accordion
587:     document.querySelectorAll(".faq-question").forEach(q => {
588:       q.addEventListener("click", () => {
589:         let ans = q.nextElementSibling;
590:         if(ans.style.maxHeight) { 
591:             ans.style.maxHeight = null; 
592:             ans.style.marginTop = "0";
593:             q.querySelector("span").textContent = "+"; 
594:             q.style.color = "var(--white)";
595:         } else { 
596:             ans.style.maxHeight = ans.scrollHeight + "px"; 
597:             ans.style.marginTop = "10px";
598:             q.querySelector("span").textContent = "-"; 
599:             q.style.color = "var(--primary-container)";
600:         }
601:       });
602:     });
603: 
604:     // 7. Footer Bounce
605:     const down = 'M0-0.3C0-0.3,464,156,1139,156S2278-0.3,2278-0.3V683H0V-0.3z';
606:     const center = 'M0-0.3C0-0.3,464,0,1139,0s1139-0.3,1139-0.3V683H0V-0.3z';
607:     ScrollTrigger.create({
608:       trigger: '.footer-container', start: 'top bottom', toggleActions: 'play pause resume reverse',
609:       onEnter: self => {
610:         const velocity = self.getVelocity(); const variation = Math.min(Math.abs(velocity) / 10000, 0.5);
611:         gsap.fromTo('#bouncy-path', { morphSVG: down }, { duration: 2, morphSVG: center, ease: `elastic.out(${1 + variation}, ${1 - Math.min(variation, 0.9)})`, overwrite: 'true' });
612:       }
613:     });
614:   