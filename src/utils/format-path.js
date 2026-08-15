export function formatPath(value) {
  if (!value) return "Aucun dossier sélectionné";
  return value.length > 68 ? `…${value.slice(-65)}` : value;
}
