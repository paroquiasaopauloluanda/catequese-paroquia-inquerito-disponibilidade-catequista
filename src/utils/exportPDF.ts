import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Catequista, Stats } from '../types';

const HEADER_COLOR: [number, number, number] = [30, 58, 95];
const ACCENT_COLOR: [number, number, number] = [212, 175, 55];
const ROW_ODD: [number, number, number] = [245, 248, 252];
const ROW_EVEN: [number, number, number] = [255, 255, 255];

function addInstitutionalHeader(doc: jsPDF, title: string, total?: number) {
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...HEADER_COLOR);
  doc.rect(0, 0, pageW, 38, 'F');

  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 38, pageW, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Vigararia de Fátima', pageW / 2, 10, { align: 'center' });

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Paróquia de São Paulo', pageW / 2, 19, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Comissão de Catequese', pageW / 2, 27, { align: 'center' });

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageW / 2, 52, { align: 'center' });

  const today = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em ${today}`, 14, 60);

  if (total !== undefined) {
    doc.text(`Total: ${total} registos`, pageW - 14, 60, { align: 'right' });
  }

  return 66;
}

export function calcAnosInatividade(anoUltimaCatequese: string | number): string {
  const ano = parseInt(String(anoUltimaCatequese));
  if (isNaN(ano) || ano <= 0) return '—';
  return String(new Date().getFullYear() - ano);
}

function catequistaColumns(showExtra?: boolean) {
  const base = [
    { header: 'Nome', dataKey: 'nome' },
    { header: 'Sobrenome', dataKey: 'ultimoNome' },
    { header: 'Telefone', dataKey: 'telefone' },
    { header: 'Ano Letivo', dataKey: 'anoLetivo' },
    { header: 'Disponível', dataKey: 'disponivel' },
  ];
  if (showExtra !== false) {
    base.push(
      { header: 'Últ. Catequese', dataKey: 'anoUltimaCatequese' },
      { header: 'Anos Inat.', dataKey: 'anosInatividade' },
      { header: 'Professor', dataKey: 'ehProfessor' },
      { header: 'Pedagogia', dataKey: 'temFormacaoPedagogia' },
      { header: 'Cri. Especiais', dataKey: 'expCriancasEspeciais' },
      { header: 'Alf. Adultos', dataKey: 'expAlfabetizacaoAdultos' },
      { header: 'Alf. Crianças', dataKey: 'expAlfabetizacaoCriancas' },
    );
  }
  return base;
}

function toRows(records: Catequista[]) {
  return records.map(r => ({
    nome: r.primeiroNome,
    ultimoNome: r.ultimoNome,
    telefone: r.telefone,
    anoLetivo: r.anoLetivo,
    disponivel: r.disponivel,
    anoUltimaCatequese: r.anoUltimaCatequese || '—',
    anosInatividade: calcAnosInatividade(r.anoUltimaCatequese),
    ehProfessor: r.ehProfessor || '—',
    temFormacaoPedagogia: r.temFormacaoPedagogia || '—',
    expCriancasEspeciais: r.expCriancasEspeciais || '—',
    expAlfabetizacaoAdultos: r.expAlfabetizacaoAdultos || '—',
    expAlfabetizacaoCriancas: r.expAlfabetizacaoCriancas || '—',
  }));
}

function buildDoc(title: string, records: Catequista[], showExtra = true) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const startY = addInstitutionalHeader(doc, title, records.length);
  autoTable(doc, {
    startY,
    columns: catequistaColumns(showExtra),
    body: toRows(records),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ROW_ODD },
    bodyStyles: { fillColor: ROW_EVEN },
    margin: { left: 10, right: 10 },
  });
  return doc;
}

export function exportRelatorioPDF(title: string, records: Catequista[], showExtra = true) {
  const doc = buildDoc(title, records, showExtra);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
}

export function exportStatsPDF(stats: Stats, anoLetivo: string) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const startY = addInstitutionalHeader(doc, `Estatísticas — ${anoLetivo}`);
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Resumo Geral', 14, startY + 6);

  const summaryData = [
    ['Total de inscritos', String(stats.total)],
    ['Disponíveis', `${stats.disponiveis} (${Math.round((stats.disponiveis / stats.total) * 100) || 0}%)`],
    ['Não disponíveis', `${stats.naoDisponiveis} (${Math.round((stats.naoDisponiveis / stats.total) * 100) || 0}%)`],
  ];

  autoTable(doc, {
    startY: startY + 10,
    body: summaryData,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255 },
    alternateRowStyles: { fillColor: ROW_ODD },
    columnStyles: { 1: { fontStyle: 'bold', halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const afterSummary = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Indicadores de Experiência (sobre disponíveis)', 14, afterSummary);

  const expData = [
    ['Professores', String(stats.professores), `${stats.professorePct}%`],
    ['Formação em pedagogia', String(stats.pedagogia), `${stats.pedagogiaPct}%`],
    ['Exp. crianças especiais', String(stats.criancasEspeciais), `${stats.criancasEspeciaisPct}%`],
    ['Exp. alfabetização adultos', String(stats.alfAdultos), `${stats.alfAdultosPct}%`],
    ['Exp. alfabetização crianças', String(stats.alfCriancas), `${stats.alfCriancasPct}%`],
  ];

  autoTable(doc, {
    startY: afterSummary + 4,
    head: [['Indicador', 'Nº', '%']],
    body: expData,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255 },
    alternateRowStyles: { fillColor: ROW_ODD },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center', fontStyle: 'bold' } },
    margin: { left: 14, right: pageW / 2 + 5 },
  });

  const afterExp = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 95);
  doc.text('Distribuição por Anos de Inatividade', 14, afterExp);

  const faixas = stats.faixasInatividade;
  const faixaData = Object.entries(faixas).map(([k, v]) => [k === '0' ? 'Ativo (0 anos)' : `${k} anos`, String(v)]);

  autoTable(doc, {
    startY: afterExp + 4,
    head: [['Faixa', 'Nº']],
    body: faixaData,
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: HEADER_COLOR, textColor: 255 },
    alternateRowStyles: { fillColor: ROW_ODD },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    margin: { left: 14, right: pageW / 2 + 5 },
  });

  doc.save(`Estatisticas_${anoLetivo.replace('/', '-')}.pdf`);
}
