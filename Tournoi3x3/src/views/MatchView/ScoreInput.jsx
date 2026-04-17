import React, { useState } from "react";
import { updateMatchScore } from "../controllers/matchController";

export default function ScoreInput({ match, tournamentId, onScoreSaved }) {
  const [scoreA, setScoreA] = useState(match.scoreA ?? "");
  const [scoreB, setScoreB] = useState(match.scoreB ?? "");
  const [overtime, setOvertime] = useState(match.overtime ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (scoreA === "" || scoreB === "") {
      alert("Merci de saisir les deux scores.");
      return;
    }

    const sA = parseInt(scoreA, 10);
    const sB = parseInt(scoreB, 10);

    if (isNaN(sA) || isNaN(sB)) {
      alert("Les scores doivent être des nombres.");
      return;
    }

    setSaving(true);

    updateMatchScore(tournamentId, match.id, {
      scoreA: sA,
      scoreB: sB,
      overtime: overtime,
    });

    setSaving(false);

    if (onScoreSaved) onScoreSaved();
  };

  return (
    <div className="score-input">
      <h3>📝 Saisie du score</h3>

      <div className="teams">
        <div className="team">
          <span className="team-name">{match.teamA.name}</span>
          <input
            type="number"
            min="0"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            className="score-field"
          />
        </div>

        <div className="team">
          <span className="team-name">{match.teamB.name}</span>
          <input
            type="number"
            min="0"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            className="score-field"
          />
        </div>
      </div>

      <div className="overtime">
        <label>
          <input
            type="checkbox"
            checked={overtime}
            onChange={(e) => setOvertime(e.target.checked)}
          />
          Prolongation
        </label>
      </div>

      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Enregistrement..." : "Enregistrer le score"}
      </button>
    </div>
  );
}
