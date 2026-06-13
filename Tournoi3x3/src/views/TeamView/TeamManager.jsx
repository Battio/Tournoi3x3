import React, { useEffect, useState } from "react";
import { getTournamentById } from "../../controllers/tournamentController";
import {
  addTeamToTournament,
  removeTeamFromTournament,
  updateTeam,
} from "../../controllers/teamController";
import { generateTypedId } from "../../utils/idGenerator";
import Player from "../../models/Player";
import { TOURNAMENT_TYPE_CONFIG } from "../../models/TournamentType";

const EMPTY_FORM = {
  teamName: "",
  captainFirstName: "",
  captainLastName: "",
  numberOfPlayers: 4,
};

export default function TeamManager({ tournamentId, onTeamsUpdated }) {
  const [tournament, setTournament] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [addPlayerFor, setAddPlayerFor] = useState(null);
  const [playerForm, setPlayerForm] = useState({ firstName: "", lastName: "" });

  const refresh = () => {
    const t = getTournamentById(tournamentId);
    setTournament(t);
  };

  useEffect(() => {
    refresh();
  }, [tournamentId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTeam = (e) => {
    e.preventDefault();
    setError("");

    if (!form.teamName.trim()) {
      setError("Le nom de l'équipe est obligatoire.");
      return;
    }
    if (!form.captainFirstName.trim() || !form.captainLastName.trim()) {
      setError("Le prénom et le nom du capitaine sont obligatoires.");
      return;
    }

    const captain = new Player({
      id: generateTypedId("player"),
      firstName: form.captainFirstName.trim(),
      lastName: form.captainLastName.trim(),
    });

    const newTeam = {
      id: generateTypedId("team"),
      name: form.teamName.trim(),
      players: [captain],
      captainId: captain.id,
      numberOfPlayers: parseInt(form.numberOfPlayers, 10),
    };

    const result = addTeamToTournament(tournamentId, newTeam);
    if (result && !result.success) {
      setError(result.error);
      return;
    }

    setForm(EMPTY_FORM);
    refresh();
    if (onTeamsUpdated) onTeamsUpdated();
  };

  const handleDeleteTeam = (teamId) => {
    if (!window.confirm("Supprimer cette équipe ?")) return;
    removeTeamFromTournament(tournamentId, teamId);
    refresh();
    if (onTeamsUpdated) onTeamsUpdated();
  };

  const handleAddPlayer = (team) => {
    setError("");
    if (!playerForm.firstName.trim() || !playerForm.lastName.trim()) {
      setError("Prénom et nom du joueur obligatoires.");
      return;
    }
    const newPlayer = new Player({
      id: generateTypedId("player"),
      firstName: playerForm.firstName.trim(),
      lastName: playerForm.lastName.trim(),
    });
    const updatedTeam = { ...team, players: [...team.players, newPlayer] };
    const result = updateTeam(tournamentId, updatedTeam);
    if (result && !result.success) {
      setError(result.error);
      return;
    }
    setPlayerForm({ firstName: "", lastName: "" });
    setAddPlayerFor(null);
    refresh();
    if (onTeamsUpdated) onTeamsUpdated();
  };

  const handleRemovePlayer = (team, playerId) => {
    const updatedTeam = { ...team, players: team.players.filter((p) => p.id !== playerId) };
    updateTeam(tournamentId, updatedTeam);
    refresh();
    if (onTeamsUpdated) onTeamsUpdated();
  };

  const typeConfig = tournament ? TOURNAMENT_TYPE_CONFIG[tournament.tournamentType] : null;

  return (
    <div className="team-manager">

      {/* Formulaire d'inscription */}
      <div className="team-registration-card">
        <h3>Inscription d'une équipe</h3>

        {error && <div className="alert alert-error">{error}</div>}

        {typeConfig && (
          <div className="tournament-info">
            <strong>{typeConfig.name}</strong> — {typeConfig.minPlayersPerTeam} à {typeConfig.maxPlayersPerTeam || 6} joueurs par équipe
            {typeConfig.requireGenderValidation && " · validation du genre activée"}
          </div>
        )}

        <form className="registration-form" onSubmit={handleAddTeam}>
          <div className="form-group">
            <label htmlFor="teamName">Nom de l'équipe</label>
            <input
              id="teamName"
              name="teamName"
              type="text"
              placeholder="Ex : Les Faucons"
              value={form.teamName}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="captainFirstName">Prénom du capitaine</label>
              <input
                id="captainFirstName"
                name="captainFirstName"
                type="text"
                placeholder="Prénom"
                value={form.captainFirstName}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="captainLastName">Nom du capitaine</label>
              <input
                id="captainLastName"
                name="captainLastName"
                type="text"
                placeholder="Nom"
                value={form.captainLastName}
                onChange={handleFormChange}
              />
            </div>
          </div>

          <div className="form-group form-group--small">
            <label htmlFor="numberOfPlayers">
              Nombre de joueurs
              {typeConfig && (
                <span className="form-hint">
                  {" "}({typeConfig.minPlayersPerTeam} min · {typeConfig.maxPlayersPerTeam || 6} max)
                </span>
              )}
            </label>
            <input
              id="numberOfPlayers"
              name="numberOfPlayers"
              type="number"
              min={typeConfig?.minPlayersPerTeam || 3}
              max={typeConfig?.maxPlayersPerTeam || 6}
              value={form.numberOfPlayers}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Inscrire l'équipe
            </button>
          </div>
        </form>
      </div>

      {/* Liste des équipes */}
      {tournament && (
        <div className="teams-section">
          <h3>Équipes inscrites ({tournament.teams.length})</h3>

          {tournament.teams.length === 0 && (
            <p className="empty-state">Aucune équipe inscrite pour le moment.</p>
          )}

          <div className="teams-list">
            {tournament.teams.map((team) => {
              const expected = team.numberOfPlayers || 3;
              const registered = team.players.length;
              const isFull = registered >= expected;

              return (
                <div key={team.id} className="team-card">
                  <div className="team-card-header">
                    <div>
                      <h4>{team.name}</h4>
                      <span className={`players-count-badge ${isFull ? "full" : "partial"}`}>
                        {registered} / {expected} joueurs
                      </span>
                    </div>
                    <button className="btn-danger" onClick={() => handleDeleteTeam(team.id)}>
                      Supprimer
                    </button>
                  </div>

                  <ul className="players-list">
                    {team.players.map((player) => {
                      const isCaptain = player.id === team.captainId;
                      return (
                        <li key={player.id} className="player-item">
                          {isCaptain && <span className="captain-badge">C</span>}
                          <span className="player-name">
                            {player.firstName} {player.lastName}
                          </span>
                          <span className="player-gender-icon">
                            {player.gender === "F" ? "♀" : player.gender === "M" ? "♂" : "⚪"}
                          </span>
                          {!isCaptain && (
                            <button
                              className="btn-small-danger"
                              onClick={() => handleRemovePlayer(team, player.id)}
                              title="Retirer ce joueur"
                            >
                              ✕
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* Formulaire ajout joueur inline */}
                  {addPlayerFor === team.id ? (
                    <div className="add-player-form">
                      <div className="form-row">
                        <input
                          type="text"
                          placeholder="Prénom"
                          value={playerForm.firstName}
                          onChange={(e) => setPlayerForm((p) => ({ ...p, firstName: e.target.value }))}
                        />
                        <input
                          type="text"
                          placeholder="Nom"
                          value={playerForm.lastName}
                          onChange={(e) => setPlayerForm((p) => ({ ...p, lastName: e.target.value }))}
                        />
                      </div>
                      <div className="add-player-actions">
                        <button className="btn-primary" onClick={() => handleAddPlayer(team)}>
                          Ajouter
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => { setAddPlayerFor(null); setPlayerForm({ firstName: "", lastName: "" }); }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    !isFull && (
                      <button
                        className="btn-add-player"
                        onClick={() => { setAddPlayerFor(team.id); setError(""); }}
                      >
                        + Ajouter un joueur
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
