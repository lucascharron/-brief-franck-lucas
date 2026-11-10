# Application Fleurs Roussel

Projet de départ commun aux trois sujets : en-tête et pied de page du site, Tailwind CSS 4 et le thème Roussel, un fichier `js/app.js` vide et un fichier de données vide.

## Installer

```
npm install
```

## Lancer

Deux terminaux, laissés ouverts :

```
npm run dev      # régénère dist/output.css à chaque enregistrement
npm run serve    # sert le site sur http://localhost:8080
```

Ouvrir http://localhost:8080 dans le navigateur. Le serveur est nécessaire : un navigateur refuse de lire `data/donnees.json` quand la page est ouverte directement depuis le disque. Dans PHPStorm, ouvrir `index.html` avec le navigateur intégré fonctionne aussi.

## Organisation

| Dossier ou fichier | Contenu |
|:--|:--|
| `index.html` | La page de l'application |
| `js/app.js` | Tout le JavaScript |
| `data/donnees.json` | Les données produites par le prompt de contenu |
| `img/fleurs/` | Les images des huit fleurs du jeu de mémoire |
| `src/input.css` | Tailwind et le thème Roussel |
