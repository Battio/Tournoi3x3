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
 * Crée un nouveau tournoi
 */
export function createTournament(tournament) {
  const tournaments = getAllTournaments();

  tournaments.push({
    ...tournament,
    teams: [],
    pools: [],
    matches: [],
    settings: tournament.settings || {},
  });

  saveTournaments(tournaments);
  return tournament;
}

/**
 * Met à jour un tournoi existant
 */
export function updateTournament(updatedTournament) {
  const tournaments = getAllTournaments();

  const newList = tournaments.map(t =>
    t.id === updatedTournament.id ? updatedTournament : t
  );

  saveTournaments(newList);
  return updatedTournament;
}

/**
 * Supprime un tournoi
 */
export function deleteTournament(tournamentId) {
  const tournaments = getAllTournaments();

  const newList = tournaments.filter(t => t.id !== tournamentId);

  saveTournaments(newList);
  return true;
}

/**
 * Récupère un tournoi par son ID
 */
export function getTournamentById(tournamentId) {
  const tournaments = getAllTournaments();
  return tournaments.find(t => t.id === tournamentId) || null;
}

/**
 * Récupère tous les tournois
 */
export function getTournaments() {
  return getAllTournaments();
}

/**
 * Réinitialise complètement un tournoi :
 * - équipes
 * - poules
 * - matchs
 */
export function resetTournament(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.teams = [];
  tournament.pools = [];
  tournament.matches = [];

  saveTournaments(tournaments);
  return tournament;
}

/**
 * Met à jour uniquement les informations générales du tournoi
 */
export function updateTournamentInfo(tournamentId, info) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.name = info.name ?? tournament.name;
  tournament.date = info.date ?? tournament.date;
  tournament.location = info.location ?? tournament.location;
  tournament.category = info.category ?? tournament.category;

  saveTournaments(tournaments);
  return tournament;
}
