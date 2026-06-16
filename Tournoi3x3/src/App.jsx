import React, { useState, useEffect } from "react";
import localStorageService from "./storage/localStorageService";

import TournamentList from "./views/TournamentView/TournamentList";
import TournamentPage from "./views/TournamentView/TournamentPage";
import TournamentForm from "./views/TournamentView/TournamentForm";
import ErrorBoundary from "./components/ErrorBoundary";

const NAV_KEY = "bbc-tournoi-3x3-nav-v1";

function loadNavState() {
  try {
    const saved = localStorageService.get(NAV_KEY);
    if (!saved) return { view: "list", tournamentId: null };
    if (saved.view === "tournament" && saved.tournamentId) {
      const tournaments = localStorageService.get("tournaments") || [];
      if (!tournaments.some((t) => t.id === saved.tournamentId)) {
        return { view: "list", tournamentId: null };
      }
    }
    return saved;
  } catch {
    return { view: "list", tournamentId: null };
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState(() => loadNavState().view);
  const [selectedTournamentId, setSelectedTournamentId] = useState(
    () => loadNavState().tournamentId
  );

  useEffect(() => {
    localStorageService.set(NAV_KEY, { view: currentView, tournamentId: selectedTournamentId });
  }, [currentView, selectedTournamentId]);

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

  const handleReset = () => {
    if (
      !window.confirm(
        "Réinitialiser complètement l’application ?\n\nCela supprimera TOUS les tournois et leurs données. Cette action est irréversible."
      )
    )
      return;
    localStorageService.clear();
    setSelectedTournamentId(null);
    setCurrentView("list");
  };

  return (
    <div className="app-container">
      <h1>Tournoi 3x3</h1>
      <p>Bienvenue sur l’application !</p>

      <ErrorBoundary key={currentView + String(selectedTournamentId)}>
        {currentView === "list" && (
          <TournamentList
            onSelectTournament={openTournament}
            onCreateTournament={openCreateTournament}
            onReset={handleReset}
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
      </ErrorBoundary>
    </div>
  );
}
