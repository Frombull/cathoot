// "1 voto", "2 votos", "0 votos"
export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

// Fração de 0 a 100 para as barras, sem dividir por zero
export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
