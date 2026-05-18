import { getTournamentTypeConfig } from "./TournamentType";

export default class Settings {
  constructor({
    gameDuration = 10,      // durée d’un match en minutes
    maxScore = 21,          // score max (règle FIBA 3x3)
    shotClock = 12,         // possession 12 secondes
    allowOvertime = true,   // prolongation si égalité
    winPoints = 2,          // points au classement
    lossPoints = 1,
    courts = 1,             // nombre de terrains
    breakDuration = 2,      // pause entre les matchs (minutes)
    tournamentType = "official", // type de tournoi
  }) {
    this.gameDuration = gameDuration;
    this.maxScore = maxScore;
    this.shotClock = shotClock;
    this.allowOvertime = allowOvertime;
    this.winPoints = winPoints;
    this.lossPoints = lossPoints;
    this.courts = courts;
    this.breakDuration = breakDuration;
    this.tournamentType = tournamentType;
  }

  /**
   * Crée des Settings par défaut selon le type de tournoi
   */
  static createForTournamentType(tournamentType) {
    const config = getTournamentTypeConfig(tournamentType);
    return new Settings({
      gameDuration: config.gameDuration,
      maxScore: config.maxScore,
      shotClock: config.shotClock,
      allowOvertime: config.allowOvertime,
      winPoints: config.winPoints,
      lossPoints: config.lossPoints,
      tournamentType,
    });
  }

  /**
   * Retourne les paramètres sous forme d'objet simple
   * (utile pour la sauvegarde dans localStorage)
   */
  toJSON() {
    return {
      gameDuration: this.gameDuration,
      maxScore: this.maxScore,
      shotClock: this.shotClock,
      allowOvertime: this.allowOvertime,
      winPoints: this.winPoints,
      lossPoints: this.lossPoints,
      courts: this.courts,
      breakDuration: this.breakDuration,
      tournamentType: this.tournamentType,
    };
  }
}
