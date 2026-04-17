import React, { useEffect, useState } from "react";
import { getTournamentById } from "../controllers/tournamentController";
import {
  addTeamToTournament,
  removeTeamFromTournament,
  updateTeam,
} from "../controllers/teamController";
import { generateTypedId } from "../utils/idGenerator";
import Player from "../models/Player";

export default function TeamManager({ tournamentId, onTeamsUpdated }) {
  const [tournament, setTournament] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);

  const [playerFirstName, setPlayerFirstName] = useState("");
  const [playerLastName, setPlayerLastName] = useState("");

  useEffect(() => {
    const t = getTournamentById(tournamentId);
    setTournament(t);
  }, [tournamentId]);

  const handleAddTeam = () => {
    if (!teamName.trim()) {
      alert("Le nom de l'équipe est obligatoire.");
      return;
    }

    const newTeam = {
      id: generateTypedId("team"),
      name: teamName.trim(),
      players: [],
    };

    addTeamToTournament(tournamentId, newTeam);
    setTeamName("");

    if (onTeamsUpdated) onTeamsUpdated();
  };

  const handleDeleteTeam = (teamId) => {
    if (!window.confirm("Supprimer cette équipe ?")) return;

    removeTeamFromTournament(tournamentId, teamId);

    if (onTeamsUpdated) onTeamsUpdated();
  };

  const handleAddPlayer = (team) => {
    if (!playerFirstName.trim() || !playerLastName.trim()) {
      alert("Prénom et nom du joueur obligatoires.");
      return;
    }

    const newPlayer = new Player({
      id: generateTypedId("player"),
      firstName: playerFirstName.trim(),
      lastName: playerLastName.trim(),
    });

    const updatedTeam = {
      ...team,
      players: [...team.players, newPlayer],
    };

    updateTeam(tournamentId, updatedTeam);

    setPlayerFirstName("");
    setPlayerLastName("");

    if (onTeamsUpdated) onTeamsUpdated();
  };

  const handleRemovePlayer = (team, playerId) => {
    const updatedTeam = {
      ...team,
      players: team.players.filter((p) => p.id !== playerId),
    };

    updateTeam(tournamentId, updatedTeam);

    if (onTeamsUpdated) onTeamsUpdated();
  };

  return (
    <div className="team-manager">
      <h2>👥 Gestion des équipes</h2>

      {!tournament && <p>Chargement...</p>}

      {tournament && (
        <>
          <div className="add-team">
            <h3>➕ Ajouter une équipe</h3>
            <input
              type="text"
              placeholder="Nom de l'équipe"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <button className="btn-primary" onClick={handleAddTeam}>
              Ajouter
            </button>
          </div>

          <h3>📋 Liste des équipes ({tournament.teams.length})</h3>

          <div className="teams-list">
            {tournament.teams.map((team) => (
              <div key={team.id} className="team-card">
                <div className="team-header">
                  <h4>{team.name}</h4>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    Supprimer
                  </button>
                </div>

                <h5>Joueurs</h5>
                <ul className="players-list">
                  {team.players.map((player) => (
                    <li key={player.id} className="player-item">
                      {player.firstName} {player.lastName}
                      <button
                        className="btn-small-danger"
                        onClick={() => handleRemovePlayer(team, player.id)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="add-player">
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={playerFirstName}
                    onChange={(e) => setPlayerFirstName(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={playerLastName}
                    onChange={(e) => setPlayerLastName(e.target.value)}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => handleAddPlayer(team)}
                  >
                    Ajouter joueur
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
