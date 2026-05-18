import React, { useEffect, useState } from "react";
import {
  createTournament,
  updateTournament,
  getTournamentById,
} from "../../controllers/tournamentController";

export default function TournamentForm({ tournamentId = null, onSaved }) {
  const isEditing = Boolean(tournamentId);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (isEditing) {
      const t = getTournamentById(tournamentId);
      if (t) {
        setName(t.name); // eslint-disable-line react-hooks/set-state-in-effect
        setDate(t.date); // eslint-disable-line react-hooks/set-state-in-effect
        setLocation(t.location); // eslint-disable-line react-hooks/set-state-in-effect
        setCategory(t.category); // eslint-disable-line react-hooks/set-state-in-effect
      }
    }
  }, [tournamentId, isEditing]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !date || !location.trim() || !category.trim()) {
      alert("Merci de remplir tous les champs.");
      return;
    }

    const data = {
      name: name.trim(),
      date,
      location: location.trim(),
      category: category.trim(),
    };

    if (isEditing) {
      updateTournament(tournamentId, data);
    } else {
      createTournament(data);
    }

    if (onSaved) onSaved();
  };

  return (
    <div className="tournament-form">
      <h2>{isEditing ? "✏️ Modifier le tournoi" : "➕ Créer un tournoi"}</h2>

      <form onSubmit={handleSubmit} className="form">
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
