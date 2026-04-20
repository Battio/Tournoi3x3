import React, { useEffect, useState } from "react";
import {
  getAllTournaments,
  deleteTournament,
} from "../../controllers/tournamentController";

export default function TournamentList({ onSelectTournament, onCreateTournament }) {
  const [tournaments, setTournaments] = useState([]);

  const refresh = () => {
    const list = getAllTournaments();
    setTournaments(list);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (id) => {
    if (!window.confirm("Supprimer ce tournoi ?")) return;

    deleteTournament(id);
    refresh();
  };

  return (
    <div className="tournament-list">
      <h2>🏆 Liste des tournois</h2>

      <button className="btn-primary" onClick={onCreateTournament}>
        ➕ Créer un tournoi
      </button>

      {tournaments.length === 0 && (
        <p>Aucun tournoi pour le moment.</p>
      )}

      <div className="tournaments-grid">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="tournament-card">
            <h3>{tournament.name}</h3>

            <p>
              📅 {new Date(tournament.date).toLocaleDateString()}  
              <br />
              📍 {tournament.location}
              <br />
              🎯 {tournament.category}
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
