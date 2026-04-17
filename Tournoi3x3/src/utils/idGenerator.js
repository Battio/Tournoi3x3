/**
 * Génère un identifiant unique court
 * Exemple : "k3f9x2"
 */
export function generateShortId(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Génère un identifiant unique long basé sur crypto.randomUUID()
 * Exemple : "b8c1e3c4-9f2d-4a3b-8c1e-7d2f3a9b1c4d"
 */
export function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Génère un identifiant typé
 * Exemple : generateTypedId("team") → "team_4f9a2c"
 */
export function generateTypedId(prefix) {
  return `${prefix}_${generateShortId(8)}`;
}
