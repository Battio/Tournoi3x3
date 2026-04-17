export default class Pool {
  constructor({
    id,
    name,
    teams = [],
    matches = [],
  }) {
    this.id = id;           // ex: "pool-1"
    this.name = name;       // ex: "Poule A"
    this.teams = teams;     // liste d'équipes
    this.matches = matches; // liste de matchs (optionnel)
  }

  /**
   * Retourne le nombre d'équipes dans la poule
   */
  getTeamCount() {
    return this.teams.length;
  }

  /**
   * Ajoute une équipe dans la poule
   */
  addTeam(team) {
    this.teams.push(team);
  }

  /**
   * Supprime une équipe de la poule
   */
  removeTeam(teamId) {
    this.teams = this.teams.filter(t => t.id !== teamId);
  }

  /**
   * Ajoute un match dans la poule
   */
  addMatch(match) {
    this.matches.push(match);
  }

  /**
   * Retourne true si tous les matchs de la poule sont terminés
   */
  isFinished() {
    return this.matches.length > 0 && this.matches.every(m => m.isFinished());
  }
}
