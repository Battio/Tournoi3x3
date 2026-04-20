import React, { useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import { getPools } from "../../controllers/poolController";
import { getMatchesByTournament } from "../../controllers/matchController";
import { calculateStandings } from "../../utils/standings";

export default function PublicTournament({ tournamentId }) {
  const [tournament, setTournament] = useState(null);
  const [pools, setPools] = useState([]);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    setTournament(t);

    const p = getPools(tournamentId);
    setPools(p);

    const m = getMatchesByTournament(tournamentId);
    setMatches(m);
  }, [tournamentId]);

  if (!tournament) {
    return <p>Chargement du tournoi...</p>;
  }

  return (
    <div className="public-tournament">
      <header className="tournament-header">
        <h1>{tournament.name}</h1>
        <p>
          📍 {tournament.location} — {new Date(tournament.date).toLocaleDateString()}
        </p>
        <p>Catégorie : {tournament.category}</p>
      </header>

      <section className="pools-section">
        <h2>🏀 Poules</h2>

        {pools.length === 0 && <p>Aucune poule générée.</p>}

        <div className="pools-grid">
          {pools.map((pool) => {
            const poolMatches = matches.filter((m) => m.poolId === pool.id);
            const standings = calculateStandings(pool.teams, poolMatches, tournament.settings);

            return (
              <div key={pool.id} className="pool-card">
                <h3>{pool.name}</h3>

                <h4>Équipes</h4>
                <ul>
                  {pool.teams.map((team) => (
                    <li key={team.id}>{team.name}</li>
                  ))}
                </ul>

                <h4>Classement</h4>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Équipe</th>
                      <th>Pts</th>
                      <th>Diff</th>
                      <th>Marqués</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.team.id}>
                        <td>{row.team.name}</td>
                        <td>{row.points}</td>
                        <td>{row.diff}</td>
                        <td>{row.scored}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4>Matchs</h4>
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

                      {match.startTime && (
                        <div className="match-time">
                          🕒 {new Date(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
