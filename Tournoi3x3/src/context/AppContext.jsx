import { createContext, useContext, useState, useEffect } from "react";
import localStorageService from "../storage/localStorageService";

const AppContext = createContext();

function AppProvider({ children }) {
  const [tournaments, setTournaments] = useState(() => {
    const saved = localStorageService.get("tournaments");
    return saved || [];
  });

  useEffect(() => {
    localStorageService.set("tournaments", tournaments);
  }, [tournaments]);

  const addTournament = (tournament) => {
    setTournaments((prev) => [...prev, tournament]);
  };

  const updateTournament = (updatedTournament) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === updatedTournament.id ? updatedTournament : t))
    );
  };

  const deleteTournament = (id) => {
    setTournaments((prev) => prev.filter((t) => t.id !== id));
  };

  const value = {
    tournaments,
    addTournament,
    updateTournament,
    deleteTournament,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useAppContext() {
  return useContext(AppContext);
}

// eslint-disable-next-line react-refresh/only-export-components
export { AppProvider, useAppContext };
