/* ============================================================
   Kyler & Stormy — scene router + envelope animation
   ============================================================ */
(function () {
  "use strict";

  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  var byName = {};
  scenes.forEach(function (s) { byName[s.dataset.scene] = s; });

  var hasGSAP = typeof window.gsap !== "undefined";
  var opened = false;          // has the envelope been opened this session?
  var current = null;

  /* ---------- scene routing ---------- */
  function setScene(name, opts) {
    opts = opts || {};
    if (!byName[name]) name = "intro";
    if (name === current) return;

    scenes.forEach(function (s) {
      s.classList.toggle("is-active", s.dataset.scene === name);
    });

    byName[name].scrollTop = 0;
    current = name;
    if (!opts.silent) {
      if (history.replaceState) history.replaceState(null, "", "#" + name);
      else location.hash = name;
    }
    if (name === "home") scaleHomeCanvas();
    reveal(byName[name]);
  }

  /* scale every fixed 1442-wide Figma collage canvas to its wrapper width */
  function scaleHomeCanvas() {
    document.querySelectorAll(".fig-canvas").forEach(function (canvas) {
      var wrap = canvas.parentElement;
      if (!wrap) return;
      canvas.style.transform = "none";
      var natH = canvas.offsetHeight;      // natural height, pre-scale
      var s = wrap.clientWidth / 1442;
      canvas.style.transform = "scale(" + s + ")";
      wrap.style.height = (natH * s) + "px";
    });
  }

  function reduceMotion() {
    return window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function canAnimate() {
    return hasGSAP && document.visibilityState === "visible" && !reduceMotion();
  }

  /* gentle entrance for a scene's key elements */
  function reveal(scene) {
    // content is visible by default via CSS; only add the fade when we can
    // actually run it — otherwise (hidden tab / reduced motion) leave it be.
    if (!canAnimate()) return;
    var targets = scene.querySelectorAll(
      ".label,.couple,.script-title,.home-stage,.tagline,.nav-pills,.story-wrap,.detail-intro,.detail-grid,.story-cta,.page-foot"
    );
    gsap.killTweensOf(targets);
    gsap.fromTo(targets,
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: 0.9, ease: "power2.out", stagger: 0.06, delay: 0.15,
        clearProps: "transform,opacity,visibility" });
  }

  /* ---------- envelope opening ---------- */
  function openEnvelope() {
    if (opened) { setScene("home"); return; }
    opened = true;

    var stage = document.getElementById("envelopeStage");
    var art   = stage.querySelector(".env-arrangement");
    var cta   = document.querySelector(".intro-cta2");
    stage.classList.add("is-opening");

    if (!canAnimate()) { goHome(); return; }

    var tl = gsap.timeline();
    tl.to(cta, { autoAlpha: 0, duration: 0.3 }, 0)
      .to(art, { y: -12, scale: 1.05, duration: 0.75, ease: "power2.out" }, 0)
      .to("#intro", { autoAlpha: 0, duration: 0.9, ease: "power2.inOut" }, 0.7)
      .add(function () { goHome(); }, 1.4);

    // safety net so the reveal always completes even if rAF is throttled
    clearTimeout(window._openT);
    window._openT = setTimeout(goHome, 1900);
  }

  function goHome() {
    clearTimeout(window._openT);
    var intro = byName.intro;
    if (intro) { intro.style.opacity = ""; intro.style.visibility = ""; }
    setScene("home");
  }

  /* ---------- scatter pearls across the home stage ---------- */
  function scatterPearls() {
    var stage = document.querySelector(".home-stage");
    if (!stage) return;
    var spots = [
      [18, 30, 14], [30, 58, 10], [24, 78, 12], [70, 40, 11],
      [82, 60, 15], [64, 82, 10], [46, 20, 9], [88, 30, 8], [12, 55, 9]
    ];
    spots.forEach(function (p) {
      var d = document.createElement("span");
      d.className = "pearl";
      d.style.left = p[0] + "%";
      d.style.top = p[1] + "%";
      d.style.width = p[2] + "px";
      d.style.height = p[2] + "px";
      stage.appendChild(d);
    });
  }

  /* ---------- wiring ---------- */
  function wire() {
    var stage = document.getElementById("envelopeStage");
    if (stage) {
      stage.addEventListener("click", openEnvelope);
      stage.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
      });
    }

    document.querySelectorAll("[data-goto]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var target = el.dataset.goto;
        if (target === "intro") { opened = true; } // don't replay the whole open
        setScene(target);
      });
    });

    // placeholder outbound links — replace href when real URLs are known
    document.querySelectorAll("[data-external]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (el.getAttribute("href") === "#") {
          e.preventDefault();
          console.info("[K&S] outbound link '" + el.dataset.external + "' not set yet");
        }
      });
    });

    window.addEventListener("hashchange", function () {
      var name = (location.hash || "").replace("#", "");
      if (byName[name]) { opened = true; setScene(name, { silent: true }); }
    });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt); rt = setTimeout(scaleHomeCanvas, 100);
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    wire();
    scaleHomeCanvas();
    window.addEventListener("load", scaleHomeCanvas);
    document.body.classList.remove("booting");

    var start = (location.hash || "").replace("#", "");
    if (byName[start] && start !== "intro") {
      opened = true;
      setScene(start, { silent: true });
    } else {
      setScene("intro", { silent: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
