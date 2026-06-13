import localStorageService from "../storage/localStorageService";
import { generatePools } from "../utils/poolGenerator";

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
 * Génère les poules d'un tournoi
 */
export function createPools(tournamentId, numberOfPools) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  // Génération des poules via utilitaire
  const pools = generatePools(tournament.teams, numberOfPools);

  // Formatage des poules pour le modèle
  tournament.pools = pools.map((teams, index) => ({
    id: `pool-${index + 1}`,
    name: `Poule ${String.fromCharCode(65 + index)}`, // A, B, C...
    teams: teams,
  }));

  saveTournaments(tournaments);
  return tournament.pools;
}

/**
 * Récupère les poules d'un tournoi
 */
export function getPools(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  return tournament ? tournament.pools : [];
}

/**
 * Récupère une poule spécifique
 */
export function getPoolById(tournamentId, poolId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  return tournament.pools.find(p => p.id === poolId) || null;
}

/**
 * Ajoute une équipe dans une poule
 */
export function addTeamToPool(tournamentId, poolId, team) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const pool = tournament.pools.find(p => p.id === poolId);
  if (!pool) return null;

  pool.teams.push(team);

  saveTournaments(tournaments);
  return pool;
}

/**
 * Supprime une équipe d'une poule
 */
export function removeTeamFromPool(tournamentId, poolId, teamId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  const pool = tournament.pools.find(p => p.id === poolId);
  if (!pool) return null;

  pool.teams = pool.teams.filter(t => t.id !== teamId);

  saveTournaments(tournaments);
  return pool;
}

/**
 * Sauvegarde directement une liste de poules pour un tournoi
 */
export function savePoolsForTournament(tournamentId, pools) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.pools = pools;

  saveTournaments(tournaments);
  return pools;
}

/**
 * Supprime toutes les poules d'un tournoi
 */
export function clearPools(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.pools = [];

  saveTournaments(tournaments);
  return true;
}
