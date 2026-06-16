# Guia de Instalação e Deploy
## Inquérito de Catequistas — Paróquia de São Paulo

---

## 1. Google Sheets — Criar a folha de cálculo

1. Aceda a [sheets.google.com](https://sheets.google.com) e crie uma nova folha intitulada **SIGC — Catequistas**.
2. O Apps Script cria as abas automaticamente na primeira utilização. Não é necessário criá-las manualmente.

---

## 2. Google Apps Script — Publicar o backend

1. Na folha criada, aceda a **Extensões → Apps Script**.
2. Apague o conteúdo existente e cole o conteúdo do ficheiro `google-apps-script.js` deste projecto.
3. Clique em **Guardar** (ícone de disquete).
4. Clique em **Implementar → Nova implementação**.
5. Configure:
   - **Tipo**: Aplicação web
   - **Executar como**: Eu (a minha conta Google)
   - **Quem tem acesso**: Qualquer pessoa
6. Clique em **Implementar** e autorize as permissões solicitadas.
7. Copie o **URL da aplicação web** (algo como `https://script.google.com/macros/s/XXXX/exec`).

> **Nota:** Sempre que alterar o código do Apps Script, tem de criar uma **nova implementação** (não basta guardar).

---

## 3. Configurar variáveis de ambiente

1. Copie o ficheiro `.env.example` para `.env`:
   ```
   cp .env.example .env
   ```
2. Edite `.env` e preencha:
   ```
   VITE_GAS_URL=https://script.google.com/macros/s/SEU_ID/exec
   VITE_API_TOKEN=paroquia-spaulo-2026-secret
   ```

---

## 4. Instalar dependências e testar localmente

```bash
npm install
npm run dev
```

Aceda a `http://localhost:5173` no browser.

---

## 5. Deploy no Netlify

### Opção A — Via Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Opção B — Via interface web
1. Aceda a [netlify.com](https://netlify.com) e crie conta gratuita.
2. Clique em **Add new site → Import an existing project**.
3. Ligue ao repositório GitHub (recomendado) ou faça **drag & drop** da pasta `dist/` após `npm run build`.
4. Configure as variáveis de ambiente em **Site settings → Environment variables**:
   - `VITE_GAS_URL` — URL do Apps Script
   - `VITE_API_TOKEN` — token secreto

---

## 6. Credenciais iniciais

| Utilizador | Palavra-passe |
|------------|---------------|
| `root`     | `rootroot`    |

**Altere a palavra-passe** editando a constante `ADMIN_PASS` no ficheiro `google-apps-script.js` e republicando o Apps Script.

---

## 7. Configuração inicial (pós-deploy)

1. Aceda a `/login` e entre com `root` / `rootroot`.
2. Vá a **Configuração** e defina:
   - O **ano letivo** (ex: `2026/2027`)
   - Opcionalmente, as **datas de abertura e fecho** do inquérito.
3. Partilhe o URL do site com os catequistas.

---

## 8. Estrutura de ficheiros

```
sigc-inquerito-disponibilidade-catequistas/
├── src/
│   ├── components/          # Header, AdminNav, PrivateRoute, gráficos SVG
│   ├── hooks/               # useAuth
│   ├── pages/               # Inquérito, Agradecimento, Login
│   │   └── admin/           # Dashboard, Relatórios, Registos, Configuração
│   ├── types/               # Interfaces TypeScript
│   └── utils/               # apiClient, exportPDF, exportExcel
├── google-apps-script.js    # Backend (copiar para Apps Script)
├── .env.example             # Template de variáveis de ambiente
├── netlify.toml             # Configuração Netlify (SPA redirect)
├── package.json
├── vite.config.ts
└── GUIA.md                  # Este ficheiro
```

---

## 9. Fluxo de dados

```
Catequista → Formulário → BASE64(JSON) → doGet?action=submit&payload=X → Google Sheets
Admin      → Login      → doGet?action=login → token em sessionStorage
Admin      → Dashboard  → doGet?action=getStats&token=X → JSON → React
```

---

## 10. Segurança

- As credenciais são validadas **no Apps Script** (servidor), não no cliente.
- O token de sessão é guardado em `sessionStorage` (apagado ao fechar o separador).
- A deduplicação por nome + sobrenome é verificada no servidor antes de inserir.
- Para maior segurança em produção, altere `SESSION_TOKEN` e `ADMIN_PASS` no Apps Script.
