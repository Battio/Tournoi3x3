import React, { useState } from "react";

import TournamentList from "./views/TournamentView/TournamentList";
import TournamentPage from "./views/TournamentView/TournamentPage";
import TournamentForm from "./views/TournamentView/TournamentForm";

export default function App() {
  const [currentView, setCurrentView] = useState("list");
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const openTournament = (id) => {
    setSelectedTournamentId(id);
    setCurrentView("tournament");
  };

  const openCreateTournament = () => {
    setSelectedTournamentId(null);
    setCurrentView("create");
  };

  const goBackToList = () => {
    setSelectedTournamentId(null);
    setCurrentView("list");
  };

  return (
    <div className="app-container">
      <h1>Tournoi 3x3</h1>
      <p>Bienvenue sur l’application !</p>

      {currentView === "list" && (
        <TournamentList
          onSelectTournament={openTournament}
          onCreateTournament={openCreateTournament}
        />
      )}

      {currentView === "create" && (
        <TournamentForm onSaved={goBackToList} />
      )}

      {currentView === "tournament" && selectedTournamentId !== null && (
        <TournamentPage
          tournamentId={selectedTournamentId}
          onBack={goBackToList}
        />
      )}
    </div>
  );
}
