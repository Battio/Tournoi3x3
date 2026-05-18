import React, { useEffect, useState } from "react";
import {
  createTournament,
  updateTournament,
  getTournamentById,
} from "../../controllers/tournamentController";
import { TOURNAMENT_TYPES, TOURNAMENT_TYPE_CONFIG } from "../../models/TournamentType";

export default function TournamentForm({ tournamentId = null, onSaved }) {
  const isEditing = Boolean(tournamentId);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [tournamentType, setTournamentType] = useState(TOURNAMENT_TYPES.OFFICIAL);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      const t = getTournamentById(tournamentId);
      if (t) {
        setName(t.name); // eslint-disable-line react-hooks/set-state-in-effect
        setDate(t.date); // eslint-disable-line react-hooks/set-state-in-effect
        setLocation(t.location); // eslint-disable-line react-hooks/set-state-in-effect
        setCategory(t.category); // eslint-disable-line react-hooks/set-state-in-effect
        setTournamentType(t.tournamentType || TOURNAMENT_TYPES.OFFICIAL); // eslint-disable-line react-hooks/set-state-in-effect
      }
    }
  }, [tournamentId, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !date || !location.trim() || !category.trim()) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    const data = {
      id: isEditing ? tournamentId : undefined,
      name: name.trim(),
      date,
      location: location.trim(),
      category: category.trim(),
      tournamentType,
    };

    if (isEditing) {
      updateTournament({ ...getTournamentById(tournamentId), ...data });
    } else {
      const result = createTournament(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
    }

    if (onSaved) onSaved();
  };

  const currentTypeConfig = TOURNAMENT_TYPE_CONFIG[tournamentType];

  return (
    <div className="tournament-form">
      <h2>{isEditing ? "✏️ Modifier le tournoi" : "➕ Créer un tournoi"}</h2>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <label>Type de tournoi</label>
        <select
          value={tournamentType}
          onChange={(e) => setTournamentType(e.target.value)}
          disabled={isEditing}
        >
          {Object.entries(TOURNAMENT_TYPE_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.name} - {config.description}
            </option>
          ))}
        </select>
        {currentTypeConfig && (
          <small className="help-text">
            Minimum {currentTypeConfig.minTeams} équipes, Maximum {currentTypeConfig.maxTeams} équipes.
            {currentTypeConfig.requireGenderValidation && " Validation du genre activée."}
          </small>
        )}

        <label>Nom du tournoi</label>
        <input
          type="text"
          placeholder="Ex : Tournoi 3x3 Benet"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>Lieu</label>
        <input
          type="text"
          placeholder="Ex : Salle omnisports"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <label>Catégorie</label>
        <input
          type="text"
          placeholder="Ex : Senior, U18, Mixte..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <button className="btn-primary" type="submit">
          {isEditing ? "Enregistrer les modifications" : "Créer le tournoi"}
        </button>
      </form>
    </div>
  );
}
