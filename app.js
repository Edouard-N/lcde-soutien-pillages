(function () {
  'use strict';

  var FIABILITE = {
    presse: { label: 'Confirmée par la presse', cls: 'badge-presse', ordre: 0 },
    boutique: { label: 'Confirmée par la boutique', cls: 'badge-presse', ordre: 1 },
    mention: { label: 'Mentionnée par la presse', cls: 'badge-mention', ordre: 2 },
    plateforme: { label: 'Source : page de la cagnotte', cls: 'badge-plateforme', ordre: 3 }
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

  function track(name, params) {
    if (window.lcdeTrack) window.lcdeTrack(name, params);
  }

  function isSafeUrl(url) {
    return /^https:\/\//i.test(url || '');
  }

  function icon(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + path + '" fill="currentColor"/></svg>';
  }
  var ICON = {
    pin: icon('M12 2a7 7 0 0 1 7 7c0 5.2-7 13-7 13S5 14.2 5 9a7 7 0 0 1 7-7Zm0 4.5A2.5 2.5 0 1 0 12 11.5 2.5 2.5 0 0 0 12 6.5Z'),
    user: icon('M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5Z'),
    check: icon('M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4-6 6Z'),
    info: icon('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm1 8h-2v7h2v-7Zm0-3.5h-2v2h2v-2Z'),
    alert: icon('M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-7h-2v5h2V9Z'),
    arrow: icon('M13.2 5.3 19.9 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.1l-4.3-4.3 1.4-1.4Z'),
    external: icon('M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z')
  };

  function iconLine(cls, svg, text) {
    var row = el('p', { class: 'card-line ' + cls });
    row.innerHTML = svg;
    row.appendChild(el('span', { text: text }));
    return row;
  }

  function renderCard(c) {
    var f = FIABILITE[c.fiabilite] || FIABILITE.plateforme;
    var nom = c.boutique || c.titre_cagnotte;
    var newTab = ' (s’ouvre dans un nouvel onglet)';

    // Photo cliquable (doublon du bouton, retiré de la tabulation)
    var media = el('a', { class: 'card-media', href: c.lien, target: '_blank', rel: 'noopener noreferrer', tabindex: '-1', 'aria-hidden': 'true' });
    // Sans photo : nom de la boutique sur fond jaune
    var placeholder = function () {
      media.classList.add('is-empty');
      media.appendChild(el('span', { class: 'card-placeholder', text: nom }));
    };
    if (c.image) {
      var img = el('img', { src: c.image, alt: '', loading: 'lazy', decoding: 'async', width: '800', height: '450' });
      img.addEventListener('error', function () { img.remove(); placeholder(); });
      media.appendChild(img);
    } else {
      placeholder();
    }
    media.appendChild(el('span', { class: 'card-city', text: c.ville }));

    var head = el('div', { class: 'card-head' }, [
      c.activite ? el('p', { class: 'card-kicker', text: c.activite }) : null,
      el('h3', { class: 'card-title', text: nom })
    ]);

    var lines = el('div', { class: 'card-lines' }, [
      iconLine('is-place', ICON.pin, [c.quartier, c.ville].filter(Boolean).join(', ')),
      c.organisateur ? iconLine('is-orga', ICON.user, 'Organisée par ' + c.organisateur) : null
    ]);

    var verif = el('div', { class: 'card-verif' });
    var badge = el('span', { class: 'badge ' + f.cls });
    badge.innerHTML = ICON.check;
    badge.appendChild(document.createTextNode(f.label));
    verif.appendChild(badge);
    if (c.source && isSafeUrl(c.source.url)) {
      var src = el('a', { class: 'card-source', href: c.source.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Lire l’article de ' + c.source.nom + newTab });
      src.textContent = c.source.nom;
      src.insertAdjacentHTML('beforeend', ICON.external);
      src.addEventListener('click', function () { track('source_click', { boutique: nom, source: c.source.nom }); });
      verif.appendChild(src);
    }

    var remark = null;
    if (c.remarque) {
      remark = el('p', { class: 'card-note' + (c.alerte ? ' is-alert' : '') });
      remark.innerHTML = c.alerte ? ICON.alert : ICON.info;
      remark.appendChild(el('span', { text: c.remarque }));
    }

    var cta = el('a', {
      class: 'btn btn-primary btn-block card-cta',
      href: c.lien, target: '_blank', rel: 'noopener noreferrer',
      'aria-label': 'Soutenir ' + nom + ' : faire un don sur ' + (c.plateforme || 'la plateforme de la cagnotte') + newTab
    });
    cta.innerHTML = '<span>Faire un don</span>' + ICON.arrow;
    var trackDon = function (from) {
      return function () { track('don_click', { boutique: nom, ville: c.ville, fiabilite: c.fiabilite, emplacement: from }); };
    };
    cta.addEventListener('click', trackDon('bouton'));
    media.addEventListener('click', trackDon('photo'));

    var body = el('div', { class: 'card-body' }, [head, lines, verif, remark]);
    return el('article', { class: 'card' }, [media, body, el('div', { class: 'card-foot' }, [cta])]);
  }

  function filtered() {
    var q = normalize(state.q);
    return cagnottes.filter(function (c) {
      if (state.ville !== 'Toutes' && c.ville !== state.ville) return false;
      if (!q) return true;
      return normalize([c.boutique, c.activite, c.titre_cagnotte, c.ville, c.quartier, c.organisateur].join(' ')).indexOf(q) !== -1;
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
        track('filtre_ville', { ville: v });
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
  searchInput.addEventListener('change', function () {
    if (searchInput.value.trim().length > 1) track('search', { search_term: searchInput.value.trim() });
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
    track('generate_lead', { form_name: 'nouvelle-cagnotte' });
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
    track('signalement_envoye', { form_name: 'signalement' });
    formSignalement.querySelector('.form-success-inline').hidden = false;
  });
})();
