# Handoff : check-or-mate — refonte interface

## Aperçu

**check-or-mate** est une application personnelle qui récupère des parties intéressantes depuis Chess.com, les évalue avec Stockfish 16 selon 7 dimensions (sacrifice, drame, brilliance, pression horaire, finale, upset, rareté), et permet de les revoir.

Cette refonte vise à raffiner l'interface existante (sombre, monospace, accent ambre) tout en :
- Exploitant mieux l'espace horizontal sur desktop (3 colonnes)
- Conservant une excellente expérience mobile (drawers latéraux)
- Ajoutant un mode plein écran pour l'analyse approfondie d'une partie

## À propos des fichiers de design

Les fichiers de ce bundle sont des **références de design créées en HTML/React** — des prototypes montrant l'apparence et le comportement souhaités, **pas du code de production à copier directement**.

La tâche est de **recréer ces designs HTML dans l'environnement existant du codebase** (React, Vue, Svelte, etc.) en utilisant ses patterns et bibliothèques établis. Si le codebase existant a une structure de composants, des hooks, un router, des utilitaires CSS — utilise-les. N'introduis pas de nouvelles dépendances si l'équivalent existe déjà.

Les données dans `src/games-data.js` sont **factices** — à remplacer par les vraies données pipelinées depuis Chess.com.

## Fidélité

**Haute fidélité (hi-fi)** — couleurs, typographies, espacements et interactions finaux. Reproduis le pixel-près en utilisant les bibliothèques existantes du codebase.

## Stack du prototype (pour référence)

- HTML + React 18 (CDN, sans bundler)
- JSX via @babel/standalone
- CSS vanilla avec variables CSS (custom properties)
- Pas de Tailwind, pas de styled-components, pas de framework UI

Le code source est dans `src/` :
- `src/app.jsx` — composant App principal + Header, GameCard, DetailPanel, FullscreenView
- `src/components.jsx` — primitives (ChessBoard, DimBar, ScoreMatrix, ScoreStack, RangeSlider, PlayerChip)
- `src/games-data.js` — données factices et listes des joueurs/dimensions
- `src/styles.css` — tous les styles (24kb, bien organisé en sections)
- `src/tweaks-panel.jsx` — panneau de tweaks de design (à ignorer pour la prod)

## Système de design

### Couleurs

Toutes définies en variables CSS dans `:root` (voir `src/styles.css` ligne 3-30).

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#0b0a09` | Background principal (noir tiède) |
| `--panel` | `#131210` | Cards, header, boutons |
| `--panel-2` | `#1a1815` | Hover des cards, panneaux secondaires |
| `--panel-3` | `#221f1b` | Background des badges, segments |
| `--border` | `#2a2622` | Bordures par défaut |
| `--border-strong` | `#3a342d` | Bordures de hover/focus |
| `--text` | `#e9e5dc` | Texte principal |
| `--text-muted` | `#8c867a` | Texte secondaire, labels |
| `--text-dim` | `#5c574d` | Texte tertiaire, séparateurs |
| `--accent` | `#f5a524` | Accent ambre (chiffres clés, focus, scores) |
| `--accent-soft` | `rgba(245,165,36,0.12)` | Background des chips actifs |
| `--accent-line` | `rgba(245,165,36,0.32)` | Bordure de focus/sélection |
| `--sq-light` | `#ebd3b0` | Cases claires de l'échiquier |
| `--sq-dark` | `#b48560` | Cases sombres de l'échiquier |
| `--good` | `#7dd3a8` | (Réservé pour évaluations positives) |
| `--bad` | `#e8826b` | (Réservé pour évaluations négatives) |

### Typographie

Deux familles, importées depuis Google Fonts :
- **IBM Plex Mono** (400, 500, 600, 700) — titres, chiffres, codes ECO, badges, labels techniques, score
- **Inter** (400, 500, 600, 700) — corps de texte, descriptions, highlights

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Échelle typographique** :

| Usage | Famille | Taille | Poids |
|---|---|---|---|
| Score principal (fullscreen) | Mono | 72px | 600 |
| Score de card | Mono | 32px (36px si sélectionné) | 600 |
| Nom de joueur | Mono | 14px | 600 |
| Titre brand | Mono | 15px | 600 |
| Score détail | Mono | 18px | 600 |
| Corps de highlight | Inter | 13px (italic) | 400 |
| Meta (cadence, ECO, date) | Mono | 11px | 400 |
| Section label | Mono | 10px UPPERCASE, letter-spacing 0.08em | 500 |
| Eyebrow | Mono | 10px UPPERCASE, letter-spacing 0.12em | 400 |
| Base body | Inter | 14px | 400 |

### Espacement

Échelle 4pt (4, 8, 12, 16, 20, 24, 28, 32).

### Border radius

| Token | Valeur | Usage |
|---|---|---|
| `--r-sm` | `4px` | Petits badges |
| `--r` | `8px` | Boutons, inputs |
| `--r-lg` | `12px` | Cards |
| `--r-xl` | `16px` | (Réservé) |

### Ombres

- Cards : pas d'ombre, on s'appuie sur les bordures et le contraste
- Board (panneau détail) : `0 12px 36px -16px rgba(0,0,0,0.8)`
- Board (fullscreen) : `0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,0,0,0.4)`
- Drawer mobile (détail ouvert) : `-20px 0 40px -10px rgba(0,0,0,0.6)`

## Layout

### Breakpoints

| Largeur | Layout |
|---|---|
| ≥1280px | 3 colonnes : filtres 280px · liste (flex) · détail 440px |
| 1100–1279px | 3 colonnes plus serrées : filtres 240px · liste · détail 400px |
| 720–1099px | 1 colonne. Filtres et détail deviennent des drawers latéraux avec scrim |
| <720px | Header se compacte, recherche pleine largeur, libellés des boutons disparaissent |

Max-width global : 1600px, centré.

### Header

- Sticky en haut, `backdrop-filter: blur(12px)`, fond semi-transparent
- Ligne principale : brand · recherche (max 520px) · boutons outils
- Sous-ligne : compteur de parties · nombre de dimensions · moteur d'analyse · tag italique

## Écrans / Vues

### 1. Vue principale (liste + filtres + détail)

**Filtres (sidebar gauche / drawer mobile)**

Sections séparées par des `border-top: 1px dashed` :

1. **Seuils par dimension** — 7 sliders (sacrifice, drama, brilliancy, clock, endgame, upset, rarity). Range 0-100, step 1. Filtre par seuil minimum (0 = ignoré). Affiche `—` si à 0, sinon la valeur.
2. **Cadence** — segmented control 4 options : Toutes / Bullet / Blitz / Rapid
3. **Joueurs** — chips cumulatifs avec nom + rating. Cliquer active/désactive. Badge avec compte quand des joueurs sont sélectionnés.

Header de la sidebar : titre "FILTRES" + bouton "Réinitialiser" + bouton de fermeture (mobile only).

**Liste de parties (centre)**

Toolbar du haut : compteur "N parties" en gras + lien "Tout afficher" (visible quand filtres actifs).

État vide : centré, glyphe `∅`, message "Aucune partie ne passe ces filtres.", bouton "Réinitialiser".

**Card de partie**

Grille à 3 colonnes : rank 36px · body 1fr · score 80px.

Contenu :
- **Rank** : numéro `01`, `02`... (padStart 2 caractères) en mono 11px, couleur `--text-dim` (devient `--accent` quand card sélectionnée)
- **Body** :
  - Players : carré 8px coloré (blanc/noir) + nom mono 600 14px + rating mono 11px text-muted, séparés par `vs` en mono 11px text-dim
  - Card-meta : badge résultat + cadence + code ECO + date, séparés par `·`
  - Highlight (italique, text-muted) : phrase descriptive courte de la partie
  - Card-viz : visualisation des scores (selon le tweak `scoreViz`, défaut = top 3 dimensions en barres horizontales)
- **Score** : chiffre 32px mono 600 ambre + label "SCORE" 10px mono uppercase letter-spacing 0.1em

**Badges de résultat** :
- `1-0` (blanc gagne) : `rgba(245,233,212,0.12)` + couleur `#e8d6b3`
- `0-1` (noir gagne) : panneau sombre avec bordure
- `1/2-1/2` (nul) : panel-3 + text-muted

**États** :
- Hover : `border-color: --border-strong`, `background: --panel-2`
- Focus : bordure ambre
- Selected (`.card-on`) : bordure ambre + fond `--panel-2` + barre verticale ambre 3px à gauche (`box-shadow: inset 3px 0 0 var(--accent)`) + score 36px

**Click** : sélectionne la partie ; sur mobile (<1100px) ouvre le drawer détail.

**Panneau détail (sidebar droite / drawer mobile)**

Sticky, scrollable. Sections :

1. **En-tête** : eyebrow "Partie sélectionnée" + matchup blanc vs noir en mono 16px 600 + meta (ECO · ouverture · cadence · date). Boutons à droite : ⛶ plein écran (visible partout) + × fermer (mobile only).
2. **Board** + eval rail à droite (12px de large, gradient blanc, valeur affichée verticalement)
3. **Contrôles** : ⏮ ◀ "label" ▶ ⏭ + bouton "⇅ Retourner"
4. **Toutes les dimensions** : section label + score X/100. Visualisation selon le tweak (barres par défaut).
5. **Analyse** : highlight italique avec bordure ambre 2px à gauche
6. **Stats** : grille 2×N : Coups, Résultat, Cadence, Ouverture
7. **Lien Chess.com** — bouton large
8. **Raccourcis clavier** : ← → coups, F retourner, ⛶ plein écran

### 2. Vue plein écran

Déclenchée par le bouton ⛶ dans le panneau détail. `position: fixed; inset: 0; z-index: 100;` Animation d'entrée 0.2s ease-out (opacity 0→1, scale 0.98→1). Verrouille le scroll du body.

**Header (3 colonnes : 1fr · auto · 1fr)** :
- Gauche : bouton "← Retour à la liste"
- Centre : eyebrow "Partie n°N" + matchup gros (mono 18px 600) + ratings en text-dim
- Droite : bouton "Chess.com ↗" + bouton × fermer

**Body (grille : 1fr · 420px)** :

**Colonne gauche (board)** :
- Background gradient radial subtil ambre
- Board jusqu'à 75vh / 720px max, centré
- Eval rail 14px à gauche du board
- Pieces font-size: `clamp(28px, 6vh, 56px)`

Sous le board :
- **Progress bar** 8px de haut, avec dots cliquables aux positions de chaque coup. Dot actif scale 1.5 + halo ambre. Dots passés en ambre, futurs en `--panel-3`.
- Ligne de contrôles : à gauche label du coup courant + compteur "N / total" ; à droite groupe de boutons ⏮ ◀ ▶ ⏭ + séparateur + ⇅ Retourner

**Colonne droite (infos)** :
- Background `--panel`, scrollable
- **Score block** : chiffre 72px mono 600 ambre + label "SCORE GLOBAL / curated by machine" (italique)
- **Sept dimensions** : visualisation complète (barres / matrice / empilé selon tweak)
- **Analyse** : highlight italique avec bordure ambre
- **Données** : grille 2×3 (Coups, Résultat, Cadence, Ouverture, ECO, Date)
- **Raccourcis** : ← → coups, F retourner, **Esc fermer**

**Responsive** :
- <1000px : grille à 1 colonne, board au-dessus, infos en dessous
- <720px : header très compact, board 55vh, ratings cachés, contrôles empilés

## Interactions et comportements

### Navigation board

| Touche | Action |
|---|---|
| `←` | Coup précédent |
| `→` | Coup suivant |
| `Home` | Premier coup |
| `End` | Dernier coup |
| `F` | Retourner l'échiquier |
| `Esc` | Fermer le plein écran |

Désactivé quand le focus est sur un INPUT ou TEXTAREA.

### Filtres

Tous les filtres se composent (ET logique) :
- Sliders : seuil minimum sur chaque dimension. 0 = ignoré, sinon `game.dims[k] >= filter[k]`
- Joueurs : OU au sein des joueurs sélectionnés (la partie matche si **un** des deux joueurs est dans la sélection)
- Cadence : exact match
- Recherche : substring match sur nom blanc, nom noir, ouverture, ECO (lowercase)

### Tri

Options dans le `<select>` du header :
- Score global (défaut)
- Plus récentes (utilise `rank` puisque les données sont pré-triées par date)
- Chacune des 7 dimensions individuellement

### Sélection de partie

- État `selectedId` géré dans `App`
- `moveIdx` reset à 0 à chaque changement de selection (`useEffect` sur `selectedId`)
- Sur desktop : la sélection affiche la partie dans le panneau de droite (toujours visible)
- Sur mobile (<1100px) : la sélection ouvre aussi le drawer (state `detailOpenMobile`)

### Plein écran

- État `fullscreen` boolean dans `App`
- Ouvert par bouton ⛶ dans détail
- Fermé par bouton ×, "← Retour à la liste", ou touche `Esc`
- Pendant l'ouverture : `document.body.style.overflow = "hidden"` (restauré au cleanup)

### Copier le lien

- Bouton dans le header
- `navigator.clipboard.writeText(window.location.href)`
- Feedback "Copié ✓" pendant 1.5s

## Composants (à recréer dans le codebase cible)

### `ChessBoard`

Props : `position: { fen, label, move }`, `flipped: boolean`, `lastMove?: { from, to }`

- Grille 8×8 (CSS grid)
- Parse une FEN minimaliste (rangs séparés par `/`, chiffres = cases vides)
- Pièces affichées avec glyphes Unicode (♔♕♖♗♘♙♚♛♜♝♞♟)
- Coordonnées en coin haut-gauche (rang) et bas-droit (file), `font-mono 9px`
- `flipped` inverse rangs et files

**Pour la prod** : remplacer par une vraie lib (chessboard.js, react-chessboard, ou custom) qui accepte des PGN complets et permet d'animer les coups, surligner le dernier coup, afficher des annotations.

### `DimBar`

Props : `label`, `value` (0-100), `color?`, `compact?`

Grid 3 colonnes : label (110px ou 90px compact) · track (1fr) · valeur (32px ou 28px compact).
Track 4px de haut, fond `--border`, fill ambre avec transition 0.3s.

### `ScoreMatrix`

Props : `dims: { [key]: number }`, `dimensions: [{ key, short, label }]`, `mini?`

Visualisation alternative : pour chaque dimension, 10 dots (chaque dot = 10 points). Dots `--border` par défaut, dots actifs en ambre.

### `ScoreStack`

Props : `dims`, `dimensions`

Une seule barre horizontale 8px, divisée en segments proportionnels aux valeurs. Couleurs OKLCH : `oklch(0.68 0.12 [hue=i*360/n])`.

### `RangeSlider`

Props : `label`, `value`, `onChange`

Slider customisé : track avec gradient `linear-gradient(to right, --accent --pct, --border --pct)` mis à jour via `--pct` CSS custom property. Thumb 14px ambre.

### `PlayerChip`

Props : `player: { name, rating }`, `active`, `onClick`

Bouton arrondi (border-radius 999px) avec nom mono + rating en text-dim. État actif : `--accent-soft` background + `--accent-line` border.

### `GameCard`, `DetailPanel`, `FullscreenView`

Voir `src/app.jsx`.

## Données

Schéma d'une partie :

```ts
type Game = {
  id: string;
  rank: number;          // 1-based, déjà trié par date desc côté API
  score: number;         // 0-100, score composite calculé
  white: { name: string; rating: number };
  black: { name: string; rating: number };
  result: "1-0" | "0-1" | "1/2-1/2";
  timeControl: "Bullet" | "Blitz" | "Rapid";
  eco: string;           // code ECO type "A04"
  date: string;          // formaté "17 May 2026"
  dims: {
    sacrifice: number;   // 0-100
    drama: number;
    brilliancy: number;
    clock: number;
    endgame: number;
    upset: number;
    rarity: number;
  };
  moves: number;
  opening: string;       // "Réti Opening"
  chessComUrl: string;
  highlight: string;     // phrase descriptive courte (en français)
  // À ajouter en prod :
  pgn: string;           // pour rejouer la partie
  evaluations: number[]; // courbe d'éval Stockfish par coup
};
```

Le prototype simule la navigation entre coups avec un tableau hardcodé `SAMPLE_POSITIONS` dans `src/components.jsx`. **En prod, parser le PGN** et naviguer via les coups réels.

L'éval (`evalNumber`) est aussi simulée dans le prototype. **En prod, utiliser les évaluations Stockfish stockées**.

## État (state management)

État local React, géré dans `App` :

```ts
filters: Record<DimKey, number>     // seuils
activePlayers: Set<string>          // noms
sort: "score" | "date" | DimKey
timeControl: "all" | "Bullet" | "Blitz" | "Rapid"
search: string
filtersOpen: boolean                // mobile drawer
selectedId: string
moveIdx: number                     // index dans les coups
flipped: boolean                    // board orientation
detailOpenMobile: boolean
fullscreen: boolean
```

**Pour la prod**, considérer :
- Persister `selectedId`, `flipped`, et les filtres dans l'URL (querystring) pour partage et navigation back/forward — c'est compatible avec le "Copier le lien"
- Si l'app grandit : passer à un store léger (zustand, jotai) ou React Context
- Recherche : debounce 150-300ms si on attaque une vraie API

## Assets

- **Fonts** : Google Fonts (IBM Plex Mono + Inter) — voir `index.html`
- **Icônes** : caractères Unicode (♔♕♖... pour échecs ; ⛶ pour plein écran ; ⌕ recherche ; ⫶ filtres ; ⎘ copier ; ◀▶⏮⏭ ⇅ pour contrôles). **En prod**, utiliser un set d'icônes propre (Lucide, Phosphor, etc.) pour les contrôles UI ; garder l'Unicode uniquement pour les pièces d'échecs (ou mieux : SVG des pièces).
- **Logo** : SVG inline du cavalier dans `Header` (à remplacer par le vrai logo de l'app si différent)

## Tweaks (à ignorer pour la prod)

Le prototype inclut un panneau de tweaks de design qui permet de switcher :
- Couleur d'accent (5 options)
- Visualisation des scores (barres / matrice / empilé)
- Densité (aéré / compact)

**Ne pas livrer en prod** sauf si l'app veut exposer ces préférences à l'utilisateur — auquel cas, persister dans localStorage et masquer le widget par défaut.

## Fichiers livrés

```
design_handoff_check_or_mate/
├── README.md             ← ce fichier
├── index.html            ← entrée du prototype
└── src/
    ├── app.jsx           ← App, Header, GameCard, DetailPanel, FullscreenView
    ├── components.jsx    ← primitives (ChessBoard, DimBar, ScoreMatrix, ScoreStack, RangeSlider, PlayerChip)
    ├── games-data.js     ← données factices + listes joueurs/dimensions
    ├── styles.css        ← tous les styles
    └── tweaks-panel.jsx  ← (à ignorer pour la prod)
```

## Checklist d'implémentation suggérée

1. **Tokens** : importer les variables CSS dans le système de styles existant
2. **Polices** : ajouter IBM Plex Mono + Inter
3. **Layout** : implémenter la grille 3-col responsive + drawers mobiles
4. **Composants primitifs** : DimBar, RangeSlider, PlayerChip, ScoreMatrix, ScoreStack
5. **ChessBoard** : choisir/intégrer une lib (react-chessboard recommandée)
6. **Card de partie** : avec toutes les variantes de viz
7. **Filtres + tri + recherche** : logique de filtrage côté client (data déjà chargée), ou côté API si nécessaire
8. **Détail panel** : sticky, board + eval + contrôles + toutes dimensions
9. **Plein écran** : overlay modal avec board agrandi, progress dots, infos détaillées, animation d'entrée
10. **Raccourcis clavier** : listener global, désactivé sur inputs
11. **URL state** : sync filtres + sélection avec querystring
12. **Polish** : focus rings, hover states, animations 0.15-0.25s
