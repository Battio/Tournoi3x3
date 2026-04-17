import localStorageService from "../storage/localStorageService";

/**
 * Récupère tous les tournois depuis le stockage local
 */
function getAllTournaments() {
  return localStorageService.get("tournaments") || [];
}

/**
 * Sauvegarde la liste complète des tournois
 */
function saveTournaments(tournaments) {
  localStorageService.set("tournaments", tournaments);
}

/**
 * Met à jour les paramètres d'un tournoi
 */
export function updateSettings(tournamentId, newSettings) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.settings = {
    ...tournament.settings,
    ...newSettings,
  };

  saveTournaments(tournaments);
  return tournament.settings;
}

/**
 * Récupère les paramètres d'un tournoi
 */
export function getSettings(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  return tournament ? tournament.settings : null;
}

/**
 * Initialise les paramètres d'un tournoi avec des valeurs par défaut
 */
export function initDefaultSettings(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const defaultSettings = {
    gameDuration: 10,        // minutes
    maxScore: 21,            // score max 3x3
    shotClock: 12,           // 12 secondes
    allowOvertime: true,     // prolongation si égalité
    winPoints: 2,            // points classement
    lossPoints: 1,
    courts: 1,               // nombre de terrains
  };

  tournament.settings = defaultSettings;

  saveTournaments(tournaments);
  return defaultSettings;
}

/**
 * Réinitialise les paramètres d'un tournoi
 */
export function resetSettings(tournamentId) {
  return initDefaultSettings(tournamentId);
}
