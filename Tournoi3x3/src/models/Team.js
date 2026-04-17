export default class Team {
  constructor({
    id,
    name,
    players = [],
    color = null,     // optionnel : couleur d'équipe
    logo = null,      // optionnel : URL ou base64
  }) {
    this.id = id;
    this.name = name;
    this.players = players; // liste d'objets Player
    this.color = color;
    this.logo = logo;
  }

  /**
   * Retourne le nombre de joueurs dans l'équipe
   */
  getPlayerCount() {
    return this.players.length;
  }

  /**
   * Ajoute un joueur à l'équipe
   */
  addPlayer(player) {
    this.players.push(player);
  }

  /**
   * Supprime un joueur de l'équipe
   */
  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  /**
   * Retourne true si l'équipe est complète (3 joueurs minimum en 3x3)
   */
  isComplete() {
    return this.players.length >= 3;
  }

  /**
   * Retourne le nom complet de l'équipe (utile pour l'affichage)
   */
  toString() {
    return this.name;
  }
}
