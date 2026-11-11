/*
 * CardWise AI — visual enhancement layer
 * ---------------------------------------------------------------------------
 * Purely presentational. This script never reads or writes application state,
 * never attaches handlers to app controls, and never changes text the app
 * renders. It only:
 *   - adds classes/data-attributes to existing card-visual elements so the
 *     theme stylesheet can render them as realistic physical cards,
 *   - appends aria-hidden decorative nodes (chip, sheen, logos, card number),
 *   - prepends aria-hidden mini card visuals to catalog / portfolio / policy
 *     listings,
 *   - drives a cursor-following tilt and a gentle scroll fade-in.
 * If this file fails to load, the app works exactly as before.
 */
(function () {
  "use strict";

  var LOGO_DIR = "/img/logos/";
  var ISSUER_LOGOS = {
    hdfc: { file: "hdfc.svg", name: "HDFC Bank" },
    icici: { file: "icici.svg", name: "ICICI Bank" },
    axis: { file: "axis.svg", name: "Axis Bank" },
    sbi: { file: "sbi-card.svg", name: "SBI Card" },
    amex: { file: "amex.svg", name: "American Express" }
  };
  var NETWORK_LOGOS = {
    visa: { file: "visa.svg", name: "VISA" },
    mastercard: { file: "mastercard.svg", name: "Mastercard" },
    amex: { file: "amex.svg", name: "AMEX" },
    rupay: { file: "rupay.svg", name: "RuPay" }
  };

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var uid = 0;

  /* ------------------------------------------------------------------ utils */
  function txt(el) {
    return el ? (el.textContent || "").trim() : "";
  }

  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function issuerKey(issuer) {
    var s = (issuer || "").toLowerCase();
    if (s.indexOf("hdfc") > -1) return "hdfc";
    if (s.indexOf("icici") > -1) return "icici";
    if (s.indexOf("axis") > -1) return "axis";
    if (s.indexOf("sbi") > -1 || s.indexOf("state bank") > -1) return "sbi";
    if (s.indexOf("american express") > -1 || s.indexOf("amex") > -1) return "amex";
    if (s.indexOf("chase") > -1) return "chase";
    return null;
  }

  function networkFromText(s) {
    s = (s || "").toLowerCase();
    var order = [
      ["mastercard", s.indexOf("mastercard")],
      ["visa", s.indexOf("visa")],
      ["amex", s.indexOf("american express") > -1 ? s.indexOf("american express") : s.indexOf("amex")],
      ["rupay", s.indexOf("rupay")]
    ].filter(function (p) { return p[1] > -1; });
    order.sort(function (a, b) { return a[1] - b[1]; });
    return order.length ? order[0][0] : null;
  }

  /* Material finish & network per product (visual only). */
  function profile(name, issuer, networkText) {
    var s = ((name || "") + " " + (issuer || "")).toLowerCase();
    var p;
    if (s.indexOf("amazon") > -1) p = { finish: "glossy-ink", net: "visa", holo: false };
    else if (s.indexOf("cashback") > -1 || issuerKey(s) === "sbi") p = { finish: "matte", net: "visa", holo: false };
    else if (s.indexOf("millennia") > -1 || issuerKey(s) === "hdfc") p = { finish: "glossy-blue", net: "mastercard", holo: false };
    else if (s.indexOf("flipkart") > -1 || issuerKey(s) === "axis") p = { finish: "pearl", net: "mastercard", holo: false };
    else if (s.indexOf("smartearn") > -1 || issuerKey(s) === "amex") p = { finish: "metal", net: "amex", holo: true };
    else p = { finish: "graphite", net: networkFromText(networkText), holo: false };
    var fromText = networkFromText(networkText);
    if (!p.net && fromText) p.net = fromText;
    return p;
  }

  function holderName() {
    var n = txt(document.querySelector("header .truncate")) || "";
    n = n.replace(/\s+/g, " ").trim();
    if (!n || n.toLowerCase() === "cardholder") return "CARDHOLDER";
    return n.toUpperCase().slice(0, 24);
  }

  function pseudoDetails(seed) {
    var h = hash(seed);
    var last4 = String(1000 + (h % 9000));
    var mm = String((h % 12) + 1).padStart(2, "0");
    var yy = String(28 + ((h >>> 8) % 4));
    return { last4: last4, expiry: mm + "/" + yy };
  }

  /* Preload logos once so text badges only switch to a logo when it exists. */
  var logoState = {};
  function whenLogo(file, cb) {
    var st = logoState[file];
    if (st === true) return cb(true);
    if (st === false) return cb(false);
    if (Array.isArray(st)) return st.push(cb);
    logoState[file] = [cb];
    var img = new Image();
    img.onload = function () { var q = logoState[file]; logoState[file] = true; q.forEach(function (f) { f(true); }); };
    img.onerror = function () { var q = logoState[file]; logoState[file] = false; q.forEach(function (f) { f(false); }); };
    img.src = LOGO_DIR + file;
  }

  /* ---------------------------------------------------------- card pieces */
  function chipSVG() {
    var id = "cwchip" + (++uid);
    return '<svg viewBox="0 0 52 40" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#f6e3b0"/><stop offset=".32" stop-color="#cda552"/>' +
      '<stop offset=".58" stop-color="#f2da9c"/><stop offset="1" stop-color="#9e772a"/></linearGradient></defs>' +
      '<rect width="52" height="40" rx="6" fill="url(#' + id + ')"/>' +
      '<g fill="none" stroke="#6a4c14" stroke-opacity=".72" stroke-width=".7">' +
      '<path d="M0 13.5h16M0 26.5h16M36 13.5h16M36 26.5h16M16 0v8M36 0v8M16 32v8M36 32v8M16 20h20"/>' +
      '<rect x="16" y="8" width="20" height="24" rx="4.5"/></g>' +
      '<path d="M0 0h52v14H0z" fill="#fff" opacity=".12"/></svg>';
  }

  var CONTACTLESS_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true" focusable="false">' +
    '<path d="M7.2 9a4.5 4.5 0 0 1 0 6"/><path d="M10.6 6.6a8 8 0 0 1 0 10.8"/>' +
    '<path d="M14 4.2a11.5 11.5 0 0 1 0 15.6"/><path d="M17.4 1.8a15 15 0 0 1 0 20.4"/></svg>';

  function logoImg(file, alt, onFail, onOk) {
    var img = el("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.draggable = false;
    img.addEventListener("error", onFail, { once: true });
    if (onOk) img.addEventListener("load", onOk, { once: true });
    img.src = LOGO_DIR + file;
    return img;
  }

  function issuerNode(issuer, onLogo) {
    var key = issuerKey(issuer);
    var wrap = el("div", "cw-issuer");
    if (key) wrap.setAttribute("data-issuer", key);
    var info = key && ISSUER_LOGOS[key];
    var label = issuer || "";
    if (info) {
      var img = logoImg(info.file, info.name, function () {
        wrap.textContent = "";
        wrap.appendChild(el("span", "cw-issuer-text", label));
        if (onLogo) onLogo(false);
      }, function () { if (onLogo) onLogo(true); });
      wrap.appendChild(img);
    } else if (label) {
      wrap.appendChild(el("span", "cw-issuer-text", label));
      if (onLogo) onLogo(false);
    }
    return wrap;
  }

  function networkNode(net) {
    if (!net || !NETWORK_LOGOS[net]) return null;
    var info = NETWORK_LOGOS[net];
    var wrap = el("div", "cw-network");
    wrap.setAttribute("data-net", net);
    wrap.appendChild(logoImg(info.file, info.name, function () {
      wrap.textContent = "";
      var t = el("span", "cw-issuer-text", info.name);
      wrap.appendChild(t);
    }));
    return wrap;
  }

  function layerBase() {
    var layer = el("div", "cw-layer");
    layer.setAttribute("aria-hidden", "true");
    layer.appendChild(el("div", "cw-holo"));
    layer.appendChild(el("div", "cw-sheen"));
    layer.appendChild(el("div", "cw-edge"));
    return layer;
  }

  function addFurniture(layer, o) {
    if (o.chip) {
      var chip = el("div", "cw-chip");
      chip.innerHTML = chipSVG();
      layer.appendChild(chip);
    }
    if (o.contactless) {
      var cl = el("div", "cw-contactless");
      cl.innerHTML = CONTACTLESS_SVG;
      layer.appendChild(cl);
    }
    if (o.number) layer.appendChild(el("div", "cw-number", o.number));
    if (o.holder) {
      var meta = el("div", "cw-meta");
      meta.appendChild(el("span", "cw-holder", o.holder));
      var valid = el("span", "cw-valid");
      var small = el("small");
      small.appendChild(document.createTextNode("VALID"));
      small.appendChild(el("br"));
      small.appendChild(document.createTextNode("THRU"));
      valid.appendChild(small);
      valid.appendChild(document.createTextNode(o.expiry));
      meta.appendChild(valid);
      layer.appendChild(meta);
    }
    if (o.issuer !== undefined) layer.appendChild(issuerNode(o.issuer, o.onLogo));
    if (o.product) layer.appendChild(el("div", "cw-product", o.product));
    var nn = networkNode(o.net);
    if (nn) layer.appendChild(nn);
  }

  function applyMaterial(card, prof) {
    card.setAttribute("data-finish", prof.finish);
    if (prof.holo) card.setAttribute("data-holo", "1");
    else card.removeAttribute("data-holo");
  }

  /* A fully self-built card (for listings). */
  function buildMini(name, issuer, networkText, size) {
    var prof = profile(name, issuer, networkText);
    var d = pseudoDetails(name + "|" + issuer);
    var card = el("div", "cw-card cw-mini" + (size ? " cw-" + size : ""));
    card.setAttribute("aria-hidden", "true");
    applyMaterial(card, prof);
    var layer = layerBase();
    addFurniture(layer, {
      chip: true,
      contactless: true,
      number: "•••• •••• •••• " + d.last4,
      holder: holderName(),
      expiry: d.expiry,
      issuer: issuer,
      product: name,
      net: prof.net
    });
    card.appendChild(layer);
    bindTilt(card);
    return card;
  }

  /* ---------------------------------------------------------------- tilt */
  function bindTilt(card) {
    if (card.getAttribute("data-cw-tilt")) return;
    card.setAttribute("data-cw-tilt", "1");
    var raf = 0;
    function canTilt(e) {
      return !reduceMotion.matches && finePointer.matches && (!e.pointerType || e.pointerType === "mouse" || e.pointerType === "pen");
    }
    card.addEventListener("pointermove", function (e) {
      if (!canTilt(e)) return;
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        card.classList.add("is-tilting");
        card.style.setProperty("--cw-ry", ((x - 0.5) * 12).toFixed(2) + "deg");
        card.style.setProperty("--cw-rx", ((0.5 - y) * 10).toFixed(2) + "deg");
        card.style.setProperty("--cw-mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--cw-my", (y * 100).toFixed(1) + "%");
      });
    });
    card.addEventListener("pointerleave", function () {
      cancelAnimationFrame(raf);
      card.classList.remove("is-tilting");
      card.style.setProperty("--cw-rx", "0deg");
      card.style.setProperty("--cw-ry", "0deg");
      card.style.setProperty("--cw-mx", "30%");
      card.style.setProperty("--cw-my", "20%");
    });
  }

  /* ------------------------------------------------------- decorators */
  function replaceLayer(card, layer) {
    var old = card.querySelector(":scope > .cw-layer");
    if (old) old.remove();
    card.appendChild(layer);
  }

  // Page-intro showcase card ("CardWise Private Reserve")
  function decorateHero(card) {
    var holder = holderName();
    var key = "hero|" + holder;
    if (card.getAttribute("data-cw-key") === key) return;
    card.setAttribute("data-cw-key", key);
    card.classList.add("cw-card", "cw-hero");
    applyMaterial(card, { finish: "black-metal", holo: true });
    var layer = layerBase();
    addFurniture(layer, { holder: holder, expiry: "08/30", net: "mastercard" });
    replaceLayer(card, layer);
    bindTilt(card);
  }

  // Recommended card in the Purchase Advisor
  function decorateRecommended(card) {
    var rows = card.children;
    var issuer = txt(rows[0] && rows[0].children[0]);
    var name = txt(rows[1] && rows[1].children[0]);
    var holder = holderName();
    var key = "rec|" + issuer + "|" + name + "|" + holder;
    if (card.getAttribute("data-cw-key") !== key) {
      card.setAttribute("data-cw-key", key);
      card.classList.add("cw-card", "cw-rec");
      card.removeAttribute("data-logo");
      var prof = profile(name, issuer, "");
      applyMaterial(card, prof);
      var d = pseudoDetails(name + "|" + issuer);
      var layer = layerBase();
      addFurniture(layer, {
        chip: true,
        number: "•••• •••• •••• " + d.last4,
        holder: holder,
        expiry: d.expiry,
        issuer: issuerKey(issuer) && ISSUER_LOGOS[issuerKey(issuer)] ? issuer : undefined,
        onLogo: function (ok) { if (ok) card.setAttribute("data-logo", "ok"); else card.removeAttribute("data-logo"); },
        net: prof.net
      });
      replaceLayer(card, layer);
      bindTilt(card);
    }
    decorateDeck(card, name);
  }

  // Stack of the other evaluated cards fanned behind the recommendation
  function decorateDeck(card, recName) {
    var host = card.parentElement;
    if (!host) return;
    var others = [];
    document.querySelectorAll("main label.rounded-xl.border").forEach(function (lab) {
      var cb = lab.querySelector('input[type="checkbox"]');
      var nm = txt(lab.querySelector("span.font-semibold"));
      if (cb && cb.checked && nm && nm !== recName && others.indexOf(nm) === -1) others.push(nm);
    });
    others = others.slice(0, 2);
    var key = others.join("|");
    var deck = host.querySelector(":scope > .cw-deck");
    if (!others.length) {
      if (deck) deck.remove();
      host.removeAttribute("data-cw-deck-host");
      return;
    }
    if (deck && deck.getAttribute("data-cw-key") === key) return;
    if (deck) deck.remove();
    deck = el("div", "cw-deck");
    deck.setAttribute("aria-hidden", "true");
    deck.setAttribute("data-cw-key", key);
    others.forEach(function (nm) {
      var c = buildMini(nm, "", "", null);
      c.removeAttribute("data-cw-tilt");
      deck.appendChild(c);
    });
    host.setAttribute("data-cw-deck-host", "");
    host.insertBefore(deck, host.firstChild);
  }

  function markIssuerBadge(badge) {
    if (!badge) return;
    var key = issuerKey(txt(badge));
    var info = key && ISSUER_LOGOS[key];
    if (!info) { badge.removeAttribute("data-cw-issuer"); return; }
    if (badge.getAttribute("data-cw-issuer") === key) return;
    whenLogo(info.file, function (ok) {
      if (ok && issuerKey(txt(badge)) === key) badge.setAttribute("data-cw-issuer", key);
    });
  }

  function prependMini(host, marker, name, issuer, network, size) {
    var key = name + "|" + issuer + "|" + network + "|" + holderName();
    var existing = host.querySelector(":scope > .cw-mini");
    if (existing && existing.getAttribute("data-cw-key") === key) return;
    if (existing) existing.remove();
    var mini = buildMini(name, issuer, network, size);
    mini.setAttribute("data-cw-key", key);
    host.setAttribute(marker, "");
    host.insertBefore(mini, host.firstChild);
  }

  // Card Catalog listings
  function decorateCatalog() {
    document.querySelectorAll("main .grid.grid-cols-1.gap-4 > div.rounded-2xl.border").forEach(function (item) {
      var header = item.firstElementChild;
      var h3 = item.querySelector("h3");
      if (!header || !h3) return;
      var badge = header.querySelector("span.uppercase");
      var issuer = txt(badge);
      var network = "";
      header.querySelectorAll("span").forEach(function (s) {
        var t = txt(s);
        if (t.indexOf("Network:") === 0) network = t.replace("Network:", "").trim();
      });
      prependMini(header, "data-cw-has-mini", txt(h3), issuer, network, null);
      markIssuerBadge(badge);
    });
  }

  // Policy Assistant selected-card summary
  function decoratePolicy() {
    document.querySelectorAll("main div.mt-3\\.5.p-3.rounded-xl").forEach(function (row) {
      var name = txt(row.querySelector("span.font-bold"));
      var badge = row.querySelector("span.rounded-full");
      if (!name || !badge) return;
      prependMini(row, "data-cw-has-sm", name, txt(badge), "", "sm");
      markIssuerBadge(badge);
    });
  }

  // Portfolio rows in the "My Cards" modal
  function decoratePortfolio() {
    document.querySelectorAll(".fixed.inset-0 .space-y-2\\.5 > div.p-3\\.5.rounded-xl.border").forEach(function (row) {
      var name = txt(row.querySelector("span.font-bold"));
      var badge = row.querySelector("span.rounded-full");
      if (!name) return;
      prependMini(row, "data-cw-has-xs", name, txt(badge), "", "xs");
      markIssuerBadge(badge);
    });
  }

  /* --------------------------------------------------------- scroll reveal */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.setAttribute("data-cw-reveal", "in");
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 }) : null;

  var REVEAL_SEL = "main .premium-sheen, main .rounded-2xl.border";
  function reveal() {
    if (!io || reduceMotion.matches) return;
    document.querySelectorAll(REVEAL_SEL).forEach(function (n) {
      if (n.hasAttribute("data-cw-reveal")) return;
      if (n.closest(".fixed")) return;
      var parent = n.parentElement && n.parentElement.closest(REVEAL_SEL.replace(/main /g, ""));
      if (parent && parent.closest("main")) { n.setAttribute("data-cw-reveal", "skip"); return; }
      n.setAttribute("data-cw-reveal", "pending");
      io.observe(n);
    });
  }

  /* ---------------------------------------------------------------- scan */
  function scan() {
    try {
      document.querySelectorAll("div.w-60.h-38").forEach(decorateHero);
      document.querySelectorAll("div.w-48.h-28").forEach(decorateRecommended);
      decorateCatalog();
      decoratePolicy();
      decoratePortfolio();
      reveal();
    } catch (err) {
      if (window.console && console.warn) console.warn("[cardwise-theme]", err);
    }
  }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; scan(); });
  }

  function start() {
    var root = document.getElementById("root") || document.body;
    new MutationObserver(queue).observe(root, { childList: true, subtree: true, characterData: true });
    // checkbox state changes don't mutate the DOM tree; keep the deck in sync
    document.addEventListener("change", queue, true);
    queue();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
