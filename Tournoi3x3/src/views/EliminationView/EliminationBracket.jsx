import React, { useCallback, useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import {
  generateEliminationBracket,
  getEliminationMatches,
  updateEliminationScore,
  areAllPoolMatchesFinished,
  clearEliminationBracket,
  getQualifiedTeams,
  getMaxTeamsPerPool,
} from "../../controllers/eliminationController";

// Ordre d'affichage des phases (chronologique)
const PHASE_ORDER = [
  "QUART",
  "LOWER_T1",     // Classement 9e-14e · Tour 1 (matchs A/B/C)
  "LOWER_QF",     // Classement 9e-16e · 1er tour (bracket 7-8 équipes)
  "DEMI",
  "LOWER_SF",     // Classement 9e-12e · Demi-finales (bracket 4 équipes)
  "CONSOL_SF",    // Classement 5-8 · Demi-finales
  "LOWER_T2",     // Classement 9e-14e · Tour 2 (matchs D/E)
  "LOWER_CONSOL", // Classement 13e-16e · Demi-finales
  "CLASSEMENT_3",
  "CLASSEMENT_5",
  "CLASSEMENT_7",
  "CLASSEMENT_9",
  "CLASSEMENT_11",
  "CLASSEMENT_13",
  "LOWER_T3",     // n=5 uniquement : Tour 3 match F (départage 12e/13e)
  "CLASSEMENT_15",
  "FINALE",
];

const PHASE_META = {
  QUART:          { label: "Quarts de finale",                    accent: "#6366f1" },
  LOWER_T1:       { label: "Classement 9e-14e · Tour 1",          accent: "#7c3aed" },
  LOWER_QF:       { label: "Classement 9e-16e · 1er tour",        accent: "#94a3b8" },
  DEMI:           { label: "Demi-finales",                        accent: "#f97316" },
  LOWER_SF:       { label: "Classement 9e-12e · Demi-finales",    accent: "#7c3aed" },
  CONSOL_SF:      { label: "Classement 5-8 · Demi-finales",       accent: "#64748b" },
  LOWER_T2:       { label: "Classement 9e-14e · Tour 2",          accent: "#7c3aed" },
  LOWER_CONSOL:   { label: "Classement 13e-16e · Demi-finales",   accent: "#b8b8b8" },
  CLASSEMENT_3:   { label: "Petite finale — 3ème place",          accent: "#94a3b8" },
  CLASSEMENT_5:   { label: "Match pour la 5ème place",            accent: "#78716c" },
  CLASSEMENT_7:   { label: "Match pour la 7ème place",            accent: "#a8a29e" },
  CLASSEMENT_9:   { label: "Match 9ème/10ème place",              accent: "#7c3aed" },
  CLASSEMENT_11:  { label: "Match 11ème/12ème place",             accent: "#9ca3af" },
  LOWER_T3:       { label: "Classement 9e-14e · Tour 3 — Départage 12e/13e", accent: "#7c3aed" },
  CLASSEMENT_13:  { label: "Match 13ème/14ème place",             accent: "#d1d5db" },
  CLASSEMENT_15:  { label: "Match pour la 15ème place",           accent: "#e5e7eb" },
  FINALE:         { label: "Finale",                              accent: "#eab308" },
};

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function TeamRow({ team, score, isWinner, isFinished }) {
  return (
    <div className={[
      "bt-team-row",
      isWinner ? "bt-team-row--winner" : "",
      !team    ? "bt-team-row--tbd"    : "",
    ].filter(Boolean).join(" ")}>
      <span className="bt-team-name">{team?.name || "À déterminer"}</span>
      {isFinished && (
        <span className={`bt-team-score ${isWinner ? "bt-team-score--winner" : ""}`}>
          {score}
        </span>
      )}
    </div>
  );
}

export default function EliminationBracket({ tournamentId, onBracketUpdated }) {
  const [tournament, setTournament]     = useState(null);
  const [loaded, setLoaded]             = useState(false);
  const [elimMatches, setElimMatches]   = useState([]);
  const [qualified, setQualified]       = useState([]);
  const [teamsPerPool, setTeamsPerPool] = useState(4);
  const [maxTeams, setMaxTeams]         = useState(4);
  const [scores, setScores]             = useState({});
  const [saved, setSaved]               = useState({});
  const [allPoolsDone, setAllPoolsDone] = useState(false);
  const [error, setError]               = useState("");

  const refresh = useCallback(() => {
    try {
      const t = getTournamentById(tournamentId);
      setTournament(t);

      if (t) {
        setAllPoolsDone(areAllPoolMatchesFinished(tournamentId));

        const elims = getEliminationMatches(tournamentId);
        setElimMatches(elims);

        const q = Array.isArray(t.qualifiedTeams) ? t.qualifiedTeams : [];
        setQualified(q);

        // Défaut intelligent : toutes les équipes de la plus grande poule
        const maxPerPool = getMaxTeamsPerPool(tournamentId);
        setMaxTeams(maxPerPool);
        setTeamsPerPool(prev => prev === 4 || prev > maxPerPool ? maxPerPool : prev);

        const initScores = {};
        elims.forEach(m => {
          initScores[m.id] = {
            scoreA:   m.scoreA   !== null && m.scoreA   !== undefined ? String(m.scoreA)   : "",
            scoreB:   m.scoreB   !== null && m.scoreB   !== undefined ? String(m.scoreB)   : "",
            overtime: m.overtime || false,
          };
        });
        setScores(initScores);
      }
    } catch (err) {
      console.error("EliminationBracket refresh error:", err);
    } finally {
      setLoaded(true);
    }
  }, [tournamentId]);

  useEffect(() => { refresh(); }, [refresh]);

  // ---------- actions ----------

  const handleGenerate = () => {
    setError("");
    const poolCount = tournament?.pools?.length || 0;
    if (poolCount === 0) {
      setError("Aucune poule trouvée. Génère les poules d'abord.");
      return;
    }
    const result = generateEliminationBracket(tournamentId, teamsPerPool);
    if (!result || result.matches.length === 0) {
      setError("Impossible de générer le tableau. Vérifie qu'il y a suffisamment d'équipes qualifiées (minimum 2).");
      return;
    }
    refresh();
    if (onBracketUpdated) onBracketUpdated();
  };

  const handleReset = () => {
    if (!window.confirm("Supprimer le tableau final et tous ses résultats ?")) return;
    clearEliminationBracket(tournamentId);
    refresh();
    if (onBracketUpdated) onBracketUpdated();
  };

  const handleScoreChange = (matchId, field, value) => {
    setScores(prev => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }));
    setSaved(prev => ({ ...prev, [matchId]: false }));
  };

  const handleSaveScore = (match) => {
    setError("");
    const s = scores[match.id] || {};
    const sA = parseInt(s.scoreA, 10);
    const sB = parseInt(s.scoreB, 10);

    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
      setError("Scores invalides.");
      return;
    }
    if (sA === sB) {
      setError("Pas d'égalité en élimination directe — il doit y avoir un vainqueur.");
      return;
    }

    updateEliminationScore(tournamentId, match.id, sA, sB, s.overtime || false);
    setSaved(prev => ({ ...prev, [match.id]: true }));
    refresh();
    if (onBracketUpdated) onBracketUpdated();
  };

  // ---------- calculs dérivés ----------

  const hasMatches = elimMatches.length > 0;
  const poolCount  = tournament?.pools?.length || 0;

  const matchesByPhase = {};
  elimMatches.forEach(m => {
    if (!matchesByPhase[m.phase]) matchesByPhase[m.phase] = [];
    matchesByPhase[m.phase].push(m);
  });
  const phases = PHASE_ORDER.filter(p => matchesByPhase[p]);

  // Nombre réel d'équipes qualifiées (tient compte des poules de taille inégale)
  const actualQualified    = getQualifiedTeams(tournamentId, teamsPerPool);
  const actualTotalQ       = actualQualified.length;
  const lowerBracketCount  = Math.max(0, actualTotalQ - 8);

  // Détecter si le bracket généré n'a pas de phase de classement 9e+
  const hasLowerBracket = phases.some(p => p.startsWith("LOWER_") || p.startsWith("CLASSEMENT_9") || p.startsWith("CLASSEMENT_11") || p.startsWith("CLASSEMENT_13"));

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const isFinishedMatch = (m) => m?.scoreA !== null && m?.scoreB !== null && m?.teamA && m?.teamB;
  const getWinner = (m) => isFinishedMatch(m) ? (m.scoreA > m.scoreB ? m.teamA : m.teamB) : null;
  const getLoser  = (m) => isFinishedMatch(m) ? (m.scoreA < m.scoreB ? m.teamA : m.teamB) : null;

  // ── Bracket principal ────────────────────────────────────────────────────────
  const finalMatch   = elimMatches.find(m => m.phase === "FINALE");
  const thirdMatch   = elimMatches.find(m => m.phase === "CLASSEMENT_3");
  const fifthMatch   = elimMatches.find(m => m.phase === "CLASSEMENT_5");
  const seventhMatch = elimMatches.find(m => m.phase === "CLASSEMENT_7");

  // ── Bracket bas générique (CLASSEMENT_9/11/13/15, cas n=4/7/8 équipes) ──────
  const ninthMatchG    = elimMatches.find(m => m.phase === "CLASSEMENT_9");
  const eleventhMatchG = elimMatches.find(m => m.phase === "CLASSEMENT_11");
  const thirteenthMatchG = elimMatches.find(m => m.phase === "CLASSEMENT_13");
  const fifteenthMatchG  = elimMatches.find(m => m.phase === "CLASSEMENT_15");

  // ── Bracket bas Tour 1/2/3 (cas n=5/6 équipes) ───────────────────────────────
  const lowerT1 = elimMatches.filter(m => m.phase === "LOWER_T1");
  const lowerT2 = elimMatches.filter(m => m.phase === "LOWER_T2");
  const lowerT3Match = elimMatches.find(m => m.phase === "LOWER_T3");

  // Match A (13e/14e) : T1 match sans aucune dépendance (équipes connues dès le départ)
  const matchA_13_14 = lowerT1.find(
    m => !m.dependsOnA && !m.dependsOnB && !m.loserDependsOnA && !m.loserDependsOnB
  );
  // Match E (9e/10e) : T2 match avec propagation des VAINQUEURS de B et C
  const matchE_9_10 = lowerT2.find(m => m.dependsOnA && m.dependsOnB);
  // Match D (11e/12e) : T2 match avec propagation des PERDANTS de B et C
  const matchD_11_12 = lowerT2.find(m => m.loserDependsOnA && m.loserDependsOnB && !m.dependsOnA);

  // ── Classement final calculé ──────────────────────────────────────────────────
  const champion   = getWinner(finalMatch);
  const runnerUp   = getLoser(finalMatch);
  const thirdPlace = getWinner(thirdMatch);
  const fifthPlace = getWinner(fifthMatch);
  const seventhPlace = getWinner(seventhMatch);

  // Places 9-14 (bracket T-format ou générique selon la taille du bracket)
  const ninthPlace    = getWinner(matchE_9_10) || getWinner(ninthMatchG);
  const tenthPlace    = getLoser(matchE_9_10)  || getLoser(ninthMatchG);
  const eleventhPlace = getWinner(matchD_11_12) || getWinner(eleventhMatchG);
  const twelfthPlace  = getWinner(lowerT3Match) || getLoser(eleventhMatchG);
  const thirteenthPlace = getLoser(lowerT3Match) || getWinner(thirteenthMatchG);
  const fourteenthPlace = getLoser(thirteenthMatchG) || getLoser(matchA_13_14);
  const fifteenthPlace  = getWinner(fifteenthMatchG);
  const sixteenthPlace  = getLoser(fifteenthMatchG);

  const totalQualified = poolCount * teamsPerPool;
  const getFormatLabel = (n) => {
    if (n >= 8) return "Format : QF + Demi-finales + Classements 3e/5e/7e + Finale (toutes les équipes jouent jusqu'à la fin)";
    if (n >= 5) return "Format : Bracket 8 avec byes + Classements 3e/5e/7e + Finale";
    if (n === 4) return "Format : 2 Demi-finales + Petite finale + Finale";
    if (n === 3) return "Format : Demi-finale + Finale (1er a un bye)";
    if (n === 2) return "Format : Finale directe";
    return "";
  };

  // ---------- rendu ----------

  if (!loaded) {
    return (
      <div className="elimination-bracket">
        <p className="empty-state">Chargement du tableau final…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="elimination-bracket">
        <p className="empty-state">Tournoi introuvable.</p>
      </div>
    );
  }

  return (
    <div className="elimination-bracket">

      {/* En-tête */}
      <div className="bracket-header">
        <div>
          <h2>🏆 Tableau final</h2>
          <p className="bracket-subtitle">
            Élimination directe · 7 min · 21 pts · Sudden death si égalité à la sirène
          </p>
        </div>
        {hasMatches && (
          <button className="btn-secondary btn-small" onClick={handleReset}>
            Réinitialiser
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Podium complet (affiché au fur et à mesure que les matchs de classement sont joués) */}
      {(champion || ninthPlace || fourteenthPlace) && (
        <div className="bracket-podium">
          {champion && (
            <div className="podium-item podium-item--gold">
              <span className="podium-medal">🥇</span>
              <div className="podium-rank">Champion</div>
              <div className="podium-name">{champion.name}</div>
            </div>
          )}
          {runnerUp && (
            <div className="podium-item podium-item--silver">
              <span className="podium-medal">🥈</span>
              <div className="podium-rank">2ème place</div>
              <div className="podium-name">{runnerUp.name}</div>
            </div>
          )}
          {thirdPlace && (
            <div className="podium-item podium-item--bronze">
              <span className="podium-medal">🥉</span>
              <div className="podium-rank">3ème place</div>
              <div className="podium-name">{thirdPlace.name}</div>
            </div>
          )}
          {[
            { place: fifthPlace,       rank: "5ème"  },
            { place: seventhPlace,     rank: "7ème"  },
            { place: ninthPlace,       rank: "9ème"  },
            { place: tenthPlace,       rank: "10ème" },
            { place: eleventhPlace,    rank: "11ème" },
            { place: twelfthPlace,     rank: "12ème" },
            { place: thirteenthPlace,  rank: "13ème" },
            { place: fourteenthPlace,  rank: "14ème" },
            { place: fifteenthPlace,   rank: "15ème" },
            { place: sixteenthPlace,   rank: "16ème" },
          ].filter(x => x.place).map(({ place, rank }) => (
            <div key={rank} className="podium-item podium-item--lower">
              <div className="podium-rank">{rank} place</div>
              <div className="podium-name podium-name--small">{place.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* Avertissement poules non terminées */}
      {!allPoolsDone && (
        <div className="bracket-warning">
          ⚠️ Certains matchs de poules ne sont pas encore terminés.
          {!hasMatches && " Tu peux quand même générer le tableau si tu le souhaites."}
        </div>
      )}

      {/* Formulaire de configuration (avant génération) */}
      {!hasMatches && (
        <div className="bracket-setup">
          <h3>Configurer le tableau final</h3>

          <p className="bracket-setup-info">
            Tu as <strong>{poolCount} poule{poolCount > 1 ? "s" : ""}</strong>.
            Choisis combien d'équipes par poule accèdent au tableau final.
          </p>

          <div className="bracket-config">
            <label htmlFor="teamsPerPool">Équipes qualifiées par poule</label>
            <select
              id="teamsPerPool"
              value={teamsPerPool}
              onChange={e => setTeamsPerPool(parseInt(e.target.value, 10))}
            >
              {Array.from({ length: maxTeams }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>
                  {n} équipe{n > 1 ? "s" : ""} par poule —{" "}
                  {n === 1 ? "les 1ers" :
                   n === 2 ? "1ers et 2èmes" :
                   n === 3 ? "les 3 premiers" :
                   n === 4 ? "les 4 premiers ✓ règlement" :
                   `les ${n} premiers`}
                </option>
              ))}
            </select>
          </div>

          <div className="bracket-config-info">
            <span>
              <strong>{actualTotalQ} équipes réellement qualifiées</strong>
              {actualTotalQ !== poolCount * teamsPerPool && (
                <span className="bracket-config-warn"> (poules de taille inégale)</span>
              )}
            </span>
            <span>{getFormatLabel(actualTotalQ)}</span>
            {lowerBracketCount > 0 && (
              <span className="bracket-config-lower">
                → Bracket 9e-{8 + lowerBracketCount}e : {lowerBracketCount} équipe{lowerBracketCount > 1 ? "s" : ""}
              </span>
            )}
            {lowerBracketCount === 0 && actualTotalQ >= 2 && (
              <span className="bracket-config-warn">
                ⚠️ Aucun bracket de classement (9e+). Il faut ≥ 10 équipes qualifiées au total.
              </span>
            )}
            {actualTotalQ < 2 && (
              <span className="bracket-config-warn"> ⚠️ Il faut au moins 2 équipes qualifiées</span>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={actualTotalQ < 2}
          >
            Générer le tableau final
          </button>
        </div>
      )}

      {/* Équipes qualifiées (têtes de série) */}
      {hasMatches && qualified.length > 0 && (
        <div className="bracket-qualified">
          <h4>Têtes de série ({qualified.length} équipes)</h4>
          <div className="qualified-list">
            {qualified.map((q, idx) => (
              <div key={q.team?.id || idx} className="qualified-item">
                <span className="qualified-seed">#{idx + 1}</span>
                <span className="qualified-team">{q.team?.name}</span>
                <span className="qualified-pool">
                  {q.poolName} · {q.rank === 1 ? "1er" : q.rank === 2 ? "2ème" : q.rank === 3 ? "3ème" : `${q.rank}ème`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avertissement : bracket généré sans classement 9e+ */}
      {hasMatches && !hasLowerBracket && (
        <div className="bracket-warning">
          ⚠️ Aucun match de classement (9e place et au-delà) n'est généré.
          Pour les obtenir, réinitialise et régénère le tableau en qualifiant
          plus d'équipes par poule (minimum 10 équipes qualifiées au total).
        </div>
      )}

      {/* Phases du tableau */}
      {hasMatches && (
        <div className="bracket-phases">
          {phases.map(phase => {
            const meta = PHASE_META[phase] || { label: phase, accent: "#94a3b8" };
            return (
              <div key={phase} className="bracket-phase">
                <div className="bracket-phase-header" style={{ borderLeftColor: meta.accent }}>
                  <h3 className="bracket-phase-title" style={{ color: meta.accent }}>
                    {meta.label}
                  </h3>
                </div>

                <div className="bracket-matches">
                  {matchesByPhase[phase].map(match => {
                    const s = scores[match.id] || { scoreA: "", scoreB: "", overtime: false };
                    const isFinished = match.scoreA !== null && match.scoreB !== null;
                    const wasSaved   = saved[match.id];
                    const canScore   = !!(match.teamA && match.teamB) && !isFinished;
                    const winnerA    = isFinished && match.scoreA > match.scoreB;
                    const winnerB    = isFinished && match.scoreB > match.scoreA;

                    return (
                      <div
                        key={match.id}
                        className={[
                          "bracket-match-card",
                          isFinished                   ? "bracket-match--done"    : "",
                          !match.teamA || !match.teamB ? "bracket-match--pending" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {/* Label du match */}
                        {match.matchLabel && (
                          <div className="bracket-match-label" style={{ color: meta.accent }}>
                            {match.matchLabel}
                          </div>
                        )}

                        {/* Horaire et terrain */}
                        {(match.startTime || match.court) && (
                          <div className="bracket-match-time">
                            {match.startTime && (
                              <span className="match-time">{fmt(match.startTime)}</span>
                            )}
                            {match.court && (
                              <span className="bracket-match-court">
                                Terrain {match.court}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Équipes + scores */}
                        <div className="bracket-teams">
                          <TeamRow team={match.teamA} score={match.scoreA} isWinner={winnerA} isFinished={isFinished} />
                          <div className="bracket-divider" />
                          <TeamRow team={match.teamB} score={match.scoreB} isWinner={winnerB} isFinished={isFinished} />
                        </div>

                        {/* Note de progression (routing hint pour bracket bas) */}
                        {match.note && !isFinished && (
                          <div className="bracket-match-note">{match.note}</div>
                        )}

                        {/* Badge overtime */}
                        {isFinished && match.overtime && (
                          <div className="bracket-ot-badge">Prolongation (sudden death)</div>
                        )}

                        {/* Saisie du score */}
                        {canScore && (
                          <div className="bracket-score-entry">
                            <div className="bracket-score-inputs">
                              <span className="bt-input-team">{match.teamA?.name}</span>
                              <input
                                type="number" min="0" max="99"
                                value={s.scoreA}
                                onChange={e => handleScoreChange(match.id, "scoreA", e.target.value)}
                                className="score-box"
                                placeholder="0"
                              />
                              <span className="score-sep">:</span>
                              <input
                                type="number" min="0" max="99"
                                value={s.scoreB}
                                onChange={e => handleScoreChange(match.id, "scoreB", e.target.value)}
                                className="score-box"
                                placeholder="0"
                              />
                              <span className="bt-input-team bt-input-team--right">{match.teamB?.name}</span>
                            </div>
                            <label className="bracket-overtime-check">
                              <input
                                type="checkbox"
                                checked={s.overtime}
                                onChange={e => handleScoreChange(match.id, "overtime", e.target.checked)}
                              />
                              Prolongation (sudden death)
                            </label>
                            <button
                              className={`btn-save-score ${wasSaved ? "btn-save-score--saved" : ""}`}
                              onClick={() => handleSaveScore(match)}
                            >
                              {wasSaved ? "✓ Enregistré" : "Enregistrer le score"}
                            </button>
                          </div>
                        )}

                        {/* Match en attente des résultats précédents */}
                        {!isFinished && !canScore && (match.teamA || match.teamB) && (
                          <p className="bracket-awaiting">
                            En attente des résultats du tour précédent…
                          </p>
                        )}
                        {!isFinished && !match.teamA && !match.teamB && (
                          <p className="bracket-awaiting">
                            Les équipes seront déterminées après les matchs précédents.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
