# soutien.lecafedelecommerce.fr

Page solidaire du Café de l'E-Commerce. Elle liste les cagnottes **vérifiées** des commerces pillés et vandalisés le 17 octobre 2026, et permet d'en proposer de nouvelles via un formulaire Netlify (vérification manuelle avant publication).

Site statique, sans build : HTML, CSS et JS vanilla.

```
analytics.js          bandeau cookies + Google Analytics (après accord)
index.html            page principale + formulaires Netlify (nouvelle-cagnotte, signalement)
merci.html            page de confirmation (repli si JavaScript est désactivé)
styles.css            charte LCDE : jaune #FEDB01, Space Grotesk, Glacial Indifference
app.js                affichage des cagnottes, filtres par ville, recherche, envoi AJAX des formulaires
data/cagnottes.json   la liste des cagnottes (source de vérité du site)
assets/               logos LCDE, police, favicon, image de partage (og-image.png)
netlify.toml          en-têtes de sécurité et de cache
```

## Ajouter une cagnotte après vérification

1. Vérifier la cagnotte : article de presse, page Facebook ou Instagram officielle du commerce, ou contact direct.
2. Ajouter un objet dans `data/cagnottes.json` :

```json
{
  "id": "ville-nom-du-commerce",
  "ville": "Paris",
  "quartier": "Rue de Rivoli (1er)",
  "boutique": "Nom de la boutique (titre de la carte)",
  "activite": "Librairie, Vêtements…",
  "titre_cagnotte": "Titre de la cagnotte sur la plateforme",
  "organisateur": "Qui a lancé la cagnotte",
  "plateforme": "Leetchi",
  "lien": "https://www.leetchi.com/fr/c/…",
  "image": "/assets/cagnottes/ville-nom-du-commerce.jpg",
  "source": { "nom": "Le Parisien", "url": "https://…" },
  "fiabilite": "presse",
  "remarque": "",
  "alerte": false,
  "publie": true
}
```

- `fiabilite` : `presse` (un article cite la cagnotte), `boutique` (le compte officiel du commerce la relaie), `mention` (la presse l'évoque sans lien), `plateforme` (page de collecte uniquement), ou `non-confirmee` (jamais affichée).
- `boutique` s'affiche en titre de la carte, `activite` juste au-dessus (laisser vide si inconnue). `titre_cagnotte` sert à la recherche.
- `image` : photo de la carte, au format 16/9 (idéalement 800×450, en JPEG). On peut reprendre l'image d'en-tête de la page Leetchi. Sans image, la carte affiche le nom de la boutique sur fond jaune.
- `source` : `null` s'il n'y a pas d'article.
- `alerte: true` affiche la remarque en rouge (ex. : « pas une collecte officielle », « attention aux fausses cagnottes »).
- `publie: false` garde l'entrée dans le fichier sans l'afficher.
- Les liens doivent commencer par `https://`, sinon la cagnotte n'est pas affichée.

3. Après une modification de `styles.css` ou `app.js`, incrémenter `?v=` dans `index.html` (et `merci.html` pour le CSS).
4. Mettre à jour la date « Données mises à jour le » dans le pied de page de `index.html`.
5. Commit + push : Netlify redéploie automatiquement.

## Mesure d'audience

Google Analytics 4, même propriété que lecafedelecommerce.fr (`G-PDNL149Q3F`, dans `analytics.js`). GA n'est chargé qu'après un clic sur « Accepter » dans le bandeau cookies (choix mémorisé 6 mois, modifiable via « Gérer les cookies » en pied de page). Seuls les visiteurs qui acceptent sont comptés.

Pour isoler ce site dans GA : filtrer sur **Nom d'hôte = soutien.lecafedelecommerce.fr**.

Événements envoyés :

| Événement | Quand | Paramètres |
|---|---|---|
| `don_click` | clic sur « Faire un don » ou sur la photo | `boutique`, `ville`, `fiabilite`, `emplacement` (bouton / photo) |
| `source_click` | clic sur la source (article, Instagram) | `boutique`, `source` |
| `filtre_ville` | clic sur un filtre de ville | `ville` |
| `search` | recherche validée | `search_term` |
| `generate_lead` | proposition de cagnotte envoyée | `form_name` |
| `signalement_envoye` | signalement envoyé | `form_name` |

Pour voir `boutique`, `ville`, etc. dans les rapports : *Admin → Définitions personnalisées → Créer une dimension personnalisée* (portée : événement) pour chaque paramètre.

## Déploiement Netlify

- Publish directory : `.` (pas de commande de build).
- **Forms** : dans *Site configuration → Forms*, activer **Form detection**, puis redéployer. Deux formulaires apparaissent : `nouvelle-cagnotte` et `signalement`.
- Notifications : *Forms → Form notifications → Add notification → Email notification* pour recevoir chaque proposition par e-mail.
- Domaine : ajouter `soutien.lecafedelecommerce.fr` dans *Domain management*, puis un enregistrement CNAME `soutien` → `<site>.netlify.app`.

## Prévisualiser en local

```bash
python3 -m http.server 8791
```

Puis ouvrir http://localhost:8791 (la liste est chargée par `fetch`, elle ne s'affiche pas en `file://`). Les formulaires ne fonctionnent qu'une fois déployés sur Netlify.
