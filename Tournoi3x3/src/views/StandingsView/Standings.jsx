import React, { useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import { getPools } from "../../controllers/poolController";
import { getMatchesByTournament } from "../../controllers/matchController";
import { calculateStandings } from "../../utils/standings";

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Standings({ tournamentId, qualifyCount = 0 }) {
  const [tournament, setTournament] = useState(null);
  const [pools, setPools] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    setTournament(t); // eslint-disable-line react-hooks/set-state-in-effect
    setPools(getPools(tournamentId) || []); // eslint-disable-line react-hooks/set-state-in-effect
    setMatches(getMatchesByTournament(tournamentId) || []); // eslint-disable-line react-hooks/set-state-in-effect
  }, [tournamentId]);

  if (!tournament) return <p>Chargement du classement...</p>;

  const settings = tournament.settings ?? { winPoints: 2, lossPoints: 1, forfeitPoints: 0 };
  // Nombre de qualifiés par poule (depuis le tableau final généré)
  const alreadyQualified = tournament.qualifiedTeams || [];

  return (
    <div className="standings-page">
      <h2>📊 Classements</h2>

      {pools.length === 0 && (
        <p className="empty-state">Aucune poule générée.</p>
      )}

      <div className="standings-grid">
        {pools.map((pool) => {
          const poolMatches = matches.filter((m) => m.poolId === pool.id);
          const played = poolMatches.filter(
            (m) => m.scoreA !== null && m.scoreB !== null
          );
          const pending = poolMatches.filter(
            (m) => m.scoreA === null || m.scoreB === null
          );
          const standings = calculateStandings(pool.teams, poolMatches, settings);

          // Identifier les équipes déjà qualifiées pour le tableau final
          const qualifiedIds = new Set(alreadyQualified.map(q => q.team?.id));

          return (
            <div key={pool.id} className="standings-block">
              <div className="standings-pool-header">
                <h3>{pool.name}</h3>
                <span className="standings-legend">
                  V = {settings.winPoints} pts · D = {settings.lossPoints} pt · Forfait = 0 pt
                </span>
              </div>

              {/* Tableau de classement */}
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Équipe</th>
                    <th title="Points classement">Pts</th>
                    <th title="Victoires">V</th>
                    <th title="Défaites">D</th>
                    <th title="Différence">+/-</th>
                    <th title="Points marqués">Mkq</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, rank) => {
                    const isLeader = rank === 0 && played.length > 0;
                    const isQualified = qualifiedIds.has(row.team.id);
                    return (
                      <tr
                        key={row.team.id}
                        className={`${isLeader ? "standings-leader" : ""} ${isQualified ? "standings-qualified" : ""}`}
                      >
                        <td className="rank-cell">{rank + 1}</td>
                        <td className="team-cell">{row.team.name}</td>
                        <td className="pts-cell">{row.points}</td>
                        <td>{row.wins}</td>
                        <td>{row.losses}</td>
                        <td className={row.diff > 0 ? "diff-pos" : row.diff < 0 ? "diff-neg" : ""}>
                          {row.diff > 0 ? `+${row.diff}` : row.diff}
                        </td>
                        <td>{row.scored}</td>
                        <td>
                          {isQualified && (
                            <span className="qualified-tag">✓ Qualifié</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Résultats des matchs joués */}
              {played.length > 0 && (
                <div className="results-section">
                  <h4>Résultats</h4>
                  <div className="results-list">
                    {played
                      .slice()
                      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                      .map((match) => {
                        const aWins = match.scoreA > match.scoreB;
                        return (
                          <div key={match.id} className="result-row">
                            {fmt(match.startTime) && (
                              <span className="result-time">{fmt(match.startTime)}</span>
                            )}
                            <span className={`result-team ${aWins ? "result-winner" : ""}`}>
                              {match.teamA.name}
                            </span>
                            <span className="result-score">
                              {match.scoreA} — {match.scoreB}
                              {match.forfeitTeam && (
                                <span className="result-forfeit-badge"> F</span>
                              )}
                              {match.overtime && (
                                <span className="result-ot-badge"> OT</span>
                              )}
                            </span>
                            <span className={`result-team result-team-right ${!aWins ? "result-winner" : ""}`}>
                              {match.teamB.name}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Matchs à venir */}
              {pending.length > 0 && (
                <div className="pending-section">
                  <h4>À jouer ({pending.length})</h4>
                  <div className="results-list">
                    {pending
                      .slice()
                      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                      .map((match) => (
                        <div key={match.id} className="result-row result-row--pending">
                          {fmt(match.startTime) && (
                            <span className="result-time">{fmt(match.startTime)}</span>
                          )}
                          <span className="result-team">{match.teamA.name}</span>
                          <span className="result-score result-score--pending">vs</span>
                          <span className="result-team result-team-right">{match.teamB.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
