import React, { useEffect, useState } from "react";
import { getTournamentById, validateTournament } from "../../controllers/tournamentController";
import { TOURNAMENT_TYPE_CONFIG } from "../../models/TournamentType";

import TournamentForm from "./TournamentForm";
import TeamManager from "../TeamView/TeamManager";
import PoolGenerator from "../../utils/poolGenerator";
import MatchScheduler from "../MatchView/MatchScheduler";
import Standings from "../StandingsView/Standings";
import PublicTournament from "../PublicView/PublicTournament";

export default function TournamentPage({ tournamentId, onBack }) {
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState("teams");

  const refresh = () => {
    const t = getTournamentById(tournamentId);
    setTournament(t); // eslint-disable-line react-hooks/set-state-in-effect
  };

  useEffect(() => {
    refresh(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [tournamentId]);

  if (!tournament) {
    return <p>Chargement du tournoi...</p>;
  }

  return (
    <div className="tournament-page">
      <header className="page-header">
        <button className="btn-secondary" onClick={onBack}>
          ← Retour
        </button>

        <h1>{tournament.name}</h1>

        <p>
          📅 {new Date(tournament.date).toLocaleDateString()} — 📍{" "}
          {tournament.location}
        </p>

        <div className="tournament-header-info">
          <span className="badge" style={{ backgroundColor: TOURNAMENT_TYPE_CONFIG[tournament.tournamentType]?.color || "#ccc" }}>
            {TOURNAMENT_TYPE_CONFIG[tournament.tournamentType]?.name}
          </span>
          <span className="info-text">
            {tournament.teams?.length || 0} équipes
            {tournament.pools?.length > 0 && ` • ${tournament.pools.length} poules`}
            {tournament.matches?.length > 0 && ` • ${tournament.matches.length} matchs`}
          </span>
        </div>
      </header>

      {/* Onglets */}
      <nav className="tabs">
        <button
          className={activeTab === "edit" ? "active" : ""}
          onClick={() => setActiveTab("edit")}
        >
          ✏️ Infos tournoi
        </button>

        <button
          className={activeTab === "teams" ? "active" : ""}
          onClick={() => setActiveTab("teams")}
        >
          👥 Équipes
        </button>

        <button
          className={activeTab === "pools" ? "active" : ""}
          onClick={() => setActiveTab("pools")}
        >
          🏀 Poules
        </button>

        <button
          className={activeTab === "matches" ? "active" : ""}
          onClick={() => setActiveTab("matches")}
        >
          📅 Matchs
        </button>

        <button
          className={activeTab === "standings" ? "active" : ""}
          onClick={() => setActiveTab("standings")}
        >
          📊 Classements
        </button>

        <button
          className={activeTab === "public" ? "active" : ""}
          onClick={() => setActiveTab("public")}
        >
          🌐 Vue publique
        </button>
      </nav>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === "edit" && (
          <TournamentForm tournamentId={tournamentId} onSaved={refresh} />
        )}

        {activeTab === "teams" && (
          <TeamManager tournamentId={tournamentId} onTeamsUpdated={refresh} />
        )}

        {activeTab === "pools" && (
          <PoolGenerator tournamentId={tournamentId} onPoolsGenerated={refresh} />
        )}

        {activeTab === "matches" && (
          <MatchScheduler tournamentId={tournamentId} />
        )}

        {activeTab === "standings" && (
          <Standings tournamentId={tournamentId} />
        )}

        {activeTab === "public" && (
          <PublicTournament tournamentId={tournamentId} />
        )}
      </div>
    </div>
  );
}
