export default class Player {
  constructor({
    id,
    firstName,
    lastName,
    number = null,       // numéro de maillot (optionnel)
    age = null,          // optionnel
    position = null,     // optionnel (utile si tu veux : guard, forward…)
    gender = "M",        // genre : "M", "F", "Other" (défaut: "M")
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;

    // Informations optionnelles
    this.number = number;
    this.age = age;
    this.position = position;
    this.gender = gender;
  }

  /**
   * Retourne le nom complet du joueur
   */
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}
