// Replaces the Webflow runtime: scroll-in animations, nav, dropdowns, slider, tabs.
(function () {
  var EASE_OUT_QUART = "cubic-bezier(0.165, 0.84, 0.44, 1)";

  // ---- Scroll-into-view animations (Webflow IX2 "slideInBottom" / "slideInLeft") ----
  var SLIDE_IN_LEFT = ["fc1f129a-6593-371a-d8ab-3a5659e16203", "b980b867-98fb-b3f4-fb9e-31bd1d813634"];
  var SLIDE_IN_BOTTOM = [
    "8dd1cad7-15ee-4507-ba94-ebaf1b59414c", "26251af3-0df3-c0d8-6034-4fe377bdaef2",
    "11efbeb7-d64e-81df-ed63-fa0ea670ca26", "12776c4a-c928-d690-3f9d-8dc006155544",
    "9ad9eff7-6e56-498f-c0a7-d2090c3dbe1a", "28e7093c-18b7-b4a7-00df-8e3141980876",
    "54fc4a2b-0a58-c2c3-1911-6f0c0dac542e"
  ];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupReveal(id, from) {
    document.querySelectorAll('[data-w-id="' + id + '"]').forEach(function (el) {
      if (reduceMotion) { el.style.opacity = 1; return; }
      el.style.opacity = 0;
      el.style.transform = from;
      observer.observe(el);
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.style.transition = "opacity 1s " + EASE_OUT_QUART + ", transform 1s " + EASE_OUT_QUART;
      el.style.opacity = 1;
      el.style.transform = "translate3d(0, 0, 0)";
      observer.unobserve(el);
    });
  });
  SLIDE_IN_BOTTOM.forEach(function (id) { setupReveal(id, "translate3d(0, 100px, 0)"); });
  SLIDE_IN_LEFT.forEach(function (id) { setupReveal(id, "translate3d(-100px, 0, 0)"); });

  // Resources tab images fade to 63% on hover.
  document.querySelectorAll('[data-w-id="f6e91deb-119e-5304-da5c-272605b173d5"]').forEach(function (el) {
    el.style.transition = "opacity 0.5s";
    el.addEventListener("mouseenter", function () { el.style.opacity = 0.63; });
    el.addEventListener("mouseleave", function () { el.style.opacity = 1; });
  });

  // ---- Navbar (mobile menu) ----
  var COLLAPSE_AT = { medium: 991, small: 767, tiny: 479 };

  document.querySelectorAll(".w-nav").forEach(function (nav) {
    var button = nav.querySelector(".w-nav-button");
    var menu = nav.querySelector(".w-nav-menu");
    if (!button || !menu) return;
    var home = menu.parentNode, next = menu.nextSibling;
    var overlay = document.createElement("div");
    overlay.className = "w-nav-overlay";
    nav.appendChild(overlay);
    var breakpoint = COLLAPSE_AT[nav.getAttribute("data-collapse")] || 991;

    function close() {
      button.classList.remove("w--open");
      button.setAttribute("aria-expanded", "false");
      menu.removeAttribute("data-nav-menu-open");
      overlay.style.display = "none";
      home.insertBefore(menu, next);
    }
    function open() {
      button.classList.add("w--open");
      button.setAttribute("aria-expanded", "true");
      overlay.appendChild(menu);
      menu.setAttribute("data-nav-menu-open", "");
      overlay.style.display = "block";
      overlay.style.height = menu.offsetHeight + "px";
    }
    button.setAttribute("role", "button");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", function () {
      button.classList.contains("w--open") ? close() : open();
    });
    menu.querySelectorAll("a[href]").forEach(function (a) { a.addEventListener("click", close); });
    window.addEventListener("resize", function () {
      if (window.innerWidth > breakpoint && button.classList.contains("w--open")) close();
    });
  });

  // ---- Dropdowns ----
  document.querySelectorAll(".w-dropdown").forEach(function (dd) {
    var toggle = dd.querySelector(".w-dropdown-toggle");
    var list = dd.querySelector(".w-dropdown-list");
    if (!toggle || !list) return;
    var hover = dd.getAttribute("data-hover") === "true";

    function set(isOpen) {
      toggle.classList.toggle("w--open", isOpen);
      list.classList.toggle("w--open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      var navMenu = dd.closest(".w-nav-menu[data-nav-menu-open]");
      var overlay = navMenu && navMenu.parentNode;
      if (overlay && overlay.classList.contains("w-nav-overlay")) overlay.style.height = navMenu.offsetHeight + "px";
    }
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      set(!list.classList.contains("w--open"));
    });
    if (hover) {
      dd.addEventListener("mouseenter", function () { if (window.innerWidth > 991) set(true); });
      dd.addEventListener("mouseleave", function () { if (window.innerWidth > 991) set(false); });
    }
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) set(false); });
  });

  // ---- Slider ----
  document.querySelectorAll(".w-slider").forEach(function (slider) {
    var slides = slider.querySelectorAll(".w-slide");
    var nav = slider.querySelector(".w-slider-nav");
    var duration = parseInt(slider.getAttribute("data-duration"), 10) || 500;
    var easing = slider.getAttribute("data-easing") || "ease";
    var infinite = slider.getAttribute("data-infinite") === "true";
    var autoplay = slider.getAttribute("data-autoplay") === "true";
    var delay = parseInt(slider.getAttribute("data-delay"), 10) || 4000;
    var current = 0, dots = [], timer;

    slides.forEach(function (slide) { slide.style.transition = "transform " + duration + "ms " + easing; });

    if (nav) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("div");
        dot.className = "w-slider-dot";
        dot.setAttribute("role", "button");
        dot.setAttribute("tabindex", "0");
        dot.setAttribute("aria-label", "Show slide " + (i + 1) + " of " + slides.length);
        dot.addEventListener("click", function () { go(i); });
        dot.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); } });
        nav.appendChild(dot);
        dots.push(dot);
      });
    }

    function go(i) {
      if (infinite) i = (i + slides.length) % slides.length;
      else i = Math.max(0, Math.min(slides.length - 1, i));
      current = i;
      slides.forEach(function (slide, n) {
        slide.style.transform = "translateX(" + (-100 * i) + "%)";
        slide.setAttribute("aria-hidden", n === i ? "false" : "true");
      });
      dots.forEach(function (dot, n) { dot.classList.toggle("w-active", n === i); });
      if (autoplay) { clearTimeout(timer); timer = setTimeout(function () { go(current + 1); }, delay); }
    }

    var left = slider.querySelector(".w-slider-arrow-left");
    var right = slider.querySelector(".w-slider-arrow-right");
    if (left) left.addEventListener("click", function () { go(current - 1); });
    if (right) right.addEventListener("click", function () { go(current + 1); });

    if (slider.getAttribute("data-disable-swipe") !== "true") {
      var startX = null;
      slider.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener("touchend", function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
        startX = null;
      });
    }

    go(0);
  });

  // ---- Quote form: preselect the request type from ?request=emergency|planned|exchange|technical ----
  var requestSelect = document.querySelector('form[name="parts-quote"] select[name="request"]');
  if (requestSelect) {
    var wanted = new URLSearchParams(location.search).get("request");
    if (wanted && requestSelect.querySelector('option[value="' + wanted.replace(/[^a-z]/g, "") + '"]')) {
      requestSelect.value = wanted;
    }
  }

  // ---- Tabs ----
  document.querySelectorAll(".w-tabs").forEach(function (tabs) {
    var links = tabs.querySelectorAll(".w-tab-link");
    var panes = tabs.querySelectorAll(".w-tab-pane");
    var fadeIn = parseInt(tabs.getAttribute("data-duration-in"), 10) || 300;

    // Each tab is addressable as #<label>, e.g. /resources#whitepaper, so the nav dropdown can deep-link.
    function slug(link) {
      return link.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    function activate(link) {
      var name = link.getAttribute("data-w-tab");
      links.forEach(function (l) { l.classList.toggle("w--current", l === link); });
      panes.forEach(function (pane) {
        var active = pane.getAttribute("data-w-tab") === name;
        pane.classList.toggle("w--tab-active", active);
        if (active) {
          pane.style.opacity = 0;
          pane.style.transition = "opacity " + fadeIn + "ms ease";
          requestAnimationFrame(function () { pane.style.opacity = 1; });
        }
      });
    }

    function fromHash() {
      var hash = decodeURIComponent(location.hash.slice(1));
      if (!hash) return;
      links.forEach(function (link) {
        if (slug(link) !== hash) return;
        activate(link);
        tabs.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        activate(link);
        history.replaceState(null, "", "#" + slug(link));
      });
    });
    window.addEventListener("hashchange", fromHash);
    fromHash();
  });
})();
