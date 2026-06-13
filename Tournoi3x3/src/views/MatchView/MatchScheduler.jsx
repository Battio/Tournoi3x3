import React, { useCallback, useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import { getPools } from "../../controllers/poolController";
import { generateMatches } from "../../utils/matchGenerator";
import {
  saveMatchesForTournament,
  updateMatchScore,
  setForfeit,
} from "../../controllers/matchController";

const SLOT_MINUTES = 10;
const START_HOUR = 9;
const START_MINUTE = 30; // Arrivée 9h00, matchs à partir de 9h30

// Réordonne les matchs pour qu'une même équipe ne joue pas deux fois de suite
function avoidBackToBack(matches) {
  if (matches.length <= 1) return matches;

  const result = [matches[0]];
  const remaining = matches.slice(1);

  while (remaining.length > 0) {
    const last = result[result.length - 1];
    const busyIds = new Set([last.teamA.id, last.teamB.id]);

    const nextIdx = remaining.findIndex(
      (m) => !busyIds.has(m.teamA.id) && !busyIds.has(m.teamB.id)
    );

    if (nextIdx !== -1) {
      result.push(remaining.splice(nextIdx, 1)[0]);
    } else {
      result.push(remaining.shift());
    }
  }

  return result;
}

function buildSchedule(pools, tournamentDate) {
  const courtBuckets = {};

  pools.forEach((pool, idx) => {
    const court = (idx % 2) + 1;
    if (!courtBuckets[court]) courtBuckets[court] = [];

    const matches = generateMatches(pool.teams, pool.id);
    matches.forEach((m) => {
      m.court = court;
      m.poolName = pool.name;
    });
    courtBuckets[court].push(...matches);
  });

  const base = tournamentDate ? new Date(tournamentDate) : new Date();
  const allMatches = [];

  Object.entries(courtBuckets).forEach(([, matches]) => {
    const ordered = avoidBackToBack(matches);
    ordered.forEach((match, slotIdx) => {
      const t = new Date(base);
      t.setHours(START_HOUR, START_MINUTE + slotIdx * SLOT_MINUTES, 0, 0);
      match.startTime = t.toISOString();
    });
    allMatches.push(...ordered);
  });

  return allMatches;
}

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByCourt(matches) {
  const courts = {};
  matches.forEach((m) => {
    const c = m.court ?? 1;
    if (!courts[c]) courts[c] = [];
    courts[c].push(m);
  });
  return courts;
}

export default function MatchScheduler({ tournamentId, onScoresUpdated }) {
  const [tournament, setTournament] = useState(null);
  const [pools, setPools] = useState([]);
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [saved, setSaved] = useState({});
  const [forfeitConfirm, setForfeitConfirm] = useState(null); // { matchId, side }

  const refresh = useCallback(() => {
    const t = getTournamentById(tournamentId);
    if (!t) return;
    setTournament(t);
    setPools(getPools(tournamentId) || []);
    // N'afficher que les matchs de poule
    const poolMatches = (t.matches || []).filter(m => m.phase === "POULE" || !m.phase);
    setMatches(poolMatches);

    const initScores = {};
    poolMatches.forEach((m) => {
      initScores[m.id] = {
        scoreA: m.scoreA !== null && m.scoreA !== undefined ? String(m.scoreA) : "",
        scoreB: m.scoreB !== null && m.scoreB !== undefined ? String(m.scoreB) : "",
        overtime: m.overtime || false,
      };
    });
    setScores(initScores);
  }, [tournamentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleGenerate = () => {
    if (!pools || pools.length === 0) {
      alert("Génère les poules d'abord.");
      return;
    }
    const generated = buildSchedule(pools, tournament?.date);
    saveMatchesForTournament(tournamentId, generated);
    setMatches(generated);

    const initScores = {};
    generated.forEach((m) => {
      initScores[m.id] = { scoreA: "", scoreB: "", overtime: false };
    });
    setScores(initScores);
    setSaved({});
  };

  const handleScoreChange = (matchId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }));
    setSaved((prev) => ({ ...prev, [matchId]: false }));
  };

  const handleSaveScore = (match) => {
    const s = scores[match.id] || {};
    const sA = parseInt(s.scoreA, 10);
    const sB = parseInt(s.scoreB, 10);

    if (isNaN(sA) || isNaN(sB) || sA < 0 || sB < 0) {
      alert("Scores invalides.");
      return;
    }

    updateMatchScore(tournamentId, match.id, sA, sB, s.overtime || false);
    setSaved((prev) => ({ ...prev, [match.id]: true }));

    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id ? { ...m, scoreA: sA, scoreB: sB, overtime: s.overtime || false } : m
      )
    );

    if (onScoresUpdated) onScoresUpdated();
  };

  const handleForfeitClick = (matchId, side) => {
    setForfeitConfirm({ matchId, side });
  };

  const confirmForfeit = () => {
    if (!forfeitConfirm) return;
    const { matchId, side } = forfeitConfirm;

    setForfeit(tournamentId, matchId, side);
    setSaved((prev) => ({ ...prev, [matchId]: true }));
    setForfeitConfirm(null);
    refresh();
    if (onScoresUpdated) onScoresUpdated();
  };

  if (!tournament) return <p>Chargement…</p>;

  const courts = groupByCourt(matches);
  const courtNumbers = Object.keys(courts).sort();
  const allFinished = matches.length > 0 && matches.every(m => m.scoreA !== null && m.scoreB !== null);

  return (
    <div className="match-scheduler">
      {/* Dialogue de confirmation forfait */}
      {forfeitConfirm && (() => {
        const m = matches.find(m => m.id === forfeitConfirm.matchId);
        const teamName = forfeitConfirm.side === "A" ? m?.teamA?.name : m?.teamB?.name;
        return (
          <div className="modal-overlay" onClick={() => setForfeitConfirm(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3>Confirmer le forfait</h3>
              <p>
                <strong>{teamName}</strong> déclare forfait.<br />
                Score : 0 — 21 · 0 point au classement.
              </p>
              <div className="modal-actions">
                <button className="btn-danger" onClick={confirmForfeit}>Confirmer</button>
                <button className="btn-secondary" onClick={() => setForfeitConfirm(null)}>Annuler</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="scheduler-header">
        <div>
          <h2>📅 Planning des matchs</h2>
          <p className="scheduler-info">
            Arrivée : <strong>9h00</strong> · Matchs dès : <strong>9h30</strong> · Durée : <strong>7 min · 21 pts</strong> · Créneaux : <strong>10 min</strong>
            {courts && Object.keys(courts).length > 0 && ` · ${Object.keys(courts).length} terrain${Object.keys(courts).length > 1 ? "s" : ""}`}
          </p>
          {allFinished && matches.length > 0 && (
            <p className="scheduler-all-done">✅ Tous les matchs de poule sont terminés — va dans l'onglet Tableau final !</p>
          )}
        </div>
        <button className="btn-primary" onClick={handleGenerate}>
          {matches.length > 0 ? "Regénérer" : "Générer les matchs"}
        </button>
      </div>

      {matches.length === 0 && (
        <p className="empty-state">Aucun match généré. Clique sur « Générer les matchs ».</p>
      )}

      {matches.length > 0 && (
        <div className="courts-grid">
          {courtNumbers.map((court) => {
            const courtMatches = courts[court];
            const poolName = courtMatches[0]?.poolName ?? `Poule ${court}`;

            return (
              <div key={court} className="court-column">
                <div className="court-header">
                  <span className="court-icon">🏀</span>
                  <div>
                    <h3>Terrain {court}</h3>
                    <span className="court-pool">{poolName}</span>
                  </div>
                </div>

                <div className="match-list">
                  {courtMatches.map((match) => {
                    const s = scores[match.id] || { scoreA: "", scoreB: "", overtime: false };
                    const isFinished = match.scoreA !== null && match.scoreB !== null;
                    const wasSaved = saved[match.id];
                    const isForfeit = !!match.forfeitTeam;

                    return (
                      <div
                        key={match.id}
                        className={`match-card ${isFinished ? "match-card--done" : ""} ${isForfeit ? "match-card--forfeit" : ""}`}
                      >
                        <span className="match-time">{fmt(match.startTime)}</span>

                        <div className="match-score-row">
                          <span className="match-team">{match.teamA.name}</span>

                          <div className="score-inputs">
                            {isFinished ? (
                              <span className="score-display">
                                {match.scoreA}
                                {isForfeit && match.forfeitTeam === match.teamA?.id && (
                                  <span className="forfeit-badge">F</span>
                                )}
                              </span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={s.scoreA}
                                onChange={(e) => handleScoreChange(match.id, "scoreA", e.target.value)}
                                className="score-box"
                                placeholder="—"
                              />
                            )}
                            <span className="score-sep">:</span>
                            {isFinished ? (
                              <span className="score-display">
                                {match.scoreB}
                                {isForfeit && match.forfeitTeam === match.teamB?.id && (
                                  <span className="forfeit-badge">F</span>
                                )}
                              </span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={s.scoreB}
                                onChange={(e) => handleScoreChange(match.id, "scoreB", e.target.value)}
                                className="score-box"
                                placeholder="—"
                              />
                            )}
                          </div>

                          <span className="match-team match-team--right">
                            {match.teamB.name}
                          </span>
                        </div>

                        {isFinished && match.overtime && (
                          <div className="match-ot-label">Prolongation (sudden death)</div>
                        )}

                        {!isFinished && (
                          <>
                            <div className="match-overtime-row">
                              <label className="overtime-check-label">
                                <input
                                  type="checkbox"
                                  checked={s.overtime}
                                  onChange={(e) => handleScoreChange(match.id, "overtime", e.target.checked)}
                                />
                                Prolongation
                              </label>
                            </div>
                            <div className="match-save-row">
                              <button
                                className={`btn-save-score ${wasSaved ? "btn-save-score--saved" : ""}`}
                                onClick={() => handleSaveScore(match)}
                              >
                                {wasSaved ? "✓ Enregistré" : "Enregistrer"}
                              </button>
                              <div className="forfeit-buttons">
                                <button
                                  className="btn-forfeit"
                                  title={`Forfait ${match.teamA.name}`}
                                  onClick={() => handleForfeitClick(match.id, "A")}
                                >
                                  F {match.teamA.name}
                                </button>
                                <button
                                  className="btn-forfeit"
                                  title={`Forfait ${match.teamB.name}`}
                                  onClick={() => handleForfeitClick(match.id, "B")}
                                >
                                  F {match.teamB.name}
                                </button>
                              </div>
                            </div>
                          </>
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
