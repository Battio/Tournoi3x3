import localStorageService from "../storage/localStorageService";
import Settings from "../models/Settings";
import { validateTournamentReady } from "../utils/TournamentValidator";
import { isValidTournamentType } from "../models/TournamentType";
import { generateTypedId } from "../utils/idGenerator";

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
 * Retourne { success: boolean, tournament?: Tournament, error?: string }
 */
export function createTournament(tournament) {
  const tournaments = getAllTournaments();

  // Valider le type de tournoi
  if (!isValidTournamentType(tournament.tournamentType)) {
    return { 
      success: false, 
      error: `Type de tournoi invalide: ${tournament.tournamentType}` 
    };
  }

  // Créer Settings par défaut si non fourni
  const settings = tournament.settings || 
    Settings.createForTournamentType(tournament.tournamentType);

  const newTournament = {
    ...tournament,
    id: tournament.id || generateTypedId("tournament"),
    tournamentType: tournament.tournamentType || "official",
    teams: [],
    pools: [],
    matches: [],
    settings,
  };

  tournaments.push(newTournament);
  saveTournaments(tournaments);
  return { success: true, tournament: newTournament };
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
 * Valide qu'un tournoi est prêt à démarrer
 * Retourne { valid: boolean, errors: string[] }
 */
export function validateTournament(tournamentId) {
  const tournament = getTournamentById(tournamentId);
  if (!tournament) {
    return { valid: false, errors: ["Tournoi non trouvé"] };
  }
  
  return validateTournamentReady(tournament);
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
  tournament.tournamentType = info.tournamentType ?? tournament.tournamentType;

  saveTournaments(tournaments);
  return tournament;
}
