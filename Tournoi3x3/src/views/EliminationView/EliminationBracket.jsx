import React, { useCallback, useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import {
  generateEliminationBracket,
  getEliminationMatches,
  updateEliminationScore,
  areAllPoolMatchesFinished,
  clearEliminationBracket,
  getQualifiedTeams,
} from "../../controllers/eliminationController";

// Ordre d'affichage des phases
const PHASE_ORDER = ["QUART", "DEMI", "CLASSEMENT_3", "FINALE"];

const PHASE_META = {
  QUART:         { label: "Quarts de finale",           accent: "#6366f1" },
  DEMI:          { label: "Demi-finales",               accent: "#f97316" },
  CLASSEMENT_3:  { label: "Petite finale — 3ème place", accent: "#64748b" },
  FINALE:        { label: "Finale",                     accent: "#eab308" },
};

function TeamRow({ team, score, isWinner, isFinished }) {
  return (
    <div className={[
      "bt-team-row",
      isWinner   ? "bt-team-row--winner"  : "",
      !team      ? "bt-team-row--tbd"     : "",
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
  const [teamsPerPool, setTeamsPerPool] = useState(1);
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

        const initScores = {};
        elims.forEach(m => {
          initScores[m.id] = {
            scoreA:   m.scoreA  !== null && m.scoreA  !== undefined ? String(m.scoreA)  : "",
            scoreB:   m.scoreB  !== null && m.scoreB  !== undefined ? String(m.scoreB)  : "",
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

  const hasMatches   = elimMatches.length > 0;
  const poolCount    = tournament?.pools?.length || 0;

  const matchesByPhase = {};
  elimMatches.forEach(m => {
    if (!matchesByPhase[m.phase]) matchesByPhase[m.phase] = [];
    matchesByPhase[m.phase].push(m);
  });
  const phases = PHASE_ORDER.filter(p => matchesByPhase[p]);

  const finalMatch = elimMatches.find(m => m.phase === "FINALE");
  const champion = finalMatch?.scoreA !== null && finalMatch?.scoreB !== null && finalMatch?.teamA && finalMatch?.teamB
    ? (finalMatch.scoreA > finalMatch.scoreB ? finalMatch.teamA : finalMatch.teamB)
    : null;

  const thirdMatch = elimMatches.find(m => m.phase === "CLASSEMENT_3");
  const thirdPlace = thirdMatch?.scoreA !== null && thirdMatch?.scoreB !== null && thirdMatch?.teamA && thirdMatch?.teamB
    ? (thirdMatch.scoreA > thirdMatch.scoreB ? thirdMatch.teamA : thirdMatch.teamB)
    : null;

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

      {/* Podium (une fois la finale et la petite finale jouées) */}
      {(champion || thirdPlace) && (
        <div className="bracket-podium">
          {champion && (
            <div className="podium-item podium-item--gold">
              <span className="podium-medal">🥇</span>
              <div className="podium-rank">Champion</div>
              <div className="podium-name">{champion.name}</div>
            </div>
          )}
          {thirdPlace && (
            <div className="podium-item podium-item--bronze">
              <span className="podium-medal">🥉</span>
              <div className="podium-rank">3ème place</div>
              <div className="podium-name">{thirdPlace.name}</div>
            </div>
          )}
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
              <option value={1}>1 équipe — le 1er de chaque poule ({poolCount * 1} qualifié{poolCount > 1 ? "s" : ""})</option>
              <option value={2}>2 équipes — 1er et 2ème ({poolCount * 2} qualifiés)</option>
              <option value={3}>3 équipes — les 3 premiers ({poolCount * 3} qualifiés)</option>
            </select>
          </div>

          <div className="bracket-config-info">
            {poolCount * teamsPerPool >= 4 && (
              <span>→ Format : Demi-finales + Petite finale (3ème place) + Finale</span>
            )}
            {poolCount * teamsPerPool === 3 && (
              <span>→ Format : Demi-finale + Finale (1er a un bye)</span>
            )}
            {poolCount * teamsPerPool === 2 && (
              <span>→ Format : Finale directe</span>
            )}
            {poolCount * teamsPerPool < 2 && (
              <span className="bracket-config-warn">⚠️ Il faut au moins 2 équipes qualifiées</span>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={poolCount * teamsPerPool < 2}
          >
            Générer le tableau final
          </button>
        </div>
      )}

      {/* Équipes qualifiées */}
      {hasMatches && qualified.length > 0 && (
        <div className="bracket-qualified">
          <h4>Têtes de série</h4>
          <div className="qualified-list">
            {qualified.map((q, idx) => (
              <div key={q.team?.id || idx} className="qualified-item">
                <span className="qualified-seed">#{idx + 1}</span>
                <span className="qualified-team">{q.team?.name}</span>
                <span className="qualified-pool">{q.poolName} · {q.rank === 1 ? "1er" : q.rank === 2 ? "2ème" : `${q.rank}ème`}</span>
              </div>
            ))}
          </div>
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
                  <h3 className="bracket-phase-title">{meta.label}</h3>
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
                          isFinished             ? "bracket-match--done"    : "",
                          !match.teamA || !match.teamB ? "bracket-match--pending" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {/* Label du match */}
                        {match.matchLabel && (
                          <div className="bracket-match-label" style={{ color: meta.accent }}>
                            {match.matchLabel}
                          </div>
                        )}

                        {/* Équipes + scores */}
                        <div className="bracket-teams">
                          <TeamRow team={match.teamA} score={match.scoreA} isWinner={winnerA} isFinished={isFinished} />
                          <div className="bracket-divider" />
                          <TeamRow team={match.teamB} score={match.scoreB} isWinner={winnerB} isFinished={isFinished} />
                        </div>

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
