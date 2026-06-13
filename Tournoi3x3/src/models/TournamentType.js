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
    description: "Format familial — 3 sur le terrain, jusqu'à 6 inscrits, esprit fair-play",
    minTeams: 2,
    maxTeams: 24,
    minPlayersPerTeam: 3,
    maxPlayersPerTeam: 6,
    gameDuration: 7,           // 7 minutes par match (règlement Benet Basket)
    maxScore: 21,              // Première équipe à 21 points gagne
    shotClock: 12,
    allowOvertime: true,       // Sudden death jusqu'à +2 points si égalité à la sirène
    winPoints: 2,              // Victoire = 2 pts
    lossPoints: 1,             // Défaite = 1 pt
    forfeitPoints: 0,          // Forfait = 0 pt
    requireGenderValidation: false,
    genderRule: "none",
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
