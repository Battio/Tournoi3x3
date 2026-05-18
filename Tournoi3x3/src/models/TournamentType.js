/**
 * Constantes et configurations pour les types de tournoi
 */

export const TOURNAMENT_TYPES = {
  OFFICIAL: "official",
  MIXED: "mixed",
  FAMILY: "family",
};

export const TOURNAMENT_TYPE_CONFIG = {
  official: {
    name: "Tournoi Officiel",
    description: "Compétition homogène (Hommes OU Femmes)",
    minTeams: 4,
    maxTeams: 32,
    minPlayersPerTeam: 3,
    gameDuration: 12,
    maxScore: 21,
    shotClock: 12,
    allowOvertime: true,
    winPoints: 2,
    lossPoints: 1,
    requireGenderValidation: true,
    genderRule: "homogeneous", // tous les joueurs même genre
    color: "#FF6B6B",
  },
  
  mixed: {
    name: "Tournoi Mixte",
    description: "Équipes avec joueurs des deux genres",
    minTeams: 4,
    maxTeams: 32,
    minPlayersPerTeam: 3,
    gameDuration: 10,
    maxScore: 21,
    shotClock: 12,
    allowOvertime: true,
    winPoints: 2,
    lossPoints: 1,
    requireGenderValidation: true,
    genderRule: "mixed", // au minimum 2 genres différents
    color: "#4ECDC4",
  },
  
  family: {
    name: "Tournoi des Familles",
    description: "Format casual et accessible pour tous",
    minTeams: 2,
    maxTeams: 24,
    minPlayersPerTeam: 2,
    gameDuration: 8,
    maxScore: 15,
    shotClock: 12,
    allowOvertime: false,
    winPoints: 1,
    lossPoints: 0,
    requireGenderValidation: false,
    genderRule: "none", // pas de validation
    color: "#FFE66D",
  },
};

/**
 * Récupère la configuration d'un type de tournoi
 */
export function getTournamentTypeConfig(tournamentType) {
  return TOURNAMENT_TYPE_CONFIG[tournamentType] || TOURNAMENT_TYPE_CONFIG.official;
}

/**
 * Récupère le nom lisible d'un type de tournoi
 */
export function getTournamentTypeName(tournamentType) {
  const config = getTournamentTypeConfig(tournamentType);
  return config.name;
}

/**
 * Vérifie si un type de tournoi est valide
 */
export function isValidTournamentType(tournamentType) {
  return Object.values(TOURNAMENT_TYPES).includes(tournamentType);
}
