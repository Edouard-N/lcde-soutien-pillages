/* Mesure d'audience : Google Analytics 4 (propriété Le Café de l'E-Commerce),
   chargé uniquement après accord explicite du visiteur (recommandations CNIL). */
(function () {
  'use strict';

  var GA_ID = 'G-PDNL149Q3F';
  var STORAGE_KEY = 'lcde-soutien-consent';
  var MAX_AGE = 1000 * 60 * 60 * 24 * 180; // on redemande après 6 mois

  var banner = document.getElementById('cookie-banner');
  var loaded = false;

  function readConsent() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && Date.now() - saved.date < MAX_AGE) return saved.value;
    } catch (e) { /* stockage indisponible : on redemandera */ }
    return null;
  }

  function saveConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: value, date: Date.now() })); } catch (e) {}
  }

  function loadGA() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function clearGACookies() {
    var host = location.hostname;
    var root = host.split('.').slice(-2).join('.');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        [host, '.' + host, '.' + root].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
        });
      }
    });
  }

  function showBanner() { banner.hidden = false; }
  function hideBanner() { banner.hidden = true; }

  banner.querySelector('[data-consent="accept"]').addEventListener('click', function () {
    saveConsent('granted');
    hideBanner();
    loadGA();
  });
  banner.querySelector('[data-consent="refuse"]').addEventListener('click', function () {
    var wasLoaded = loaded;
    saveConsent('denied');
    hideBanner();
    clearGACookies();
    if (wasLoaded) location.reload();
  });
  document.querySelectorAll('[data-open-cookies]').forEach(function (btn) {
    btn.addEventListener('click', showBanner);
  });

  var consent = readConsent();
  if (consent === 'granted') loadGA();
  else if (consent === null) showBanner();

  /* Événements envoyés seulement si GA est chargé (donc après accord) */
  window.lcdeTrack = function (name, params) {
    if (loaded && window.gtag) window.gtag('event', name, params || {});
  };
})();
