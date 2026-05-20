import {
  TOURNAMENT_TYPES,
  getTournamentTypeConfig,
} from "../models/TournamentType";

/**
 * Validations pour les tournois selon leur type
 */

/**
 * Valide une équipe selon le type de tournoi
 * Retourne { valid: boolean, error?: string }
 */
export function validateTeamForTournamentType(team, tournamentType) {
  const config = getTournamentTypeConfig(tournamentType);

  // Vérifier que l'équipe a le nombre minimum de joueurs
  if (team.players.length < config.minPlayersPerTeam) {
    return {
      valid: false,
      error: `L'équipe doit avoir au minimum ${config.minPlayersPerTeam} joueurs. Actuellement: ${team.players.length}`,
    };
  }

  // Si pas de validation de genre, c'est valide
  if (!config.requireGenderValidation) {
    return { valid: true };
  }

  // Validation selon la règle de genre
  if (config.genderRule === "homogeneous") {
    return validateHomogeneousTeam(team);
  } else if (config.genderRule === "mixed") {
    return validateMixedTeam(team);
  }

  return { valid: true };
}

/**
 * Vérifie qu'une équipe est homogène (tous les joueurs du même genre)
 */
function validateHomogeneousTeam(team) {
  if (team.players.length === 0) {
    return { valid: true };
  }

  const firstGender = team.players[0].gender;

  for (const player of team.players) {
    if (player.gender !== firstGender) {
      return {
        valid: false,
        error: `En tournoi officiel, tous les joueurs doivent être du même genre. Équipe mixte détectée.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Vérifie qu'une équipe est mixte (au moins 2 genres différents)
 */
function validateMixedTeam(team) {
  const genders = new Set(team.players.map((p) => p.gender));

  if (genders.size < 2) {
    return {
      valid: false,
      error: `En tournoi mixte, l'équipe doit avoir au minimum 2 genres différents. Actuellement: ${Array.from(genders).join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Valide toutes les équipes d'un tournoi
 */
export function validateAllTeamsForTournament(tournament) {
  const errors = [];

  for (const team of tournament.teams) {
    const validation = validateTeamForTournamentType(
      team,
      tournament.tournamentType
    );
    if (!validation.valid) {
      errors.push({
        teamId: team.id,
        teamName: team.name,
        error: validation.error,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Vérifie que le tournoi a assez d'équipes
 */
export function validateTournamentTeamCount(tournament) {
  const config = getTournamentTypeConfig(tournament.tournamentType);
  const teamCount = tournament.teams.length;

  if (teamCount < config.minTeams) {
    return {
      valid: false,
      error: `Le tournoi ${config.name} nécessite au minimum ${config.minTeams} équipes. Actuellement: ${teamCount}`,
    };
  }

  if (teamCount > config.maxTeams) {
    return {
      valid: false,
      error: `Le tournoi ${config.name} ne peut pas dépasser ${config.maxTeams} équipes. Actuellement: ${teamCount}`,
    };
  }

  return { valid: true };
}

/**
 * Valide complètement un tournoi avant le démarrage
 */
export function validateTournamentReady(tournament) {
  const errors = [];

  // Vérifier le nombre d'équipes
  const teamCountValidation = validateTournamentTeamCount(tournament);
  if (!teamCountValidation.valid) {
    errors.push(teamCountValidation.error);
  }

  // Vérifier la composition de chaque équipe
  const teamsValidation = validateAllTeamsForTournament(tournament);
  if (!teamsValidation.valid) {
    errors.push(
      ...teamsValidation.errors.map(
        (e) => `${e.teamName}: ${e.error}`
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
