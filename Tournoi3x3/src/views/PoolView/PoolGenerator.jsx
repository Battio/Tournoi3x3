import React, { useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import { savePoolsForTournament } from "../../controllers/poolController";
import { generatePools } from "../../utils/poolGenerator";
import Pool from "../../models/Pool";
import { generateTypedId } from "../../utils/idGenerator";

export default function PoolGenerator({ tournamentId, onPoolsGenerated }) {
  const [tournament, setTournament] = useState(() => getTournamentById(tournamentId));
  const [numberOfPools, setNumberOfPools] = useState(2);
  const [generatedPools, setGeneratedPools] = useState([]);

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTournament(t);
  }, [tournamentId]);

  const handleGenerate = () => {
    if (!tournament || tournament.teams.length === 0) {
      alert("Aucune équipe trouvée. Ajoute des équipes avant de générer les poules.");
      return;
    }

    const rawPools = generatePools(tournament.teams, numberOfPools);

    const pools = rawPools.map((teams, index) => {
      return new Pool({
        id: generateTypedId("pool"),
        name: `Poule ${String.fromCharCode(65 + index)}`,
        teams: teams,
        matches: [],
      });
    });

    setGeneratedPools(pools);
    savePoolsForTournament(tournamentId, pools);

    if (onPoolsGenerated) onPoolsGenerated();
  };

  return (
    <div className="pool-generator">
      <h2>🎲 Génération des poules</h2>

      {!tournament && <p>Chargement du tournoi...</p>}

      {tournament && (
        <>
          <p>
            <strong>Tournoi :</strong> {tournament.name}
          </p>
          <p>
            <strong>Équipes :</strong> {tournament.teams.length}
          </p>

          <label>Nombre de poules :</label>
          <input
            type="number"
            min="1"
            max={tournament.teams.length}
            value={numberOfPools}
            onChange={(e) => setNumberOfPools(parseInt(e.target.value, 10))}
          />

          <button className="btn-primary" onClick={handleGenerate}>
            Générer les poules
          </button>

          {generatedPools.length > 0 && (
            <>
              <h3>📋 Poules générées</h3>

              <div className="pools-list">
                {generatedPools.map((pool) => (
                  <div key={pool.id} className="pool-card">
                    <h4>{pool.name}</h4>
                    <ul>
                      {pool.teams.map((team) => (
                        <li key={team.id}>{team.name}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
