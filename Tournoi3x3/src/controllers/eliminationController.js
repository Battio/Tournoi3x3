import localStorageService from "../storage/localStorageService";
import { calculateStandings } from "../utils/standings";
import { generateTypedId } from "../utils/idGenerator";

// Durée d'un créneau en minutes et nombre de terrains pour les phases finales
const ELIM_SLOT_MIN = 15;
const ELIM_COURTS   = 2;
// Heure fixe de début des phases finales (15h00)
const ELIM_START_HOUR = 15;

// Numéro de round pour chaque phase (phases du même round se jouent en parallèle)
// Round 1 : QF et Tour 1 des classements
// Round 2 : Demis et Tour 2 des classements (LOWER_T2 parallèle aux DEMI)
// Round 3 : Classements 3e/5e/7e + LOWER_T3 + LOWER_CONSOL
// Round 4 : Classements 9e/11e/13e/15e
// Round 5 : Finale
const ELIM_PHASE_ROUND = {
  QUART:         1, LOWER_T1:     1, LOWER_QF:      1,
  DEMI:          2, LOWER_SF:     2, CONSOL_SF:      2, LOWER_T2:     2,
  LOWER_CONSOL:  3, CLASSEMENT_3: 3, CLASSEMENT_5:  3, CLASSEMENT_7: 3, LOWER_T3: 3,
  CLASSEMENT_9:  4, CLASSEMENT_11:4, CLASSEMENT_13: 4, CLASSEMENT_15:4,
  FINALE:        5,
};

/**
 * Assigne court + startTime à chaque match d'élimination.
 * Les matchs du même round sont répartis sur ELIM_COURTS terrains en parallèle.
 */
function scheduleEliminationMatches(matches, startISO) {
  const hasQF = matches.some(m => m.phase === "QUART");
  const phaseRound = { ...ELIM_PHASE_ROUND };
  if (!hasQF) {
    // n ≤ 4 : pas de quarts → les demis sont le premier round
    phaseRound.DEMI          = 1;
    phaseRound.CLASSEMENT_3  = 2;
    phaseRound.FINALE        = 2;
  }

  const byRound = {};
  matches.forEach(m => {
    const r = phaseRound[m.phase] ?? 99;
    if (!byRound[r]) byRound[r] = [];
    byRound[r].push(m);
  });

  const rounds = Object.keys(byRound).map(Number).sort((a, b) => a - b);
  let currentMs = new Date(startISO).getTime();

  rounds.forEach(round => {
    const rMatches = byRound[round];
    rMatches.forEach((m, idx) => {
      m.court     = (idx % ELIM_COURTS) + 1;
      m.startTime = new Date(
        currentMs + Math.floor(idx / ELIM_COURTS) * ELIM_SLOT_MIN * 60000
      ).toISOString();
    });
    const slots = Math.ceil(rMatches.length / ELIM_COURTS);
    currentMs += slots * ELIM_SLOT_MIN * 60000;
  });
}

function getAllTournaments() {
  return localStorageService.get("tournaments") || [];
}

function saveTournaments(tournaments) {
  localStorageService.set("tournaments", tournaments);
}

/**
 * Crée un match du tableau final.
 * dependsOnA/B       → le VAINQUEUR du match référencé devient teamA/B
 * loserDependsOnA/B  → le PERDANT  du match référencé devient teamA/B (classement)
 */
function makeMatch(teamA, teamB, phase, label, dependsOnA = null, dependsOnB = null, loserDependsOnA = null, loserDependsOnB = null, note = null) {
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
    note,
    dependsOnA,
    dependsOnB,
    loserDependsOnA,
    loserDependsOnB,
  };
}

/**
 * Récupère les équipes qualifiées depuis les classements de poules.
 * Ordre interleaved : Pool A 1er, Pool B 1er, Pool A 2ème, Pool B 2ème…
 */
export function getQualifiedTeams(tournamentId, teamsPerPool = 1) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return [];

  const settings = tournament.settings || { winPoints: 2, lossPoints: 1 };
  const allMatches = tournament.matches || [];

  const standingsPerPool = (tournament.pools || []).map(pool => ({
    pool,
    standings: calculateStandings(
      pool.teams,
      allMatches.filter(m => m.poolId === pool.id),
      settings
    ),
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
 * Taille du pool max (pour proposer "toutes les équipes")
 */
export function getMaxTeamsPerPool(tournamentId) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament || !tournament.pools?.length) return 4;
  return Math.max(...tournament.pools.map(p => p.teams?.length || 0));
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
 * Génère le bracket de classement bas pour les équipes au-delà de la 8e place.
 * lowerSeeds : tableau d'équipes (index 0 = 9e tête de série, etc.), max 8 équipes.
 *
 * n=2  → match direct 9e/10e
 * n=3  → SF (bye pour la 9e) + match 9e + match 11e
 * n=4  → 2 demi-finales + match 9e + match 11e
 * n=5  → Tour 1 (B/C) + Tour 2 (D/E) + Tour 3 (F : perdant D vs 13e)
 * n=6  → Tour 1 (A:13v14 / B:9v12 / C:10v11)
 *         Tour 2 (D: perd.B vs perd.C / E: gagl.B vs gagl.C)
 *         Tour 3 (F: perd.D vs gagl.A) → 12e/13e départage
 * n=7-8→ QF + SF + match 9e + match 11e + match 13e + match 15e
 */
function buildLowerBracket(seeds) {
  const nl = seeds.length;
  if (nl < 2) return [];

  const ls = [...seeds]; // ne pas muter le tableau d'origine
  const lm = [];

  if (nl === 2) {
    lm.push(makeMatch(ls[0], ls[1], "CLASSEMENT_9", "Match pour la 9ème place"));
    return lm;
  }

  if (nl === 3) {
    const lsf = makeMatch(ls[1], ls[2], "LOWER_SF", "Classement 9e-12e · Demi-finale");
    const l9  = makeMatch(ls[0], null, "CLASSEMENT_9",  "Match pour la 9ème place",  null, lsf.id);
    const l11 = makeMatch(null,  null, "CLASSEMENT_11", "Match pour la 11ème place", null, null, null, lsf.id);
    lm.push(lsf, l9, l11);
    return lm;
  }

  if (nl === 4) {
    // 9e vs 12e · 10e vs 11e
    const lsf1 = makeMatch(ls[0], ls[3], "LOWER_SF", "Classement 9e-12e · Demi-finale 1");
    const lsf2 = makeMatch(ls[1], ls[2], "LOWER_SF", "Classement 9e-12e · Demi-finale 2");
    const l9   = makeMatch(null, null, "CLASSEMENT_9",  "Match pour la 9ème place",  lsf1.id, lsf2.id);
    const l11  = makeMatch(null, null, "CLASSEMENT_11", "Match pour la 11ème place", null, null, lsf1.id, lsf2.id);
    lm.push(lsf1, lsf2, l9, l11);
    return lm;
  }

  /* ── n=5 : 5 équipes (9e-13e), structure en 3 tours ──────────────────────
   * Tour 1 : Match B (9e vs 12e)  · Match C (10e vs 11e)
   * Tour 2 : Match D (perd.B vs perd.C) → 11e/12e provisoire
   *          Match E (gagl.B vs gagl.C) → 9e/10e définitifs
   * Tour 3 : Match F (perd.D vs 13e [bye])  → 12e/13e définitifs
   */
  if (nl === 5) {
    const mB = makeMatch(ls[0], ls[3], "LOWER_T1", "Tour 1 · Match B — Demi-finale 9e/12e",
      null, null, null, null, "✓ Gagnant → Match E (9e/10e)  ✗ Perdant → Match D (11e/12e)");
    const mC = makeMatch(ls[1], ls[2], "LOWER_T1", "Tour 1 · Match C — Demi-finale 10e/11e",
      null, null, null, null, "✓ Gagnant → Match E (9e/10e)  ✗ Perdant → Match D (11e/12e)");
    const mD = makeMatch(null, null, "LOWER_T2", "Tour 2 · Match D — Classement 11e/12e",
      null, null, mB.id, mC.id, "✓ Gagnant → 11e définitif  ✗ Perdant → Match F");
    const mE = makeMatch(null, null, "LOWER_T2", "Tour 2 · Match E — Classement 9e/10e",
      mB.id, mC.id, null, null, "✓ Gagnant → 9e définitif  ✗ Perdant → 10e définitif");
    const mF = makeMatch(null, ls[4], "LOWER_T3", "Tour 3 · Match F — Classement 12e/13e",
      null, null, mD.id, null, "✓ Gagnant → 12e définitif  ✗ Perdant → 13e définitif");
    lm.push(mB, mC, mD, mE, mF);
    return lm;
  }

  /* ── n=6 : 6 équipes (9e-14e) issues de 2 poules ────────────────────────────
   * ls[0]=5e/A · ls[1]=5e/B · ls[2]=6e/A · ls[3]=6e/B · ls[4]=7e/A · ls[5]=7e/B
   *
   * Tour 1 — croisement 6e/7e (les 5e ont un bye) :
   *   Match 1 : 6e/A  vs 7e/B   (ls[2] vs ls[5])
   *   Match 2 : 7e/A  vs 6e/B   (ls[4] vs ls[3])
   *   ✗ Perdants → Match 13e/14e
   *   ✓ Gagnants → Tour 2
   *
   * Tour 2 — demi-finales de classement :
   *   Demi 1 : Gagl.M1 vs 5e/B   (gagnant match 1 rejoint ls[1])
   *   Demi 2 : Gagl.M2 vs 5e/A   (gagnant match 2 rejoint ls[0])
   *   ✗ Perdants → Match 11e/12e
   *   ✓ Gagnants → Match 9e/10e
   *
   * Tour 3 — 3 matchs en parallèle :
   *   CLASSEMENT_13 : Perd.M1 vs Perd.M2
   *   CLASSEMENT_11 : Perd.Demi1 vs Perd.Demi2
   *   CLASSEMENT_9  : Gagl.Demi1 vs Gagl.Demi2
   *
   * Classement final : 9e=gagl.C9 · 10e=perd.C9 · 11e=gagl.C11 · 12e=perd.C11
   *                    13e=gagl.C13 · 14e=perd.C13
   */
  if (nl === 6) {
    // Tour 1 : croisement des 6e et 7e de chaque poule
    const m1 = makeMatch(ls[2], ls[5], "LOWER_T1",
      "Tour 1 · Match 1 — 6e/A vs 7e/B",
      null, null, null, null,
      "✓ Gagnant → Demi vs 5e/B   ✗ Perdant → Match 13e/14e");

    const m2 = makeMatch(ls[4], ls[3], "LOWER_T1",
      "Tour 1 · Match 2 — 7e/A vs 6e/B",
      null, null, null, null,
      "✓ Gagnant → Demi vs 5e/A   ✗ Perdant → Match 13e/14e");

    // Tour 2 : demi-finales — gagnants du Tour 1 rejoignent les 5e (qui avaient un bye)
    const sf1 = makeMatch(null, ls[1], "LOWER_T2",
      "Demi-finale classement 1 — Gagl.M1 vs 5e/B",
      m1.id, null, null, null,
      "✓ Gagnant → Match 9e/10e   ✗ Perdant → Match 11e/12e");

    const sf2 = makeMatch(null, ls[0], "LOWER_T2",
      "Demi-finale classement 2 — Gagl.M2 vs 5e/A",
      m2.id, null, null, null,
      "✓ Gagnant → Match 9e/10e   ✗ Perdant → Match 11e/12e");

    // Tour 3 : 3 matchs en parallèle — toutes les équipes jouent
    const c13 = makeMatch(null, null, "CLASSEMENT_13",
      "Match 13ème/14ème place",
      null, null, m1.id, m2.id);

    const c11 = makeMatch(null, null, "CLASSEMENT_11",
      "Match 11ème/12ème place",
      null, null, sf1.id, sf2.id);

    const c9 = makeMatch(null, null, "CLASSEMENT_9",
      "Match 9ème/10ème place",
      sf1.id, sf2.id);

    lm.push(m1, m2, sf1, sf2, c13, c11, c9);
    return lm;
  }

  // n=7 à 8 : bracket complet avec QF
  while (ls.length < 8) ls.push(null);

  // QF préliminaires (les seeds 9 et 10 ont un bye si < 8 équipes)
  const lqf1 = ls[0] && ls[7] ? makeMatch(ls[0], ls[7], "LOWER_QF", "Classement 9e-16e · Match 1") : null;
  const lqf2 = ls[3] && ls[4] ? makeMatch(ls[3], ls[4], "LOWER_QF", "Classement 9e-16e · Match 2") : null;
  const lqf3 = ls[1] && ls[6] ? makeMatch(ls[1], ls[6], "LOWER_QF", "Classement 9e-16e · Match 3") : null;
  const lqf4 = ls[2] && ls[5] ? makeMatch(ls[2], ls[5], "LOWER_QF", "Classement 9e-16e · Match 4") : null;

  const resA = (qf, seed) => ({ team: qf ? null : seed, dep: qf ? qf.id : null });

  const lsf1A = resA(lqf1, ls[0]);
  const lsf1B = resA(lqf2, ls[3]);
  const lsf2A = resA(lqf3, ls[1]);
  const lsf2B = resA(lqf4, ls[2]);

  const lsf1 = makeMatch(lsf1A.team, lsf1B.team, "LOWER_SF", "Classement 9e-12e · Demi-finale 1", lsf1A.dep, lsf1B.dep);
  const lsf2 = makeMatch(lsf2A.team, lsf2B.team, "LOWER_SF", "Classement 9e-12e · Demi-finale 2", lsf2A.dep, lsf2B.dep);

  const l9  = makeMatch(null, null, "CLASSEMENT_9",  "Match pour la 9ème place",  lsf1.id, lsf2.id);
  const l11 = makeMatch(null, null, "CLASSEMENT_11", "Match pour la 11ème place", null, null, lsf1.id, lsf2.id);

  // Match 13e : perdants des QF préliminaires (quand il y en a)
  const hasLowerQF = lqf1 || lqf2 || lqf3 || lqf4;
  let lcsf1 = null, lcsf2 = null, l13 = null, l15 = null;

  if (hasLowerQF) {
    if (lqf1 && lqf2) {
      lcsf1 = makeMatch(null, null, "LOWER_CONSOL", "Classement 13e-16e · Match 1", null, null, lqf1.id, lqf2.id);
    } else if (lqf1) {
      lcsf1 = makeMatch(null, lsf1B.team, "LOWER_CONSOL", "Classement 13e-16e · Match 1", null, null, lqf1.id, null);
    } else if (lqf2) {
      lcsf1 = makeMatch(lsf1A.team, null, "LOWER_CONSOL", "Classement 13e-16e · Match 1", null, null, null, lqf2.id);
    }

    if (lqf3 && lqf4) {
      lcsf2 = makeMatch(null, null, "LOWER_CONSOL", "Classement 13e-16e · Match 2", null, null, lqf3.id, lqf4.id);
    } else if (lqf3) {
      lcsf2 = makeMatch(null, lsf2B.team, "LOWER_CONSOL", "Classement 13e-16e · Match 2", null, null, lqf3.id, null);
    } else if (lqf4) {
      lcsf2 = makeMatch(lsf2A.team, null, "LOWER_CONSOL", "Classement 13e-16e · Match 2", null, null, null, lqf4.id);
    }

    if (lcsf1 && lcsf2) {
      l13 = makeMatch(null, null, "CLASSEMENT_13", "Match pour la 13ème place", lcsf1.id, lcsf2.id);
      l15 = makeMatch(null, null, "CLASSEMENT_15", "Match pour la 15ème place", null, null, lcsf1.id, lcsf2.id);
    } else if (lcsf1) {
      l13 = makeMatch(null, null, "CLASSEMENT_13", "Match pour la 13ème place", lcsf1.id, null);
    }
  }

  [lqf1, lqf2, lqf3, lqf4, lsf1, lsf2, lcsf1, lcsf2, l9, l11, l13, l15]
    .filter(Boolean)
    .forEach(m => lm.push(m));

  return lm;
}

/**
 * Génère le tableau final.
 *
 * n=2  → Finale directe
 * n=3  → Demi + Finale (1er bye, pas de petite finale)
 * n=4  → 2 Demis + 3ème place + Finale
 * n=8  → QF + Demis + consolation 5-8 + 3ème + 5ème + 7ème + Finale
 * n=5-7 → bracket de 8 avec byes (équipes nulles)
 * n>8   → truncate à 8
 *
 * TOUTES les équipes continuent à jouer (consolation bracket pour les perdants de QF).
 */
export function generateEliminationBracket(tournamentId, teamsPerPool = 1) {
  const tournaments = getAllTournaments();
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament) return null;

  const qualified = getQualifiedTeams(tournamentId, teamsPerPool);
  const n = qualified.length;
  if (n < 2) return null;

  // Supprimer les anciens matchs d'élimination ; conserver les matchs de poule
  // qu'ils aient le champ phase renseigné ou non (ancienne génération sans phase)
  tournament.matches = (tournament.matches || []).filter(m => m.phase === "POULE" || !m.phase);

  const q = qualified;
  const newMatches = [];

  /* ─── 2 équipes ──────────────────────────────────────────── */
  if (n === 2) {
    newMatches.push(makeMatch(q[0].team, q[1].team, "FINALE", "Finale"));

  /* ─── 3 équipes ──────────────────────────────────────────── */
  } else if (n === 3) {
    const sf = makeMatch(q[1].team, q[2].team, "DEMI", "Demi-finale");
    const fin = makeMatch(q[0].team, null, "FINALE", "Finale", null, sf.id);
    newMatches.push(sf, fin);

  /* ─── 4 équipes ──────────────────────────────────────────── */
  } else if (n === 4) {
    // 1er vs 4ème · 2ème vs 3ème
    const sf1 = makeMatch(q[0].team, q[3].team, "DEMI", "Demi-finale 1");
    const sf2 = makeMatch(q[1].team, q[2].team, "DEMI", "Demi-finale 2");
    const third = makeMatch(null, null, "CLASSEMENT_3",
      "Petite finale — 3ème place", null, null, sf1.id, sf2.id);
    const fin   = makeMatch(null, null, "FINALE", "Finale", sf1.id, sf2.id);
    newMatches.push(sf1, sf2, third, fin);

  /* ─── 5 à 8 équipes (bracket 8 avec byes si < 8) ─────────── */
  } else {
    // Tronquer à 8 si plus
    const seeds = q.slice(0, 8).map(qi => qi.team);
    while (seeds.length < 8) seeds.push(null);

    // QF pairing standard : S1vS8, S4vS5, S2vS7, S3vS6
    // → QF1W et QF2W → SF1 · QF3W et QF4W → SF2
    const qf1 = seeds[0] && seeds[7]
      ? makeMatch(seeds[0], seeds[7], "QUART", "Quart de finale 1")
      : null;
    const qf2 = seeds[3] && seeds[4]
      ? makeMatch(seeds[3], seeds[4], "QUART", "Quart de finale 2")
      : null;
    const qf3 = seeds[1] && seeds[6]
      ? makeMatch(seeds[1], seeds[6], "QUART", "Quart de finale 3")
      : null;
    const qf4 = seeds[2] && seeds[5]
      ? makeMatch(seeds[2], seeds[5], "QUART", "Quart de finale 4")
      : null;

    // Résoudre les byes pour les SF
    const resolveTeamA = (qf, seed) => ({
      team: qf ? null : seed,
      dep:  qf ? qf.id : null,
    });

    const sf1A = resolveTeamA(qf1, seeds[0]);
    const sf1B = resolveTeamA(qf2, seeds[3]);
    const sf2A = resolveTeamA(qf3, seeds[1]);
    const sf2B = resolveTeamA(qf4, seeds[2]);

    const sf1 = makeMatch(sf1A.team, sf1B.team, "DEMI", "Demi-finale 1", sf1A.dep, sf1B.dep);
    const sf2 = makeMatch(sf2A.team, sf2B.team, "DEMI", "Demi-finale 2", sf2A.dep, sf2B.dep);

    const third = makeMatch(null, null, "CLASSEMENT_3",
      "Petite finale — 3ème place", null, null, sf1.id, sf2.id);
    const fin   = makeMatch(null, null, "FINALE", "Finale", sf1.id, sf2.id);

    // Consolation 5-8 (seulement si au moins un des QF existe)
    const hasConsol = qf1 || qf2 || qf3 || qf4;
    let csf1 = null, csf2 = null, fifth = null, seventh = null;

    if (hasConsol) {
      if (qf1 && qf2) {
        csf1 = makeMatch(null, null, "CONSOL_SF",
          "Classement 5-8 · Match 1", null, null, qf1.id, qf2.id);
      } else if (qf1) {
        // QF2 est un bye : le perdant de QF1 joue le "seed sans bye" pour la 5e place directe
        csf1 = makeMatch(null, sf1B.team, "CONSOL_SF",
          "Classement 5-8 · Match 1", null, null, qf1.id, null);
      } else if (qf2) {
        csf1 = makeMatch(sf1A.team, null, "CONSOL_SF",
          "Classement 5-8 · Match 1", null, null, null, qf2.id);
      }

      if (qf3 && qf4) {
        csf2 = makeMatch(null, null, "CONSOL_SF",
          "Classement 5-8 · Match 2", null, null, qf3.id, qf4.id);
      } else if (qf3) {
        csf2 = makeMatch(null, sf2B.team, "CONSOL_SF",
          "Classement 5-8 · Match 2", null, null, qf3.id, null);
      } else if (qf4) {
        csf2 = makeMatch(sf2A.team, null, "CONSOL_SF",
          "Classement 5-8 · Match 2", null, null, null, qf4.id);
      }

      if (csf1 && csf2) {
        fifth   = makeMatch(null, null, "CLASSEMENT_5",
          "Match pour la 5ème place", csf1.id, csf2.id);
        seventh = makeMatch(null, null, "CLASSEMENT_7",
          "Match pour la 7ème place", null, null, csf1.id, csf2.id);
      }
    }

    // Ajouter tous les matchs du bracket principal
    [qf1, qf2, qf3, qf4, sf1, sf2, csf1, csf2, third, fifth, seventh, fin]
      .filter(Boolean)
      .forEach(m => newMatches.push(m));

    // ─── Bracket bas : classement 9e-16e (équipes 9 à n, max 8 supplémentaires) ───
    const lowerSeeds = q.slice(8, Math.min(n, 16)).map(qi => qi.team);
    const lm = buildLowerBracket(lowerSeeds, newMatches);
    lm.forEach(m => newMatches.push(m));
  }

  // Les phases finales démarrent toujours à 15h00 le jour du tournoi
  const base = tournament.date ? new Date(tournament.date) : new Date();
  base.setHours(ELIM_START_HOUR, 0, 0, 0);
  scheduleEliminationMatches(newMatches, base.toISOString());

  tournament.matches = [...tournament.matches, ...newMatches];
  tournament.qualifiedTeams = qualified;

  saveTournaments(tournaments);
  return { matches: newMatches, qualified };
}

/**
 * Enregistre le score d'un match d'élimination.
 * Propage automatiquement le VAINQUEUR et le PERDANT aux matchs suivants.
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

  tournament.matches.forEach(m => {
    if (m.dependsOnA      === matchId) m.teamA = winner;
    if (m.dependsOnB      === matchId) m.teamB = winner;
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
