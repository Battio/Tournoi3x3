import { createContext, useContext, useState, useEffect } from "react";
import localStorageService from "../storage/localStorageService";

// CONTEXTE GLOBAL
const AppContext = createContext();

// HOOK PERSONNALISÉ
export function useAppContext() {
  return useContext(AppContext);
}

// PROVIDER GLOBAL
export function AppProvider({ children }) {
  // État global de l'application
  const [tournaments, setTournaments] = useState([]);

  // Chargement initial depuis localStorage
  useEffect(() => {
    const saved = localStorageService.get("tournaments");
    if (saved) setTournaments(saved);
  }, []);

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    localStorageService.set("tournaments", tournaments);
  }, [tournaments]);

  // Méthodes globales (appellent les controllers)
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

  // Valeurs exposées au reste de l'application
  const value = {
    tournaments,
    addTournament,
    updateTournament,
    deleteTournament,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
