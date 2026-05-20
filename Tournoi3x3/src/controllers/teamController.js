import localStorageService from "../storage/localStorageService";
import { validateTeamForTournamentType } from "../utils/TournamentValidator";

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
 * Ajoute une équipe à un tournoi
 * Retourne { success: boolean, team?: Team, error?: string }
 */
export function addTeam(tournamentId, team) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return { success: false, error: "Tournoi non trouvé" };

  // Valider l'équipe selon le type de tournoi
  const validation = validateTeamForTournamentType(team, tournament.tournamentType);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  tournament.teams.push(team);
  saveTournaments(tournaments);
  return { success: true, team };
}

/**
 * Met à jour une équipe
 * Retourne { success: boolean, team?: Team, error?: string }
 */
export function updateTeam(tournamentId, updatedTeam) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return { success: false, error: "Tournoi non trouvé" };

  // Valider l'équipe mise à jour selon le type de tournoi
  const validation = validateTeamForTournamentType(updatedTeam, tournament.tournamentType);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  tournament.teams = tournament.teams.map(team =>
    team.id === updatedTeam.id ? updatedTeam : team
  );

  saveTournaments(tournaments);
  return { success: true, team: updatedTeam };
}

/**
 * Supprime une équipe d'un tournoi
 */
export function deleteTeam(tournamentId, teamId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.teams = tournament.teams.filter(team => team.id !== teamId);

  // Supprimer l'équipe des poules si elles existent
  if (tournament.pools && tournament.pools.length > 0) {
    tournament.pools = tournament.pools.map(pool => ({
      ...pool,
      teams: pool.teams.filter(t => t.id !== teamId),
    }));
  }

  saveTournaments(tournaments);
  return true;
}

/**
 * Récupère toutes les équipes d'un tournoi
 */
export function getTeams(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  return tournament ? tournament.teams : [];
}

/**
 * Récupère une équipe spécifique
 */
export function getTeamById(tournamentId, teamId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  return tournament.teams.find(team => team.id === teamId) || null;
}

/**
 * Supprime toutes les équipes d'un tournoi
 */
export function clearTeams(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);

  if (!tournament) return null;

  tournament.teams = [];

  // Réinitialiser les poules si elles existent
  tournament.pools = [];

  saveTournaments(tournaments);
  return true;
}

// Aliases pour compatibilité avec les vues
export const addTeamToTournament = addTeam;
export const removeTeamFromTournament = deleteTeam;
