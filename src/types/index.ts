export interface Catequista {
  id: string;
  dataRegisto: string;
  primeiroNome: string;
  ultimoNome: string;
  telefone: string;
  anoLetivo: string;
  disponivel: 'Sim' | 'Não';
  anoUltimaCatequese: string | number;
  ehProfessor: 'Sim' | 'Não' | '';
  temFormacaoPedagogia: 'Sim' | 'Não' | '';
  expCriancasEspeciais: 'Sim' | 'Não' | '';
  expAlfabetizacaoAdultos: 'Sim' | 'Não' | '';
  expAlfabetizacaoCriancas: 'Sim' | 'Não' | '';
}

export interface InqueritoForm {
  primeiroNome: string;
  ultimoNome: string;
  telefone: string;
  disponivel: 'Sim' | 'Não' | '';
  anoUltimaCatequese: string;
  ehProfessor: 'Sim' | 'Não' | '';
  temFormacaoPedagogia: 'Sim' | 'Não' | '';
  expCriancasEspeciais: 'Sim' | 'Não' | '';
  expAlfabetizacaoAdultos: 'Sim' | 'Não' | '';
  expAlfabetizacaoCriancas: 'Sim' | 'Não' | '';
}

export interface Stats {
  total: number;
  disponiveis: number;
  naoDisponiveis: number;
  professores: number;
  professorePct: number;
  pedagogia: number;
  pedagogiaPct: number;
  criancasEspeciais: number;
  criancasEspeciaisPct: number;
  alfAdultos: number;
  alfAdultosPct: number;
  alfCriancas: number;
  alfCriancasPct: number;
  faixasInatividade: Record<string, number>;
}

export interface Config {
  anoLetivo: string;
  dataAbertura: string;
  dataFecho: string;
}
