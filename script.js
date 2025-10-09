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
});
