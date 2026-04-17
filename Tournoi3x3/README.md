# 🏀 Tournoi 3x3 – Gestion complète d’un tournoi de basket

Application web en **React** permettant de gérer entièrement un tournoi de basket 3x3 :

- Création et gestion des tournois
- Gestion des équipes et des joueurs
- Génération automatique des poules
- Génération et planification des matchs
- Saisie des scores
- Classements automatiques
- Vue publique pour affichage en salle

Le projet utilise une architecture **MVC front‑only**, avec stockage local via `localStorage`.

---

## 🚀 Fonctionnalités principales

### 🎯 Gestion du tournoi
- Création / édition d’un tournoi
- Informations : nom, date, lieu, catégorie

### 👥 Gestion des équipes
- Ajout / suppression d’équipes
- Ajout / suppression de joueurs
- Identifiants typés (team_xxx, player_xxx)

### 🏀 Génération des poules
- Répartition automatique des équipes
- Nommage automatique (Poule A, B, C…)

### 📅 Matchs
- Génération automatique des matchs par poule
- Planification automatique (heure de début + durée + pauses)
- Saisie des scores + prolongation

### 📊 Classements
- Calcul automatique :
  - Points
  - Victoires / défaites
  - Différence de points
  - Points marqués

### 🌐 Vue publique
- Affichage lisible pour le public
- Poules, matchs, scores, classements

---

