document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector(".nav");

  if (menuButton && navigation) {
    const setMenuOpen = (open) => {
      menuButton.setAttribute("aria-expanded", String(open));
      document.documentElement.classList.toggle("nav-open", open);
    };
    menuButton.addEventListener("click", () => {
      setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });
    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });
  }

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDownloadPage = document.body.classList.contains("download-page");
  const observerRevealItems = revealItems.filter((item) =>
    !isDownloadPage || (!item.matches(".page-hero") && !item.matches(".download-card"))
  );
  let revealObserver = null;

  const setupRevealAnimations = () => {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
    if (reducedMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("revealed"));
      return;
    }

    const revealGroups = new Map();
    const groupedItems = new Set();

    observerRevealItems.forEach((item) => {
      const parent = item.parentElement;
      if (!parent || revealGroups.has(parent)) return;
      const siblings = [...parent.children].filter((child) => child.hasAttribute("data-reveal"));
      if (siblings.length < 2) return;
      revealGroups.set(parent, siblings);
      siblings.forEach((sibling, index) => {
        sibling.style.setProperty("--reveal-delay", `${index * 55}ms`);
        groupedItems.add(sibling);
      });
    });

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const group = revealGroups.get(entry.target);
          if (group) {
            group.forEach((item) => item.classList.add("revealed"));
          } else {
            entry.target.classList.add("revealed");
          }
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px" }
    );
    revealGroups.forEach((_items, parent) => revealObserver.observe(parent));
    observerRevealItems.filter((item) => !groupedItems.has(item)).forEach((item) => {
      item.style.setProperty("--reveal-delay", "0ms");
      revealObserver.observe(item);
    });
  };

  setupRevealAnimations();

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted || reducedMotion) return;
    if (isDownloadPage) {
      const downloadIntro = document.querySelector(".download-page .page-hero");
      const downloadGrid = document.querySelector(".download-page .download-grid");
      const downloadRequirements = document.querySelector(".download-page .requirements");
      if (!downloadIntro && !downloadGrid && !downloadRequirements) return;
      document.documentElement.classList.add("reveal-reset");
      downloadIntro?.classList.add("download-intro-reset");
      downloadGrid?.classList.add("download-cards-reset");
      downloadRequirements?.classList.add("download-requirements-reset");
      observerRevealItems.forEach((item) => item.classList.remove("revealed"));
      void document.documentElement.offsetWidth;
      window.requestAnimationFrame(() => {
        document.documentElement.classList.remove("reveal-reset");
        downloadIntro?.classList.remove("download-intro-reset");
        downloadGrid?.classList.remove("download-cards-reset");
        downloadRequirements?.classList.remove("download-requirements-reset");
        void document.documentElement.offsetWidth;
        window.requestAnimationFrame(setupRevealAnimations);
      });
      return;
    }
    document.documentElement.classList.add("reveal-reset");
    revealItems.forEach((item) => item.classList.remove("revealed"));
    void document.documentElement.offsetWidth;
    window.requestAnimationFrame(() => {
      document.documentElement.classList.remove("reveal-reset");
      void document.documentElement.offsetWidth;
      window.requestAnimationFrame(setupRevealAnimations);
    });
  });

  document.querySelectorAll("[data-current-year]").forEach((item) => {
    item.textContent = String(new Date().getFullYear());
  });

  const releaseEndpoint =
    "https://api.github.com/repos/MinimackStudios/compressly/releases/latest";
  const releasePage =
    "https://github.com/MinimackStudios/compressly/releases/latest";
  const downloadLinks = [...document.querySelectorAll("[data-release-asset]")];

  const assetMatchers = {
    windows: (name) => /\.exe$/i.test(name) && !/blockmap/i.test(name),
    "mac-arm64": (name) =>
      /(?:^|[-_.])(?:arm64|aarch64)(?=[-_.]|$)/i.test(name) &&
      /\.(?:dmg|pkg|zip)$/i.test(name),
    "mac-x64": (name) =>
      /\.(?:dmg|pkg|zip)$/i.test(name) &&
      !/(?:^|[-_.])(?:arm64|aarch64)(?=[-_.]|$)/i.test(name),
  };

  async function hydrateReleaseDownloads() {
    if (!downloadLinks.length) return;
    try {
      const response = await fetch(releaseEndpoint, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const release = await response.json();
      const assets = Array.isArray(release.assets) ? release.assets : [];
      const version = String(release.tag_name || "v2.0.0").replace(/^v/i, "");

      downloadLinks.forEach((link) => {
        const type = link.dataset.releaseAsset;
        const match = assets.find((asset) =>
          assetMatchers[type] ? assetMatchers[type](String(asset.name || "")) : false
        );
        link.href = match && match.browser_download_url
          ? match.browser_download_url
          : release.html_url || releasePage;
        const versionNode = link.querySelector("[data-version]");
        if (versionNode) versionNode.textContent = `Version ${version}`;
        link.classList.toggle("asset-unavailable", !match);
        if (!match) {
          link.title = "This build is not attached to the latest release yet. Open releases instead.";
        }
      });

      document.querySelectorAll("[data-release-version]").forEach((node) => {
        node.textContent = `Version ${version}`;
      });
    } catch (error) {
      downloadLinks.forEach((link) => {
        link.href = releasePage;
        link.title = "Open the latest GitHub release";
      });
    }
  }

  const hydrationDelay = reducedMotion ? 0 : isDownloadPage ? 860 : 780;
  window.setTimeout(hydrateReleaseDownloads, hydrationDelay);
});
