/**
 * Vérifie qu'une chaîne n'est ni vide ni composée uniquement d'espaces
 */
export function validateNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Vérifie qu'un nombre est valide et positif
 */
export function validatePositiveNumber(value) {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

/**
 * Vérifie qu'un nombre est un entier positif
 */
export function validatePositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

/**
 * Vérifie qu'une date est valide
 */
export function validateDate(value) {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Vérifie qu'une liste n'est pas vide
 */
export function validateNonEmptyArray(arr) {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Vérifie qu'un objet possède un ID valide
 */
export function validateId(obj) {
  return obj && typeof obj.id === "string" && obj.id.trim().length > 0;
}

/**
 * Valide une équipe (Team)
 */
export function validateTeam(team) {
  return (
    validateId(team) &&
    validateNonEmptyString(team.name) &&
    Array.isArray(team.players)
  );
}

/**
 * Valide un joueur (Player)
 */
export function validatePlayer(player) {
  return (
    validateId(player) &&
    validateNonEmptyString(player.firstName) &&
    validateNonEmptyString(player.lastName)
  );
}

/**
 * Valide un match (Match)
 */
export function validateMatch(match) {
  return (
    validateId(match) &&
    validateId(match.teamA) &&
    validateId(match.teamB) &&
    match.teamA.id !== match.teamB.id
  );
}

/**
 * Valide un tournoi (Tournament)
 */
export function validateTournament(tournament) {
  return (
    validateId(tournament) &&
    validateNonEmptyString(tournament.name) &&
    validateDate(tournament.date) &&
    validateNonEmptyString(tournament.location)
  );
}
