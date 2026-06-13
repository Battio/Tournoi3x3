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
 * Met à jour le score d'un match de poule
 */
export function updateMatchScore(tournamentId, matchId, scoreA, scoreB, overtime = false) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const match = tournament.matches.find(m => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.overtime = overtime;
  match.forfeitTeam = null; // on retire un éventuel forfait si on saisit un score manuel

  saveTournaments(tournaments);
  return match;
}

/**
 * Déclare le forfait d'une équipe (score 0-21 ou 21-0, 0 pt au classement)
 * @param {string} forfeitSide - "A" ou "B" selon quelle équipe déclare forfait
 */
export function setForfeit(tournamentId, matchId, forfeitSide) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const match = tournament.matches.find(m => m.id === matchId);
  if (!match) return null;

  if (forfeitSide === "A") {
    match.scoreA = 0;
    match.scoreB = 21;
    match.forfeitTeam = match.teamA?.id || null;
  } else {
    match.scoreA = 21;
    match.scoreB = 0;
    match.forfeitTeam = match.teamB?.id || null;
  }
  match.overtime = false;

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
 * Sauvegarde directement une liste de matchs pour un tournoi
 */
export function saveMatchesForTournament(tournamentId, matches) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.matches = matches;

  saveTournaments(tournaments);
  return matches;
}

/**
 * Alias pour getMatches
 */
export const getMatchesByTournament = getMatches;

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
