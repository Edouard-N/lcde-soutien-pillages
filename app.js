(function () {
  'use strict';

  var FIABILITE = {
    presse: { label: 'Confirmée par la presse', cls: 'badge-presse', ordre: 0 },
    mention: { label: 'Mentionnée par la presse', cls: 'badge-mention', ordre: 1 },
    plateforme: { label: 'Source : page de la cagnotte', cls: 'badge-plateforme', ordre: 2 }
  };

  var grid = document.getElementById('cagnottes-grid');
  var searchInput = document.getElementById('search');
  var filtersEl = document.getElementById('city-filters');
  var countEl = document.getElementById('results-count');

  var cagnottes = [];
  var state = { ville: 'Toutes', q: '' };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function normalize(s) {
    return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function isSafeUrl(url) {
    return /^https:\/\//i.test(url || '');
  }

  var EXTERNAL_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="currentColor"/></svg>';

  function renderCard(c) {
    var f = FIABILITE[c.fiabilite] || FIABILITE.plateforme;

    var top = el('div', { class: 'card-top' }, [
      el('span', { class: 'city', text: c.ville }),
      c.quartier ? el('span', { class: 'place', text: c.quartier }) : null
    ]);

    var meta = el('dl', { class: 'meta' }, [
      el('div', null, [el('dt', { text: 'Organisée par' }), el('dd', { text: c.organisateur || 'Non précisé' })]),
      el('div', null, [el('dt', { text: 'Plateforme' }), el('dd', { text: c.plateforme || 'Non précisée' })])
    ]);

    var verif = el('div', { class: 'verif' }, [el('span', { class: 'badge ' + f.cls, text: f.label })]);
    if (c.source && isSafeUrl(c.source.url)) {
      verif.appendChild(el('a', {
        href: c.source.url, target: '_blank', rel: 'noopener noreferrer',
        text: 'Lire la source (' + c.source.nom + ')'
      }));
    }

    var remark = null;
    if (c.remarque) {
      remark = el('p', { class: 'remark' + (c.alerte ? ' is-alert' : '') });
      if (c.alerte) remark.appendChild(el('strong', { text: 'À savoir : ' }));
      remark.appendChild(document.createTextNode(c.remarque));
    }

    var cta = el('a', {
      class: 'btn btn-primary btn-block',
      href: c.lien, target: '_blank', rel: 'noopener noreferrer',
      'aria-label': 'Participer à la cagnotte « ' + c.commerce + ' » sur ' + (c.plateforme || 'la plateforme') + ' (nouvel onglet)'
    });
    cta.innerHTML = 'Participer sur ' + (c.plateforme || 'la plateforme') + ' ' + EXTERNAL_ICON;

    var media = el('div', { class: 'card-media' });
    if (c.image) {
      var img = el('img', { src: c.image, alt: 'Photo de la cagnotte « ' + c.commerce + ' »', loading: 'lazy', decoding: 'async', width: '800', height: '450' });
      img.addEventListener('error', function () { media.classList.add('is-empty'); img.remove(); });
      media.appendChild(img);
    } else {
      media.classList.add('is-empty');
    }

    var body = el('div', { class: 'card-body' }, [top, el('h3', { text: c.commerce }), meta, verif, remark, cta]);
    return el('article', { class: 'card' }, [media, body]);
  }

  function filtered() {
    var q = normalize(state.q);
    return cagnottes.filter(function (c) {
      if (state.ville !== 'Toutes' && c.ville !== state.ville) return false;
      if (!q) return true;
      return normalize([c.commerce, c.ville, c.quartier, c.organisateur].join(' ')).indexOf(q) !== -1;
    });
  }

  function render() {
    var list = filtered();
    grid.innerHTML = '';
    if (!list.length) {
      grid.appendChild(el('p', {
        class: 'empty',
        html: 'Aucune cagnotte ne correspond à votre recherche. Vous en connaissez une ? <a href="#proposer">Proposez-la</a>.'
      }));
    } else {
      list.forEach(function (c) { grid.appendChild(renderCard(c)); });
    }
    countEl.textContent = !list.length ? 'Aucune cagnotte affichée'
      : list.length + (list.length > 1 ? ' cagnottes affichées' : ' cagnotte affichée');
  }

  function renderFilters() {
    var counts = {};
    cagnottes.forEach(function (c) { counts[c.ville] = (counts[c.ville] || 0) + 1; });
    var villes = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'fr'); });

    filtersEl.innerHTML = '';
    ['Toutes'].concat(villes).forEach(function (v) {
      var btn = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.ville === v) });
      btn.textContent = v;
      btn.appendChild(el('span', { class: 'count', text: String(v === 'Toutes' ? cagnottes.length : counts[v]) }));
      btn.addEventListener('click', function () {
        state.ville = v;
        Array.prototype.forEach.call(filtersEl.children, function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        render();
      });
      filtersEl.appendChild(btn);
    });

    document.getElementById('stat-cagnottes').textContent = cagnottes.length;
    document.getElementById('stat-villes').textContent = villes.length;
  }

  fetch('/data/cagnottes.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      cagnottes = data
        .filter(function (c) { return c.publie && isSafeUrl(c.lien) && FIABILITE[c.fiabilite]; })
        .sort(function (a, b) {
          return FIABILITE[a.fiabilite].ordre - FIABILITE[b.fiabilite].ordre || a.ville.localeCompare(b.ville, 'fr');
        });
      renderFilters();
      render();
    })
    .catch(function () {
      grid.innerHTML = '';
      grid.appendChild(el('p', { class: 'empty', text: 'La liste des cagnottes n’a pas pu être chargée. Rechargez la page dans quelques instants.' }));
    });

  var searchTimer;
  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.q = searchInput.value; render(); }, 120);
  });

  /* Formulaires Netlify (envoi AJAX, repli sur /merci.html sans JS) */
  function validate(form) {
    var firstInvalid = null;
    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (input) {
      if (input.name === 'bot-field' || input.type === 'hidden') return;
      var target = input.type === 'checkbox' ? input.closest('.consent') : input;
      var ok = input.checkValidity();
      if (target) target.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    return firstInvalid;
  }

  function submitNetlify(form, onSuccess) {
    var errorEl = form.querySelector('.form-error');
    var submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorEl.hidden = true;

      var invalid = validate(form);
      if (invalid) {
        errorEl.textContent = 'Merci de compléter les champs obligatoires (les liens doivent commencer par https://).';
        errorEl.hidden = false;
        invalid.focus();
        return;
      }

      submitBtn.disabled = true;
      var label = submitBtn.textContent;
      submitBtn.textContent = 'Envoi en cours…';

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          onSuccess();
        })
        .catch(function () {
          errorEl.textContent = 'L’envoi a échoué. Vérifiez votre connexion et réessayez.';
          errorEl.hidden = false;
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = label;
        });
    });

    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.getAttribute('aria-invalid') === 'true' && t.checkValidity()) {
        (t.type === 'checkbox' ? t.closest('.consent') : t).classList.remove('is-invalid');
        t.setAttribute('aria-invalid', 'false');
      }
    });
  }

  var formCagnotte = document.getElementById('form-cagnotte');
  var success = document.getElementById('form-success');
  submitNetlify(formCagnotte, function () {
    formCagnotte.hidden = true;
    success.hidden = false;
    success.focus();
  });
  document.getElementById('form-reset').addEventListener('click', function () {
    success.hidden = true;
    formCagnotte.hidden = false;
    document.getElementById('f-commerce').focus();
  });

  var formSignalement = document.getElementById('form-signalement');
  submitNetlify(formSignalement, function () {
    formSignalement.querySelector('.form-success-inline').hidden = false;
  });
})();
