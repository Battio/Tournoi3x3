/**
 * Génère des poules équilibrées à partir d'une liste d'équipes
 * Exemple : 10 équipes, 3 poules → 4 / 3 / 3
 */
export function generatePools(teams, numberOfPools) {
  if (!teams || teams.length === 0) return [];
  if (numberOfPools <= 0) return [];

  // Clone pour éviter de modifier la liste originale
  const shuffledTeams = [...teams];

  // Mélange simple (Fisher-Yates)
  for (let i = shuffledTeams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
  }

  // Création des poules vides
  const pools = Array.from({ length: numberOfPools }, () => []);

  // Répartition en mode "snake" pour équilibrer
  let direction = 1; // 1 = normal, -1 = inverse
  let index = 0;

  for (const team of shuffledTeams) {
    pools[index].push(team);

    index += direction;

    // Quand on atteint une extrémité, on inverse le sens
    if (index === numberOfPools) {
      index = numberOfPools - 1;
      direction = -1;
    } else if (index === -1) {
      index = 0;
      direction = 1;
    }
  }

  return pools;
}
