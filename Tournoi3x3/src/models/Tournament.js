import Settings from "./Settings";

export default class Tournament {
  constructor({
    id,
    name,
    date,
    location,
    category,
    teams = [],
    pools = [],
    matches = [],
    settings = new Settings({}),
  }) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.location = location;
    this.category = category;

    // Collections
    this.teams = teams;       // liste d'équipes
    this.pools = pools;       // liste de poules
    this.matches = matches;   // liste de matchs

    // Paramètres du tournoi
    this.settings = settings instanceof Settings
      ? settings
      : new Settings(settings);
  }

  /**
   * Retourne le nombre total d'équipes
   */
  getTeamCount() {
    return this.teams.length;
  }

  /**
   * Retourne le nombre de poules
   */
  getPoolCount() {
    return this.pools.length;
  }

  /**
   * Retourne le nombre total de matchs
   */
  getMatchCount() {
    return this.matches.length;
  }

  /**
   * Vérifie si le tournoi est prêt à démarrer
   * (équipes + poules + matchs générés)
   */
  isReady() {
    return (
      this.teams.length > 0 &&
      this.pools.length > 0 &&
      this.matches.length > 0
    );
  }

  /**
   * Retourne la liste des équipes d'une poule
   */
  getTeamsByPool(poolId) {
    const pool = this.pools.find(p => p.id === poolId);
    return pool ? pool.teams : [];
  }

  /**
   * Retourne les matchs d'une poule
   */
  getMatchesByPool(poolId) {
    return this.matches.filter(m => m.poolId === poolId);
  }

  /**
   * Retourne un résumé du tournoi (utile pour l'affichage)
   */
  getSummary() {
    return {
      name: this.name,
      date: this.date,
      location: this.location,
      category: this.category,
      teams: this.getTeamCount(),
      pools: this.getPoolCount(),
      matches: this.getMatchCount(),
    };
  }
}
