// ============================================================
// Inquérito de Catequistas — Paróquia de São Paulo
// Google Apps Script (doGet only, payload via base64)
// ============================================================

const SHEET_CATEQUISTAS = 'Catequistas';
const SHEET_CONFIG = 'Configuracao';

const ADMIN_USER = 'root';
const ADMIN_PASS = 'rootroot';
const SESSION_TOKEN = 'sigc-admin-token-2026';

function doGet(e) {
  const action = e.parameter.action || '';
  const payload = e.parameter.payload
    ? JSON.parse(Utilities.newBlob(Utilities.base64Decode(e.parameter.payload)).getDataAsString())
    : {};
  const token = e.parameter.token || '';

  try {
    let result;
    switch (action) {
      case 'submit':        result = submitInquerito(payload); break;
      case 'checkDuplicate': result = checkDuplicate(payload.primeiroNome, payload.ultimoNome); break;
      case 'login':         result = login(payload.username, payload.password); break;
      case 'getAll':        requireAuth(token); result = getAll(); break;
      case 'getStats':      requireAuth(token); result = getStats(); break;
      case 'deleteRecord':  requireAuth(token); result = deleteRecord(payload.id); break;
      case 'updateRecord':  requireAuth(token); result = updateRecord(payload.id, payload.data); break;
      case 'getConfig':     result = getConfig(); break;
      case 'setConfig':     requireAuth(token); result = setConfig(payload); break;
      default:              result = { ok: false, error: 'Acção desconhecida' };
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function requireAuth(token) {
  if (token !== SESSION_TOKEN) throw new Error('Não autorizado');
}

// ---- Auth ----

function login(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return { ok: true, token: SESSION_TOKEN };
  }
  return { ok: false, error: 'Credenciais inválidas' };
}

// ---- Config ----

function getConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_CONFIG, ['chave', 'valor']);
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  const data = sheet.getDataRange().getValues();
  const config = { anoLetivo: '2026/2027', dataAbertura: '', dataFecho: '' };
  for (let i = 1; i < data.length; i++) {
    config[data[i][0]] = data[i][1];
  }
  return { ok: true, config };
}

function setConfig(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_CONFIG, ['chave', 'valor']);
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  sheet.clearContents();
  sheet.appendRow(['chave', 'valor']);
  Object.keys(payload).forEach(key => sheet.appendRow([key, payload[key]]));
  return { ok: true };
}

// ---- Catequistas ----

const CATEQUISTAS_HEADERS = [
  'id', 'dataRegisto', 'primeiroNome', 'ultimoNome', 'telefone',
  'anoLetivo', 'disponivel', 'anoUltimaCatequese',
  'ehProfessor', 'temFormacaoPedagogia', 'expCriancasEspeciais',
  'expAlfabetizacao', 'faixaEtariaConforto'
];

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function checkDuplicate(primeiroNome, ultimoNome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CATEQUISTAS);
  if (!sheet) return { ok: true, exists: false };
  const data = sheet.getDataRange().getValues();
  const n1 = (primeiroNome || '').trim().toLowerCase();
  const n2 = (ultimoNome || '').trim().toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if (
      (data[i][2] || '').toString().trim().toLowerCase() === n1 &&
      (data[i][3] || '').toString().trim().toLowerCase() === n2
    ) return { ok: true, exists: true };
  }
  return { ok: true, exists: false };
}

function submitInquerito(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet(ss, SHEET_CATEQUISTAS, CATEQUISTAS_HEADERS);
  const sheet = ss.getSheetByName(SHEET_CATEQUISTAS);

  const dup = checkDuplicate(payload.primeiroNome, payload.ultimoNome);
  if (dup.exists) return { ok: false, error: 'duplicado' };

  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  const d = !!payload.disponivel;

  sheet.appendRow([
    id, timestamp,
    payload.primeiroNome || '',
    payload.ultimoNome || '',
    payload.telefone || '',
    payload.anoLetivo || '',
    d ? 'Sim' : 'Não',
    d ? (payload.anoUltimaCatequese || '') : '',
    d ? (payload.ehProfessor || '') : '',
    d ? (payload.temFormacaoPedagogia || '') : '',
    d ? (payload.expCriancasEspeciais || '') : '',
    d ? (payload.expAlfabetizacao || '') : '',
    d ? (payload.faixaEtariaConforto || '') : '',
  ]);

  return { ok: true, id };
}

function getAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CATEQUISTAS);
  if (!sheet) return { ok: true, records: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, records: [] };
  const headers = data[0];
  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => { row[h] = data[i][j]; });
    records.push(row);
  }
  return { ok: true, records };
}

function getStats() {
  const all = getAll();
  if (!all.ok) return all;
  const records = all.records;
  const total = records.length;
  const disponiveis = records.filter(r => r.disponivel === 'Sim');
  const d = disponiveis.length;

  // Count distribution for single-select field
  function dist(field) {
    const out = {};
    disponiveis.forEach(r => {
      const v = (r[field] || '').toString().trim();
      if (v) out[v] = (out[v] || 0) + 1;
    });
    return out;
  }

  // Count distribution for multi-select field (comma-separated)
  function distMulti(field) {
    const out = {};
    disponiveis.forEach(r => {
      const v = (r[field] || '').toString().trim();
      if (!v) return;
      v.split(',').forEach(part => {
        const k = part.trim();
        if (k) out[k] = (out[k] || 0) + 1;
      });
    });
    return out;
  }

  const anoAtual = new Date().getFullYear();
  const faixas = { '0': 0, '1-2': 0, '3-5': 0, '6-10': 0, '10+': 0 };
  disponiveis.forEach(r => {
    const ano = parseInt(r.anoUltimaCatequese) || 0;
    if (!ano) return;
    const anos = anoAtual - ano;
    if (anos === 0) faixas['0']++;
    else if (anos <= 2) faixas['1-2']++;
    else if (anos <= 5) faixas['3-5']++;
    else if (anos <= 10) faixas['6-10']++;
    else faixas['10+']++;
  });

  return {
    ok: true,
    stats: {
      total,
      disponiveis: d,
      naoDisponiveis: total - d,
      ehProfessorDist: dist('ehProfessor'),
      pedagogiaDist: dist('temFormacaoPedagogia'),
      criancasEspeciaisDist: dist('expCriancasEspeciais'),
      alfabetizacaoDist: distMulti('expAlfabetizacao'),
      faixaEtariaDist: distMulti('faixaEtariaConforto'),
      faixasInatividade: faixas,
    }
  };
}

function deleteRecord(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CATEQUISTAS);
  if (!sheet) return { ok: false, error: 'Sheet não encontrada' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) { sheet.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false, error: 'Registo não encontrado' };
}

function updateRecord(id, updates) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CATEQUISTAS);
  if (!sheet) return { ok: false, error: 'Sheet não encontrada' };
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      Object.keys(updates).forEach(key => {
        const col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i + 1, col + 1).setValue(updates[key]);
      });
      return { ok: true };
    }
  }
  return { ok: false, error: 'Registo não encontrado' };
}
