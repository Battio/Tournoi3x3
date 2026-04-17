import Match from "../models/Match";
import { generateTypedId } from "./idGenerator";

/**
 * Génère tous les matchs d'une poule en format round-robin
 * Exemple : 4 équipes → 6 matchs
 */
export function generateMatches(teams, poolId = null) {
  const matches = [];

  // Round-robin : chaque équipe rencontre toutes les autres
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const match = new Match({
        id: generateTypedId("match"),
        teamA: teams[i],
        teamB: teams[j],
        poolId: poolId,
        phase: "POULE",
        court: 1,
        startTime: null,
        scoreA: null,
        scoreB: null,
        overtime: false,
      });

      matches.push(match);
    }
  }

  return matches;
}

/**
 * Génère un planning simple (optionnel)
 * Exemple : match toutes les X minutes
 */
export function scheduleMatches(matches, startTime, gameDuration, breakDuration = 2) {
  let currentTime = new Date(startTime);

  return matches.map(match => {
    match.startTime = new Date(currentTime);

    // Ajout durée match + pause
    currentTime.setMinutes(
      currentTime.getMinutes() + gameDuration + breakDuration
    );

    return match;
  });
}
