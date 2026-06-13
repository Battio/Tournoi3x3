import localStorageService from "../storage/localStorageService";
import { calculateStandings } from "../utils/standings";
import { generateTypedId } from "../utils/idGenerator";

function getAllTournaments() {
  return localStorageService.get("tournaments") || [];
}

function saveTournaments(tournaments) {
  localStorageService.set("tournaments", tournaments);
}

/**
 * Crée un match du tableau final
 * dependsOnA/B → vainqueur du match référencé devient teamA/B
 * loserDependsOnA/B → perdant du match référencé devient teamA/B (matchs de classement)
 */
function makeMatch(teamA, teamB, phase, label, dependsOnA = null, dependsOnB = null, loserDependsOnA = null, loserDependsOnB = null) {
  return {
    id: generateTypedId("match"),
    teamA: teamA || null,
    teamB: teamB || null,
    poolId: null,
    phase,
    court: 1,
    startTime: null,
    scoreA: null,
    scoreB: null,
    overtime: false,
    forfeitTeam: null,
    matchLabel: label,
    dependsOnA,
    dependsOnB,
    loserDependsOnA,
    loserDependsOnB,
  };
}

/**
 * Récupère les équipes qualifiées depuis les classements de poules.
 * Ordre : Pool A 1er, Pool B 1er, Pool A 2ème, Pool B 2ème...
 */
export function getQualifiedTeams(tournamentId, teamsPerPool = 1) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return [];

  const settings = tournament.settings || { winPoints: 2, lossPoints: 1 };
  const allMatches = tournament.matches || [];

  const standingsPerPool = (tournament.pools || []).map(pool => ({
    pool,
    standings: calculateStandings(pool.teams, allMatches.filter(m => m.poolId === pool.id), settings),
  }));

  const qualified = [];
  for (let rank = 0; rank < teamsPerPool; rank++) {
    standingsPerPool.forEach(({ pool, standings }) => {
      if (standings[rank]) {
        qualified.push({
          team: standings[rank].team,
          poolName: pool.name,
          rank: rank + 1,
          points: standings[rank].points,
          diff: standings[rank].diff,
        });
      }
    });
  }

  return qualified;
}

/**
 * Vérifie si tous les matchs de poule sont terminés
 */
export function areAllPoolMatchesFinished(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return false;

  const poolMatches = (tournament.matches || []).filter(m => m.phase === "POULE");
  if (poolMatches.length === 0) return false;

  return poolMatches.every(m => m.scoreA !== null && m.scoreB !== null);
}

/**
 * Génère le tableau final avec matchs de classement.
 *
 * Format :
 *  2 équipes  → Finale
 *  3 équipes  → Demi + Finale (1er a un bye)
 *  4 équipes  → 2 Demis + Petite finale (3e place) + Finale
 *  5-8 équipes → QF + Demis + Petite finale + Finale
 */
export function generateEliminationBracket(tournamentId, teamsPerPool = 1) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;

  const qualified = getQualifiedTeams(tournamentId, teamsPerPool);
  const n = qualified.length;
  if (n < 2) return null;

  // Supprimer les anciens matchs d'élimination
  tournament.matches = (tournament.matches || []).filter(m => m.phase === "POULE");

  const q = qualified;
  const newMatches = [];

  if (n === 2) {
    // Finale directe, pas de match de classement
    newMatches.push(makeMatch(q[0].team, q[1].team, "FINALE", "Finale"));

  } else if (n === 3) {
    // SF : 2ème vs 3ème · 1er a un bye → Finale
    // Pas de Petite finale (seulement 3 équipes)
    const sf = makeMatch(q[1].team, q[2].team, "DEMI", "Demi-finale");
    const fin = makeMatch(q[0].team, null, "FINALE", "Finale", null, sf.id);
    newMatches.push(sf, fin);

  } else if (n === 4) {
    // SF1 : 1er vs 4ème · SF2 : 2ème vs 3ème
    // Petite finale : perdants SF1 et SF2
    // Finale : vainqueurs SF1 et SF2
    const sf1 = makeMatch(q[0].team, q[3].team, "DEMI", "Demi-finale 1");
    const sf2 = makeMatch(q[1].team, q[2].team, "DEMI", "Demi-finale 2");
    const third = makeMatch(null, null, "CLASSEMENT_3", "Petite finale — 3ème place", null, null, sf1.id, sf2.id);
    const fin = makeMatch(null, null, "FINALE", "Finale", sf1.id, sf2.id);
    newMatches.push(sf1, sf2, third, fin);

  } else {
    // 5–8 équipes : QF → SF → Petite finale + Finale
    const seeds = q.map(qi => qi.team);
    while (seeds.length < 8) seeds.push(null);

    // QF : 0v7, 1v6, 2v5, 3v4
    const qfs = [];
    for (let i = 0; i < 4; i++) {
      const tA = seeds[i];
      const tB = seeds[7 - i];
      if (tA && tB) {
        qfs.push({ match: makeMatch(tA, tB, "QUART", `Quart de finale ${i + 1}`), isBye: false });
      } else if (tA) {
        qfs.push({ match: null, byeTeam: tA, isBye: true });
      } else {
        qfs.push({ match: null, byeTeam: null, isBye: true });
      }
    }

    // SF : QF0W vs QF1W · QF2W vs QF3W
    const sfs = [];
    for (let i = 0; i < 2; i++) {
      const qfA = qfs[i * 2];
      const qfB = qfs[i * 2 + 1];

      let tA = null, dA = null;
      let tB = null, dB = null;

      if (qfA.isBye) { tA = qfA.byeTeam; }
      else if (qfA.match) { dA = qfA.match.id; }

      if (qfB.isBye) { tB = qfB.byeTeam; }
      else if (qfB.match) { dB = qfB.match.id; }

      sfs.push(makeMatch(tA, tB, "DEMI", `Demi-finale ${i + 1}`, dA, dB));
    }

    // Petite finale (perdants des demi-finales)
    const third = makeMatch(null, null, "CLASSEMENT_3", "Petite finale — 3ème place", null, null, sfs[0].id, sfs[1].id);
    const fin = makeMatch(null, null, "FINALE", "Finale", sfs[0].id, sfs[1].id);

    qfs.filter(q => !q.isBye && q.match).forEach(q => newMatches.push(q.match));
    newMatches.push(...sfs, third, fin);
  }

  tournament.matches = [...tournament.matches, ...newMatches];
  tournament.qualifiedTeams = qualified;

  saveTournaments(tournaments);
  return { matches: newMatches, qualified };
}

/**
 * Enregistre le score d'un match du tableau final.
 * Propage automatiquement vainqueur ET perdant aux matchs suivants.
 */
export function updateEliminationScore(tournamentId, matchId, scoreA, scoreB, overtime = false) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;

  const match = tournament.matches.find(m => m.id === matchId);
  if (!match) return null;

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.overtime = overtime;
  match.forfeitTeam = null;

  const winner = scoreA > scoreB ? match.teamA : match.teamB;
  const loser  = scoreA < scoreB ? match.teamA : match.teamB;

  // Propager vainqueur
  tournament.matches.forEach(m => {
    if (m.dependsOnA === matchId) m.teamA = winner;
    if (m.dependsOnB === matchId) m.teamB = winner;
  });

  // Propager perdant (matchs de classement)
  tournament.matches.forEach(m => {
    if (m.loserDependsOnA === matchId) m.teamA = loser;
    if (m.loserDependsOnB === matchId) m.teamB = loser;
  });

  saveTournaments(tournaments);
  return match;
}

/**
 * Récupère les matchs du tableau final (tout sauf les matchs de poule)
 */
export function getEliminationMatches(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return [];
  return (tournament.matches || []).filter(m => m.phase && m.phase !== "POULE");
}

/**
 * Supprime le tableau final pour le régénérer
 */
export function clearEliminationBracket(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;

  tournament.matches = (tournament.matches || []).filter(m => m.phase === "POULE");
  tournament.qualifiedTeams = [];

  saveTournaments(tournaments);
  return true;
}
