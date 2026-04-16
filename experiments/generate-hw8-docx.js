const fs = require('fs')
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, BorderStyle, WidthType, ShadingType, LevelFormat, AlignmentType } = require('docx')

const b = { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" }
const borders = { top: b, bottom: b, left: b, right: b }
const cm = { top: 40, bottom: 40, left: 80, right: 80 }
const S = 17

function hCell(t, w) { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: { fill: "F0F4F8", type: ShadingType.CLEAR }, margins: cm, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, font: "Arial", size: S })] })] }) }
function tCell(t, w, o = {}) { return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, margins: cm, children: [new Paragraph({ children: [new TextRun({ text: t, font: "Arial", size: S, bold: o.bold, color: o.color })] })] }) }
function tbl(h, r, c) { return new Table({ width: { size: c.reduce((a,b)=>a+b,0), type: WidthType.DXA }, columnWidths: c, rows: [new TableRow({ children: h.map((x,i) => hCell(x, c[i])) }), ...r.map(row => new TableRow({ children: row.map((x,i) => tCell(typeof x==='string'?x:x.text, c[i], typeof x==='object'?x:{})) }))] }) }
function p(t, o = {}) { return new Paragraph({ spacing: { after: o.after ?? 50 }, children: [new TextRun({ text: t, font: "Arial", size: o.size || S, bold: o.bold, color: o.color })] }) }

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: S } } }, paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Arial" }, paragraph: { spacing: { before: 0, after: 60 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 20, bold: true, font: "Arial", color: "1A5276" }, paragraph: { spacing: { before: 120, after: 40 }, outlineLevel: 1 } },
  ] },
  numbering: { config: [{ reference: "f", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 360 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, right: 900, bottom: 720, left: 900 } } }, children: [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "HW8: Agent Registry \u2014 Financial Reporting + Scale Test", font: "Arial" })] }),
    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: "April 16, 2026  |  Base Sepolia  |  30 agents on Hetzner VPS  |  agent-registry-seven.vercel.app", font: "Arial", size: S, color: "666666" })] }),
    new Paragraph({ spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1A5276", space: 1 } }, children: [] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "What Changed Since HW7", font: "Arial" })] }),
    p("HW7 tested 6 simulated wallet registrations from local + Vercel serverless. HW8 adds three major improvements:"),
    p("1. Financial Reporting: Each agent now has an auto-generated income statement (Revenue, COGS, Gross Profit, SGA, Operating Profit, Tax, Net Income) computed from labeled on-chain transactions.", { bold: true }),
    p("2. Wallet Dictionary: Bidirectional agent-to-wallet mapping stored in Neon Postgres, with BaseScan-powered transaction sync and auto-classification (revenue, cost_of_sales, sga_expense, registration_fee)."),
    p("3. Real Agents at Scale: 30 OpenClaw agents deployed on a Hetzner VPS in Nuremberg, Germany \u2014 each with its own wallet, SOUL.md identity, and ERC-8004 registry skill. Not simulated."),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Scaled Setup", font: "Arial" })] }),
    tbl(["Component", "HW7", "HW8"], [
      ["Agents", "6 simulated wallets", { text: "30 OpenClaw agents on Hetzner VPS", bold: true }],
      ["Infrastructure", "Local machine + Vercel", { text: "Hetzner VPS (Nuremberg) + Vercel + Neon Postgres", bold: true }],
      ["Agent type", "Scripts generating keys", { text: "OpenClaw with SOUL.md + ERC-8004 skill", bold: true }],
      ["Financial reporting", "None", { text: "Auto income statements from classified txs", bold: true }],
      ["Database", "None (chain reads only)", { text: "Neon Postgres (wallets + transactions)", bold: true }],
      ["Transactions tracked", "0", { text: "All agent txs via BaseScan API sync", bold: true }],
    ], [3000, 3100, 3260]),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Results", font: "Arial" })] }),
    tbl(["Metric", "Value"], [
      ["Agents provisioned", "30"],
      [{ text: "Agents registered on-chain", bold: true }, { text: "28 / 30", bold: true, color: "1A5276" }],
      ["Failed (unfunded)", "2 (CDP faucet rate limit)"],
      [{ text: "Total registration time", bold: true }, { text: "62 seconds", bold: true, color: "1A5276" }],
      ["Avg time per registration", "~2.1 seconds"],
      ["Gas per registration", "~177,000 gas"],
      ["Cost per registration", "~$0.001"],
      ["VPS location", "Nuremberg, Germany"],
      ["VPS cost", "~$4/month (Hetzner cax11)"],
    ], [5000, 4360]),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Failures and Bottlenecks", font: "Arial" })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "CDP Faucet Rate Limiting: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Only 28/30 funded \u2014 faucet allows ~20 claims before throttling. On mainnet, Paymaster eliminates this entirely.", font: "Arial", size: S })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "Sequential Registration: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Each registration takes ~2s (RPC round-trip). At 30 agents this is 62s. Parallelizing with nonce management could reduce to ~10s.", font: "Arial", size: S })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "BaseScan API Throttling: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Free tier allows 5 req/sec. Syncing 30 agents sequentially takes ~6-10s. Acceptable for now; subgraph would be instant.", font: "Arial", size: S })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "Income Statement Accuracy: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Auto-classification is rule-based (incoming=revenue, outgoing=expense). Misclassifications require manual override via PATCH API.", font: "Arial", size: S })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "What We Added", font: "Arial" })] }),
    p("\u2022 Neon Postgres database with agent_wallets and transactions tables"),
    p("\u2022 6 new API routes: /wallets, /transactions, /sync, /financials, /wallets/:address"),
    p("\u2022 BaseScan transaction sync with auto-classification engine"),
    p("\u2022 Income statement computation (Revenue \u2192 COGS \u2192 Gross Profit \u2192 SGA \u2192 Op Profit \u2192 Tax \u2192 Net Income)"),
    p("\u2022 Financials tab on agent detail page with income statement card + breakdown"),
    p("\u2022 30 OpenClaw agent configs with SOUL.md identities and ERC-8004 registry skill"),
    p("\u2022 Hetzner VPS deployment with automated registration script"),
  ]}],
})

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/Users/eyalban/Documents/MIT Sloan/Media Lab/Agent Blockchain Registry/experiments/HW8-EXPERIMENT-SUMMARY.docx", buf)
  console.log("HW8 DOCX created")
})
