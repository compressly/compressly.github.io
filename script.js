// Simple scroll-based fade-in for elements that use the fadeUp animation
document.addEventListener("DOMContentLoaded", () => {
  // detect low-power / low-memory devices and set a class so CSS/JS can reduce effects
  const deviceMemory = navigator.deviceMemory || 4; // approximate GB
  const cores = navigator.hardwareConcurrency || 4;
  const autoLowPower = deviceMemory <= 2 || cores <= 2;

  // allow user override via localStorage: '1' = low-power forced, '0' = disabled
  const stored = (() => {
    try {
      return localStorage.getItem("compressly-low-power");
    } catch (e) {
      return null;
    }
  })();
  let isLowPower = autoLowPower;
  if (stored === "1") isLowPower = true;
  if (stored === "0") isLowPower = false;
  if (isLowPower) document.documentElement.classList.add("low-power");

  // helper: apply UI changes needed when toggling low-power (lite) mode
  function applyLowPowerMode(turnOn) {
    const docEl = document.documentElement;
    const body = document.body;
    if (turnOn) {
      docEl.classList.add("low-power");
      // ensure any reveal animations are shown immediately to avoid flashes
      document
        .querySelectorAll(".to-reveal")
        .forEach((el) => el.classList.add("visible"));
      // stop play-animate so heavy CSS animations won't run
      body.classList.remove("play-animate");
      // stop blob animations if present (expensive to run)
      document.querySelectorAll(".bg-blobs .blob").forEach((b) => {
        try {
          b.style.animation = "none";
        } catch (e) {}
      });
    } else {
      docEl.classList.remove("low-power");
      // re-run reveal sequence similar to initial load
      const allToReveal = Array.from(document.querySelectorAll(".to-reveal"));
      if (allToReveal.length) {
        const base = 120; // initial delay before first reveal
        const overlapOffset = 120;
        const step = 40;
        allToReveal.forEach((el, i) => {
          el.classList.remove("visible");
          let delay;
          if (i === 0) delay = base;
          else delay = base + overlapOffset + (i - 1) * step;
          setTimeout(() => el.classList.add("visible"), delay);
        });
      }
      // restore play-animate class so page animations can start
      requestAnimationFrame(() => {
        setTimeout(() => body.classList.add("play-animate"), 30);
      });

      // restart blob animations (if CSS provides an animation)
      const blobs = document.querySelectorAll(".bg-blobs .blob");
      if (blobs.length) {
        blobs.forEach((b) => {
          const computed = getComputedStyle(b).animation || b.style.animation;
          if (computed && computed !== "none") {
            b.style.animation = "none";
            setTimeout(() => {
              b.style.animation = computed;
            }, 50);
          }
        });
      }
    }
  }

  // Insert a small low-power toggle into the header so users can manually toggle mode
  try {
    const headerContainer = document.querySelector(".site-top .container");
    if (headerContainer) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost small low-power-toggle";
      btn.setAttribute("aria-pressed", isLowPower ? "true" : "false");
      btn.title = "Toggle Lite mode (visual effects)";
      btn.textContent = isLowPower ? "Lite: On" : "Lite: Off";
      // place it after the nav (end of container)
      headerContainer.appendChild(btn);
      btn.addEventListener("click", () => {
        const currently =
          document.documentElement.classList.toggle("low-power");
        btn.setAttribute("aria-pressed", currently ? "true" : "false");
        btn.textContent = currently ? "Lite: On" : "Lite: Off";
        try {
          localStorage.setItem("compressly-low-power", currently ? "1" : "0");
        } catch (e) {
          // ignore
        }

        // Apply mode changes dynamically without reloading the page
        applyLowPowerMode(currently);
      });
    }
  } catch (e) {
    // DOM might not be ready for insertion in rare cases — ignore
  }

  // Ensure .brand has a data-text attribute used by CSS to render a blurred shadow.
  try {
    const brand = document.querySelector(".brand");
    if (brand) {
      const text = Array.from(brand.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join(" ")
        .trim();
      if (text) brand.setAttribute("data-text", text);
    }
  } catch (e) {
    // ignore
  }

  // Insert a mobile menu button (only visible via CSS on small screens)
  try {
    // Portal the nav to document.body only on small screens so it can overlay any stacking context there.
    // Keep a placeholder in the original location so we can restore the nav on larger viewports.
    try {
      const navEl = document.querySelector(".nav");
      const originalParent = navEl ? navEl.parentElement : null;
      let placeholder = originalParent
        ? originalParent.querySelector(".nav-portal-placeholder")
        : null;

      function portalIfMobile() {
        const isMobile = window.matchMedia("(max-width: 900px)").matches;
        if (!navEl) return;
        if (isMobile && navEl.parentElement !== document.body) {
          // create placeholder where nav used to live so we can restore it later
          if (!placeholder && originalParent) {
            placeholder = document.createElement("div");
            placeholder.className = "nav-portal-placeholder";
            originalParent.insertBefore(placeholder, navEl);
          }
          document.body.appendChild(navEl);
          navEl.dataset.portal = "1";
        } else if (!isMobile && navEl.dataset.portal === "1" && placeholder) {
          // restore to original place
          placeholder.parentElement.insertBefore(navEl, placeholder);
          placeholder.remove();
          placeholder = null;
          delete navEl.dataset.portal;
        }
      }

      // run once on load
      portalIfMobile();
      // also sync on resize so switching between desktop/mobile restores nav correctly
      window.addEventListener("resize", () => {
        // debounce briefly
        clearTimeout(window.__navPortalTimeout);
        window.__navPortalTimeout = setTimeout(portalIfMobile, 120);
      });
    } catch (e) {
      // ignore portal errors
    }

    const headerContainer2 = document.querySelector(".site-top .container");
    if (headerContainer2) {
      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "mobile-menu-btn";
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Toggle navigation");
      // Insert an SVG that contains both hamburger lines and cross (X) lines.
      // We'll crossfade between them for a clean, reliable morph-like effect.
      menuBtn.innerHTML =
        '<svg class="hamburger" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">' +
        '<g class="hamburger-lines">' +
        '<line class="ham ham1" x1="4" y1="6" x2="20" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
        '<line class="ham ham2" x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
        '<line class="ham ham3" x1="4" y1="18" x2="20" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
        "</g>" +
        '<g class="cross-lines">' +
        '<line class="cross cross1" x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
        '<line class="cross cross2" x1="6" y1="18" x2="18" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />' +
        "</g>" +
        "</svg>";
      headerContainer2.appendChild(menuBtn);

      // If a low-power toggle exists, position the hamburger to its right using JS
      // (CSS sibling rules can be fragile depending on DOM mutations and portal behavior)
      const lowToggle = document.querySelector(".low-power-toggle");
      function positionMenuBtn() {
        const isMobile = window.matchMedia("(max-width: 900px)").matches;
        if (!isMobile) {
          // clear any inline positioning on desktop
          menuBtn.style.left = "";
          menuBtn.style.right = "";
          return;
        }
        if (lowToggle && lowToggle.offsetParent) {
          // position relative to container: compute left offset inside container
          const containerRect = headerContainer2.getBoundingClientRect();
          const toggleRect = lowToggle.getBoundingClientRect();
          const leftInside = toggleRect.right - containerRect.left + 8; // 8px gap
          menuBtn.style.left = leftInside + "px";
          menuBtn.style.right = "auto";
        } else {
          // default: align to right edge
          menuBtn.style.left = "";
          menuBtn.style.right = "18px";
        }
      }
      // initial position and on resize/orientation change
      positionMenuBtn();
      window.addEventListener("resize", () => {
        clearTimeout(window.__menuBtnPosTimeout);
        window.__menuBtnPosTimeout = setTimeout(positionMenuBtn, 80);
      });

      const navEl = document.querySelector(".nav");

      // Helper to detect mobile viewport; keeps logic centralized so CSS/media-query breakpoint
      // and JS stay in sync.
      function isMobile() {
        return window.matchMedia("(max-width: 900px)").matches;
      }

      function setMenuState(open) {
        const doc = document.documentElement;
        // Only perform the animated open/close flow on mobile viewports.
        // On desktop simply ensure any mobile classes are removed so no accidental
        // mobile animations play when clicking header buttons.
        if (!isMobile()) {
          if (!open) {
            doc.classList.remove("nav-closing");
            doc.classList.remove("nav-open");
          } else {
            // If asked to open on desktop, don't add mobile-open classes — no-op.
          }
          if (menuBtn) {
            menuBtn.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
          }
          return;
        }

        if (open) {
          // open immediately
          doc.classList.add("nav-open");
          doc.classList.remove("nav-closing");
          menuBtn.classList.add("open");
          menuBtn.setAttribute("aria-expanded", "true");
        } else {
          // start close animation: remove button open state and add nav-closing
          menuBtn.classList.remove("open");
          menuBtn.setAttribute("aria-expanded", "false");
          doc.classList.add("nav-closing");
          // keep nav-open present until closing animation completes
          if (navEl) {
            const onAnimEnd = function (ev) {
              if (ev.target !== navEl) return;
              navEl.removeEventListener("animationend", onAnimEnd);
              doc.classList.remove("nav-closing");
              doc.classList.remove("nav-open");
            };
            navEl.addEventListener("animationend", onAnimEnd);
            // safety fallback
            setTimeout(() => {
              doc.classList.remove("nav-closing");
              doc.classList.remove("nav-open");
            }, 350);
          } else {
            doc.classList.remove("nav-closing");
            doc.classList.remove("nav-open");
          }
        }
      }

      menuBtn.addEventListener("click", (e) => {
        // If not mobile don't run the mobile menu open/close flow
        if (!isMobile()) return;
        const isOpen = document.documentElement.classList.contains("nav-open");
        setMenuState(!isOpen);
      });

      // Close mobile nav when a nav-link is clicked
      document.querySelectorAll(".nav-link").forEach((nl) => {
        nl.addEventListener("click", () => {
          if (isMobile()) setMenuState(false);
        });
      });

      // Close on Escape key
      document.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && isMobile()) setMenuState(false);
      });
    }
  } catch (e) {
    // ignore
  }

  // animate progress bars in mock
  document.querySelectorAll(".progress i").forEach((el, idx) => {
    setTimeout(() => {
      el.style.width =
        el.getAttribute("data-width") || el.style.width || el.style.width;
      // if width unspecified, animate to existing inline width
      if (!el.style.width || el.style.width === "0%") {
        // fallback sample widths
        const sample = [45, 78, 12];
        el.style.width = sample[idx % sample.length] + "%";
      }
    }, 300 + idx * 120);
  });

  // simple click feedback for download button
  const downloadBtn = document.getElementById("downloadBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
      // allow the link to open (don't preventDefault) but show a pressed animation
      downloadBtn.classList.add("pressed");
      setTimeout(() => downloadBtn.classList.remove("pressed"), 300);
    });
  }

  // subtle stagger for cards and mock window: assign CSS vars for delays
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, i) => {
    card.style.setProperty("--delay", `${120 * i}ms`);
  });
  const mock = document.querySelector(".mock-window");
  if (mock) mock.style.setProperty("--mock-delay", "120ms");

  // stagger hero elements
  const heroSeq = [
    document.querySelector(".title"),
    document.querySelector(".tag"),
    document.querySelector(".cta-row"),
    document.querySelector(".bullets"),
  ];
  heroSeq.forEach((el, i) => {
    if (el) el.style.setProperty("--delay", `${i * 80}ms`);
  });

  // hero visual and mock body
  const heroVisual = document.querySelector(".hero-visual");
  if (heroVisual) heroVisual.style.setProperty("--mock-delay", "160ms");
  const mockBody = document.querySelector(".mock-body");
  if (mockBody) mockBody.style.setProperty("--mock-delay", "180ms");

  // section titles and steps
  document
    .querySelectorAll(".section-title")
    .forEach((el, i) => el.style.setProperty("--delay", `${120 * i}ms`));
  document
    .querySelectorAll(".how .step")
    .forEach((el, i) => el.style.setProperty("--delay", `${100 * i}ms`));

  // sequential reveal for any .to-reveal elements on the page
  const allToReveal = Array.from(document.querySelectorAll(".to-reveal"));
  if (allToReveal.length) {
    const base = 120; // initial delay before first reveal
    const overlapOffset = 120; // when following items start after the first
    const step = 40; // spacing between following items
    allToReveal.forEach((el, i) => {
      let delay;
      if (i === 0) delay = base;
      else delay = base + overlapOffset + (i - 1) * step;
      // ensure hidden -> visible transition
      el.classList.remove("visible");
      setTimeout(() => el.classList.add("visible"), delay);
    });
  }

  // trigger animations after delays are set
  // Use rAF then a tiny timeout to ensure styles have applied before starting animations
  requestAnimationFrame(() => {
    setTimeout(() => document.body.classList.add("play-animate"), 30);
  });

  // Restart blob animations only on capable devices (restarting can be expensive)
  const blobs = document.querySelectorAll(".bg-blobs .blob");
  if (
    !document.documentElement.classList.contains("low-power") &&
    blobs.length
  ) {
    blobs.forEach((b) => {
      const computed = getComputedStyle(b).animation || b.style.animation;
      if (computed && computed !== "none") {
        b.style.animation = "none";
        setTimeout(() => {
          b.style.animation = computed;
        }, 50);
      }
    });
  }

  // Ripple effect for interactive elements (.btn and .card)
  function createRipple(e) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = Math.max(rect.width, rect.height) * 1.2;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = r + "px";
    span.style.left = x - r / 2 + "px";
    span.style.top = y - r / 2 + "px";
    el.appendChild(span);
    window.setTimeout(() => span.remove(), 600);
  }

  document.querySelectorAll(".btn, .card").forEach((el) => {
    // add ripple handler but check low-power mode at runtime so toggling
    // doesn't require re-attaching/removing listeners or a page reload
    el.addEventListener("click", (e) => {
      if (!document.documentElement.classList.contains("low-power")) {
        createRipple(e);
      }
    });
    // add subtle hover glow using class (for keyboard focus too)
    el.addEventListener("mouseenter", () => el.classList.add("hovering"));
    el.addEventListener("mouseleave", () => el.classList.remove("hovering"));
    el.addEventListener("focus", () => el.classList.add("hovering"));
    el.addEventListener("blur", () => el.classList.remove("hovering"));
  });

  // Smooth scroll for in-page nav links: intercept clicks on .nav-link anchors
  // whose href starts with '#' and animate the scroll for a gentler experience.
  try {
    document.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          // prevent the instant jump and smoothly scroll instead
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // ensure target is focusable for accessibility after scroll
          const prevTab = target.getAttribute("tabindex");
          if (!prevTab) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
          if (!prevTab) target.removeAttribute("tabindex");
          // update the URL hash without adding a new history entry
          if (history.replaceState) history.replaceState(null, "", href);
        }
      });
    });
  } catch (e) {
    // if anything goes wrong, fall back to native behavior (CSS handles many cases)
  }
});
