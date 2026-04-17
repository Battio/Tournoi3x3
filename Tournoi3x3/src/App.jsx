import React, { useState } from "react";

import TournamentList from "./views/TournamentView/TournamentList";
import TournamentPage from "./views/TournamentView/TournamentPage";
import TournamentForm from "./views/TournamentView/TournamentForm";

export default function App() {
  const [currentView, setCurrentView] = useState("list"); // list | create | tournament
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const openTournament = (id) => {
    setSelectedTournamentId(id);
    setCurrentView("tournament");
  };

  const openCreateTournament = () => {
    setCurrentView("create");
  };

  const goBackToList = () => {
    setSelectedTournamentId(null);
    setCurrentView("list");
  };

  return (
    <div className="app-container">
      {currentView === "list" && (
        <TournamentList
          onSelectTournament={openTournament}
          onCreateTournament={openCreateTournament}
        />
      )}

      {currentView === "create" && (
        <TournamentForm
          onSaved={goBackToList}
        />
      )}

      {currentView === "tournament" && selectedTournamentId && (
        <TournamentPage
          tournamentId={selectedTournamentId}
          onBack={goBackToList}
        />
      )}
    </div>
  );
}
