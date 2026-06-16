import React, { useEffect, useState } from "react";
import {
  getTournaments as getAllTournaments,
  deleteTournament,
} from "../../controllers/tournamentController";

export default function TournamentList({ onSelectTournament, onCreateTournament, onReset }) {
  const [tournaments, setTournaments] = useState([]);
  const [error, setError] = useState("");

  const refresh = () => {
    try {
      const list = getAllTournaments();
      setTournaments(Array.isArray(list) ? list : []);
      setError("");
    } catch (err) {
      console.error("Erreur lors du chargement des tournois :", err);
      setError("Impossible de charger les tournois.");
      setTournaments([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer ce tournoi ?")) return;

    try {
      deleteTournament(id);
      refresh();
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      setError("Impossible de supprimer ce tournoi.");
    }
  };

  return (
    <div className="tournament-list">
      <h2>Liste des tournois</h2>

      <button className="btn-primary" onClick={onCreateTournament}>
        Créer un tournoi
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {tournaments.length === 0 && !error && (
        <p>Aucun tournoi pour le moment.</p>
      )}

      {onReset && (
        <div className="reset-section">
          <button className="btn-danger" onClick={onReset}>
            🗑️ Réinitialiser le tournoi
          </button>
        </div>
      )}

      <div className="tournaments-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="tournament-card">
            <h3>{tournament.name}</h3>

            <p>
              {tournament.date
                ? new Date(tournament.date).toLocaleDateString()
                : "Date non renseignée"}
              <br />
              {tournament.location || "Lieu non renseigné"}
              <br />
              {tournament.category || "Catégorie non renseignée"}
            </p>

            <div className="actions">
              <button
                className="btn-secondary"
                onClick={() => onSelectTournament(tournament.id)}
              >
                Ouvrir
              </button>

              <button
                className="btn-danger"
                onClick={() => handleDelete(tournament.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
