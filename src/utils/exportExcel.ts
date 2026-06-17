import * as XLSX from 'xlsx';
import type { Catequista } from '../types';
import { calcAnosInatividade } from './exportPDF';

function catequistaToRow(r: Catequista, showExtra: boolean) {
  const base = {
    'Nome': r.primeiroNome,
    'Sobrenome': r.ultimoNome,
    'Telefone': r.telefone,
    'Ano Letivo': r.anoLetivo,
    'Disponível': r.disponivel,
    'Data de Registo': r.dataRegisto ? new Date(r.dataRegisto).toLocaleDateString('pt-PT') : '',
  };
  if (showExtra) {
    return {
      ...base,
      'Últ. Catequese': r.anoUltimaCatequese || '',
      'Anos Inat.': calcAnosInatividade(r.anoUltimaCatequese),
      'Professor': r.ehProfessor || '',
      'Pedagogia': r.temFormacaoPedagogia || '',
      'Cr. Especiais': r.expCriancasEspeciais || '',
      'Alfabetização': r.expAlfabetizacao || '',
      'Faixa Etária': r.faixaEtariaConforto || '',
    };
  }
  return base;
}

export function exportRelatorioExcel(title: string, records: Catequista[], showExtra = true) {
  const wb = XLSX.utils.book_new();
  const rows = records.map(r => catequistaToRow(r, showExtra));
  const ws = XLSX.utils.json_to_sheet(rows);

  const colCount = Object.keys(rows[0] || {}).length;
  ws['!cols'] = Array(colCount).fill(null).map(() => ({ wch: 20 }));
  ws['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: records.length, c: colCount - 1 } }),
  };
  ws['!pageSetup'] = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  ws['!headerFooter'] = {
    oddHeader: `&C&"Helvetica,Bold"Vigararia de Fátima — Paróquia de São Paulo — Comissão de Catequese\n&"Helvetica,Regular"${title}`,
    oddFooter: '&L&D &T&R&P de &N',
  };

  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `${title.replace(/[^a-zA-Z0-9À-ÿ]+/g, '_')}.xlsx`);
}
