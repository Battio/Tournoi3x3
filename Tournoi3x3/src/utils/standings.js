/**
 * Calcule le classement d'une poule
 * @param {Array} teams - liste des équipes
 * @param {Array} matches - liste des matchs de la poule
 * @param {Object} settings - paramètres du tournoi (winPoints, lossPoints)
 */
export function calculateStandings(teams, matches, settings) {
  const standings = teams.map(team => ({
    team,
    wins: 0,
    losses: 0,
    points: 0,          // points classement
    scored: 0,          // points marqués
    conceded: 0,        // points encaissés
    diff: 0,            // différence
  }));

  // Fonction utilitaire pour retrouver une ligne du classement
  const findRow = (teamId) =>
    standings.find(s => s.team.id === teamId);

  // Parcours des matchs terminés
  matches
    .filter(m => m.scoreA !== null && m.scoreB !== null)
    .forEach(match => {
      const rowA = findRow(match.teamA.id);
      const rowB = findRow(match.teamB.id);

      // Mise à jour des points marqués / encaissés
      rowA.scored += match.scoreA;
      rowA.conceded += match.scoreB;

      rowB.scored += match.scoreB;
      rowB.conceded += match.scoreA;

      // Différence
      rowA.diff = rowA.scored - rowA.conceded;
      rowB.diff = rowB.scored - rowB.conceded;

      // Victoire / défaite (avec gestion forfait : 0 pt)
      const forfeitPoints = settings.forfeitPoints ?? 0;
      if (match.scoreA > match.scoreB) {
        rowA.wins++;
        rowB.losses++;
        rowA.points += settings.winPoints;
        rowB.points += match.forfeitTeam === rowB.team.id ? forfeitPoints : settings.lossPoints;
      } else {
        rowB.wins++;
        rowA.losses++;
        rowB.points += settings.winPoints;
        rowA.points += match.forfeitTeam === rowA.team.id ? forfeitPoints : settings.lossPoints;
      }
    });

  // Tri du classement
  standings.sort((a, b) => {
    // 1. Points classement
    if (b.points !== a.points) return b.points - a.points;

    // 2. Différence de points
    if (b.diff !== a.diff) return b.diff - a.diff;

    // 3. Points marqués
    if (b.scored !== a.scored) return b.scored - a.scored;

    // 4. Confrontation directe (optionnel)
    const direct = getHeadToHeadResult(a.team, b.team, matches);
    if (direct !== 0) return direct;

    return 0;
  });

  return standings;
}

/**
 * Confrontation directe entre deux équipes
 * Retourne :
 *  -1 si A perd
 *   1 si A gagne
 *   0 si aucune info
 */
function getHeadToHeadResult(teamA, teamB, matches) {
  const match = matches.find(
    m =>
      (m.teamA.id === teamA.id && m.teamB.id === teamB.id) ||
      (m.teamA.id === teamB.id && m.teamB.id === teamA.id)
  );

  if (!match || match.scoreA === null || match.scoreB === null) return 0;

  if (match.teamA.id === teamA.id) {
    return match.scoreA > match.scoreB ? 1 : -1;
  } else {
    return match.scoreB > match.scoreA ? 1 : -1;
  }
}
