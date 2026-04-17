import localStorageService from "../storage/localStorageService";
import { generateMatches } from "../utils/matchGenerator";

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
 * Génère les matchs pour une poule donnée
 */
export function createMatchesForPool(tournamentId, poolIndex) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const pool = tournament.pools[poolIndex];
  if (!pool) return null;

  const matches = generateMatches(pool.teams);

  // Ajout des matchs au tournoi
  tournament.matches = [...tournament.matches, ...matches];

  saveTournaments(tournaments);
  return matches;
}

/**
 * Met à jour le score d'un match
 */
export function updateMatchScore(tournamentId, matchId, scoreA, scoreB) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const match = tournament.matches.find(m => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;

  // Gestion prolongation 3x3 : première équipe à 2 points d'écart
  if (scoreA === scoreB) {
    match.overtime = true;
  } else {
    match.overtime = false;
  }

  saveTournaments(tournaments);
  return match;
}

/**
 * Récupère tous les matchs d'un tournoi
 */
export function getMatches(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  return tournament ? tournament.matches : [];
}

/**
 * Récupère un match spécifique
 */
export function getMatchById(tournamentId, matchId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;

  return tournament.matches.find(m => m.id === matchId) || null;
}

/**
 * Supprime un match
 */
export function deleteMatch(tournamentId, matchId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.matches = tournament.matches.filter(m => m.id !== matchId);

  saveTournaments(tournaments);
  return true;
}
