export interface Catequista {
  id: string;
  dataRegisto: string;
  primeiroNome: string;
  ultimoNome: string;
  telefone: string;
  anoLetivo: string;
  disponivel: 'Sim' | 'Não';
  anoUltimaCatequese: string | number;
  // Single-select categorical
  ehProfessor: string;
  temFormacaoPedagogia: string;
  expCriancasEspeciais: string;
  // Multi-select stored as comma-separated string
  expAlfabetizacao: string;
  faixaEtariaConforto: string;
}

export interface InqueritoForm {
  primeiroNome: string;
  ultimoNome: string;
  telefone: string;
  disponivel: 'Sim' | 'Não' | '';
  anoUltimaCatequese: string;
  ehProfessor: string;
  temFormacaoPedagogia: string;
  expCriancasEspeciais: string;
  expAlfabetizacao: string[];   // multi-select array in form
  faixaEtariaConforto: string[]; // multi-select array in form
}

export interface Stats {
  total: number;
  disponiveis: number;
  naoDisponiveis: number;
  ehProfessorDist: Record<string, number>;
  pedagogiaDist: Record<string, number>;
  criancasEspeciaisDist: Record<string, number>;
  alfabetizacaoDist: Record<string, number>;
  faixaEtariaDist: Record<string, number>;
  faixasInatividade: Record<string, number>;
}

export interface Config {
  anoLetivo: string;
  dataAbertura: string;
  dataFecho: string;
}
