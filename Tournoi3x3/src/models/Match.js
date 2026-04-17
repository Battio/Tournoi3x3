export default class Match {
  constructor({
    id,
    teamA,
    teamB,
    poolId = null,
    phase = "POULE", // POULE | QUART | DEMI | FINALE
    court = 1,
    startTime = null,
    scoreA = null,
    scoreB = null,
    overtime = false,
  }) {
    this.id = id;
    this.teamA = teamA;       // objet équipe
    this.teamB = teamB;       // objet équipe
    this.poolId = poolId;     // identifiant de la poule
    this.phase = phase;       // phase du tournoi
    this.court = court;       // numéro du terrain
    this.startTime = startTime;

    // Scores
    this.scoreA = scoreA;
    this.scoreB = scoreB;

    // Prolongation (3x3 : première équipe à 2 points d’écart)
    this.overtime = overtime;
  }

  /**
   * Retourne true si le match est terminé
   */
  isFinished() {
    return this.scoreA !== null && this.scoreB !== null;
  }

  /**
   * Retourne le vainqueur (ou null si pas terminé)
   */
  getWinner() {
    if (!this.isFinished()) return null;
    return this.scoreA > this.scoreB ? this.teamA : this.teamB;
  }

  /**
   * Retourne le perdant (ou null si pas terminé)
   */
  getLoser() {
    if (!this.isFinished()) return null;
    return this.scoreA < this.scoreB ? this.teamA : this.teamB;
  }
}
