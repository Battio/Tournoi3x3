import React, { useEffect, useState } from "react";
import { getTournamentById } from "../controllers/tournamentController";
import { getPools } from "../controllers/poolController";
import { generateMatches, scheduleMatches } from "../utils/matchGenerator";
import { saveMatchesForTournament } from "../controllers/matchController";

export default function MatchScheduler({ tournamentId }) {
  const [tournament, setTournament] = useState(null);
  const [pools, setPools] = useState([]);
  const [matches, setMatches] = useState([]);
  const [startTime, setStartTime] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(false);

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    setTournament(t);

    const p = getPools(tournamentId);
    setPools(p);

    if (t?.matches) {
      setMatches(t.matches);
    }
  }, [tournamentId]);

  const handleGenerateMatches = () => {
    if (!pools || pools.length === 0) {
      alert("Aucune poule trouvée. Génère les poules avant les matchs.");
      return;
    }

    let allMatches = [];

    pools.forEach(pool => {
      const poolMatches = generateMatches(pool.teams, pool.id);
      allMatches = [...allMatches, ...poolMatches];
    });

    setMatches(allMatches);
    saveMatchesForTournament(tournamentId, allMatches);
  };

  const handleSchedule = () => {
    if (!startTime) {
      alert("Choisis une heure de début.");
      return;
    }

    const scheduled = scheduleMatches(
      matches,
      startTime,
      tournament.settings.gameDuration,
      tournament.settings.breakDuration
    );

    setMatches([...scheduled]);
    saveMatchesForTournament(tournamentId, scheduled);
  };

  return (
    <div className="match-scheduler">
      <h2>📅 Génération des matchs</h2>

      {!tournament && <p>Chargement du tournoi...</p>}

      {tournament && (
        <>
          <p>
            <strong>Tournoi :</strong> {tournament.name}
          </p>
          <p>
            <strong>Poules :</strong> {pools.length}
          </p>

          <button onClick={handleGenerateMatches} className="btn-primary">
            Générer les matchs
          </button>

          {matches.length > 0 && (
            <>
              <h3>🕒 Planification automatique</h3>

              <label>Heure de début :</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
              />

              <button
                onClick={handleSchedule}
                className="btn-secondary"
                disabled={!startTime}
              >
                Planifier automatiquement
              </button>

              <h3>📋 Liste des matchs ({matches.length})</h3>

              <ul className="match-list">
                {matches.map(match => (
                  <li key={match.id} className="match-item">
                    <strong>{match.teamA.name}</strong> vs{" "}
                    <strong>{match.teamB.name}</strong>
                    {match.startTime && (
                      <span>
                        {" "}
                        — {new Date(match.startTime).toLocaleTimeString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
