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
    forfeitTeam = null,      // id de l’équipe qui déclare forfait (0 pt au classement)
    matchLabel = null,       // label d’affichage (ex: "Demi-finale 1")
    dependsOnA = null,       // id du match dont le VAINQUEUR devient teamA
    dependsOnB = null,       // id du match dont le VAINQUEUR devient teamB
    loserDependsOnA = null,  // id du match dont le PERDANT devient teamA (matchs de classement)
    loserDependsOnB = null,  // id du match dont le PERDANT devient teamB
  }) {
    this.id = id;
    this.teamA = teamA;       // objet équipe (ou null si à déterminer)
    this.teamB = teamB;       // objet équipe (ou null si à déterminer)
    this.poolId = poolId;     // identifiant de la poule
    this.phase = phase;       // phase du tournoi
    this.court = court;       // numéro du terrain
    this.startTime = startTime;

    // Scores
    this.scoreA = scoreA;
    this.scoreB = scoreB;

    // Prolongation 3x3 : sudden death jusqu’à +2 points
    this.overtime = overtime;

    // Forfait et bracket
    this.forfeitTeam = forfeitTeam;
    this.matchLabel = matchLabel;
    this.dependsOnA = dependsOnA;
    this.dependsOnB = dependsOnB;
    this.loserDependsOnA = loserDependsOnA;
    this.loserDependsOnB = loserDependsOnB;
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
