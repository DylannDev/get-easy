/**
 * Formate automatiquement une date au format JJ/MM/AAAA pendant la saisie
 * Ajoute automatiquement les "/" aux bonnes positions
 *
 * @param value - La valeur entrée par l'utilisateur
 * @returns La valeur formatée avec les "/"
 *
 * @example
 * formatDateInput("12") // "12/"
 * formatDateInput("123") // "12/3"
 * formatDateInput("1234") // "12/34/"
 * formatDateInput("12345") // "12/34/5"
 * formatDateInput("12345678") // "12/34/5678"
 */
export function formatDateInput(value: string): string {
  // Retire tous les caractères non numériques
  const numbersOnly = value.replace(/\D/g, "");

  // Limite à 8 chiffres (JJMMAAAA)
  const limitedNumbers = numbersOnly.slice(0, 8);

  // Applique le formatage
  let formatted = "";

  for (let i = 0; i < limitedNumbers.length; i++) {
    formatted += limitedNumbers[i];
    // Ajoute "/" après le jour (position 2) et après le mois (position 4)
    if (i === 1 || i === 3) {
      formatted += "/";
    }
  }

  return formatted;
}

/**
 * Gestionnaire d'événement pour détecter la suppression sur un "/"
 * À utiliser avec onKeyDown
 */
export function handleDateKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  onChange: (value: string) => void
) {
  const input = e.currentTarget;
  const cursorPosition = input.selectionStart || 0;
  const value = input.value;

  // Si on appuie sur Backspace et que le curseur est juste après un "/"
  if (e.key === "Backspace" && value[cursorPosition - 1] === "/") {
    e.preventDefault();

    // Retire le "/" et le chiffre avant
    const beforeSlash = value.slice(0, cursorPosition - 2);
    const afterSlash = value.slice(cursorPosition);
    const newValue = beforeSlash + afterSlash;

    const formatted = formatDateInput(newValue);
    onChange(formatted);

    // Place le curseur à la bonne position
    setTimeout(() => {
      const newPos = Math.max(0, cursorPosition - 2);
      input.setSelectionRange(newPos, newPos);
    }, 0);
  }
}

/**
 * Gestionnaire d'événement pour formater automatiquement une date pendant la saisie
 * Gère intelligemment la position du curseur
 *
 * @param e - L'événement de changement
 * @param onChange - La fonction onChange de react-hook-form
 */
export function handleDateInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  onChange: (value: string) => void
) {
  const input = e.target;
  const cursorPosition = input.selectionStart || 0;
  const newValue = e.target.value;

  // Compte les chiffres avant le formatage
  const numbersBeforeFormat = newValue.replace(/\D/g, "");

  // Formate la nouvelle valeur
  const formatted = formatDateInput(newValue);
  onChange(formatted);

  // Ajuste la position du curseur après formatage
  setTimeout(() => {
    let newCursorPosition = cursorPosition;

    // Si on vient d'ajouter le 2ème ou 4ème chiffre, le curseur doit sauter le "/"
    if (numbersBeforeFormat.length === 2 || numbersBeforeFormat.length === 4) {
      // Vérifie si un "/" a été ajouté à la position du curseur
      if (formatted[cursorPosition] === "/") {
        newCursorPosition = cursorPosition + 1; // Saute le "/"
      }
    }

    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }, 0);
}
