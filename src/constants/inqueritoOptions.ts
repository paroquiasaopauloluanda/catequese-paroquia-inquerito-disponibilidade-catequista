export const PROFESSOR_OPTIONS = [
  'Sim',
  'Não',
  'Em Formação / Estudante',
  'Tenho Experiência a ensinar, mas não sou professor',
] as const;

export const PEDAGOGIA_OPTIONS = [
  'Sim',
  'Não',
  'Em Curso',
  'Não Tenho Formação, Mas Tenho Experiência com Grupos',
] as const;

export const CRIANCAS_ESPECIAIS_OPTIONS = [
  'Nenhuma',
  'Pouca',
  'Moderada',
  'Muita',
] as const;

// Multi-select — "Sem Experiência" é exclusivo com os restantes
export const ALFABETIZACAO_OPTIONS = [
  'Crianças',
  'Adultos',
  'Ambos',
  'Sem Experiência',
] as const;

export const ALFABETIZACAO_EXCLUSIVE = 'Sem Experiência';

// Multi-select — sem exclusividade
export const FAIXA_ETARIA_OPTIONS = [
  'Crianças',
  'Pré-Adolescentes',
  'Adolescentes',
  'Jovens',
  'Adultos',
] as const;

// Labels curtos para gráficos (<=10 chars)
export const PROFESSOR_CHART_LABELS: Record<string, string> = {
  'Sim': 'Sim',
  'Não': 'Não',
  'Em Formação / Estudante': 'Em Formação',
  'Tenho Experiência a ensinar, mas não sou professor': 'Exp. Ensinar',
};

export const PEDAGOGIA_CHART_LABELS: Record<string, string> = {
  'Sim': 'Sim',
  'Não': 'Não',
  'Em Curso': 'Em Curso',
  'Não Tenho Formação, Mas Tenho Experiência com Grupos': 'Exp. Grupos',
};
