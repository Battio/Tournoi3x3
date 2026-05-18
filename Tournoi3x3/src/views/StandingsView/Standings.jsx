import React, { useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import { getPools } from "../../controllers/tournamentController";
import { getMatchesByTournament } from "../../controllers/matchController";
import { calculateStandings } from "../../utils/standings";

export default function Standings({ tournamentId }) {
  const [tournament, setTournament] = useState(null);
  const [pools, setPools] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    setTournament(t); // eslint-disable-line react-hooks/set-state-in-effect

    const p = getPools(tournamentId);
    setPools(p); // eslint-disable-line react-hooks/set-state-in-effect

    const m = getMatchesByTournament(tournamentId);
    setMatches(m); // eslint-disable-line react-hooks/set-state-in-effect
  }, [tournamentId]);

  if (!tournament) {
    return <p>Chargement du classement...</p>;
  }

  return (
    <div className="standings-page">
      <h2>📊 Classements</h2>

      {pools.length === 0 && <p>Aucune poule générée.</p>}

      <div className="standings-grid">
        {pools.map((pool) => {
          const poolMatches = matches.filter((m) => m.poolId === pool.id);
          const standings = calculateStandings(pool.teams, poolMatches, tournament.settings);

          return (
            <div key={pool.id} className="standings-card">
              <h3>{pool.name}</h3>

              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Équipe</th>
                    <th>Pts</th>
                    <th>V</th>
                    <th>D</th>
                    <th>Diff</th>
                    <th>Marqués</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => (
                    <tr key={row.team.id}>
                      <td>{row.team.name}</td>
                      <td>{row.points}</td>
                      <td>{row.wins}</td>
                      <td>{row.losses}</td>
                      <td>{row.diff}</td>
                      <td>{row.scored}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4>Matchs joués</h4>
              <ul className="match-list">
                {poolMatches.map((match) => (
                  <li key={match.id} className="match-item">
                    <strong>{match.teamA.name}</strong> vs{" "}
                    <strong>{match.teamB.name}</strong>

                    {match.scoreA !== null && match.scoreB !== null ? (
                      <span className="score">
                        {" "}
                        — {match.scoreA} : {match.scoreB}
                        {match.overtime && " (OT)"}
                      </span>
                    ) : (
                      <span className="pending"> — À jouer</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
