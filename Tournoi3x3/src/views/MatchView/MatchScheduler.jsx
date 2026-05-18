import React, { useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import { getPools } from "../../controllers/poolController";
import { generateMatches, scheduleMatches } from "../../utils/matchGenerator";
import { saveMatchesForTournament } from "../../controllers/matchController";

export default function MatchScheduler({ tournamentId }) {
  const [state, setState] = useState(() => {
    const t = getTournamentById(tournamentId);
    const p = getPools(tournamentId) || [];
    return {
      tournament: t || null,
      pools: p,
      matches: (t && Array.isArray(t.matches)) ? t.matches : [],
    };
  });
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    const p = getPools(tournamentId) || [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      tournament: t || null,
      pools: p,
      matches: (t && Array.isArray(t.matches)) ? t.matches : [],
    });
  }, [tournamentId]);

  const handleGenerateMatches = () => {
    if (!state.pools || state.pools.length === 0) {
      alert("Aucune poule trouvée. Génère les poules avant les matchs.");
      return;
    }

    let allMatches = [];

    state.pools.forEach((pool) => {
      if (!pool.teams || pool.teams.length === 0) {
        return;
      }

      const poolMatches = generateMatches(pool.teams, pool.id);
      allMatches = [...allMatches, ...poolMatches];
    });

    setState((prev) => ({ ...prev, matches: allMatches }));
    saveMatchesForTournament(tournamentId, allMatches);
  };

  const handleSchedule = () => {
    if (!startTime) {
      alert("Choisis une heure de début.");
      return;
    }

    if (!state.tournament || !state.tournament.settings) {
      alert("Paramètres du tournoi manquants (durée des matchs / pauses).");
      return;
    }

    const { gameDuration, breakDuration } = state.tournament.settings;

    const scheduled = scheduleMatches(
      state.matches,
      startTime,
      gameDuration,
      breakDuration
    );

    setState((prev) => ({ ...prev, matches: scheduled }));
    saveMatchesForTournament(tournamentId, scheduled);
  };

  return (
    <div className="match-scheduler">
      <h2>📅 Génération des matchs</h2>

      {!state.tournament && <p>Chargement du tournoi...</p>}

      {state.tournament && (
        <>
          <p>
            <strong>Tournoi :</strong> {state.tournament.name}
          </p>
          <p>
            <strong>Poules :</strong> {state.pools.length}
          </p>

          <button onClick={handleGenerateMatches} className="btn-primary">
            Générer les matchs
          </button>

          {state.matches.length > 0 && (
            <>
              <h3>🕒 Planification automatique</h3>

              <label>Heure de début :</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <button
                onClick={handleSchedule}
                className="btn-secondary"
                disabled={!startTime}
              >
                Planifier automatiquement
              </button>

              <h3>📋 Liste des matchs ({state.matches.length})</h3>

              <ul className="match-list">
                {state.matches.map((match) => (
                  <li key={match.id} className="match-item">
                    <strong>{match.teamA.name}</strong> vs{" "}
                    <strong>{match.teamB.name}</strong>
                    {match.startTime && (
                      <span>
                        {" "}
                        —{" "}
                        {new Date(match.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
