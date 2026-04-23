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
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "HW8: Statemate \u2014 Financial Reporting + Scale Test", font: "Arial" })] }),
    new Paragraph({ spacing: { after: 20 }, children: [new TextRun({ text: "April 16, 2026  |  Base Sepolia  |  30 agents on Hetzner VPS  |  agent-registry-seven.vercel.app", font: "Arial", size: S, color: "666666" })] }),
    new Paragraph({ spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1A5276", space: 1 } }, children: [] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "What Changed Since HW7", font: "Arial" })] }),
    p("HW7 tested 6 simulated wallet registrations from local + Vercel serverless. HW8 adds three major improvements:"),
    p("1. Financial Reporting: Each agent now has an auto-generated income statement (Revenue, COGS, Gross Profit, SGA, Operating Profit, Tax, Net Income) computed from labeled on-chain transactions.", { bold: true }),
    p("2. Wallet Dictionary: Bidirectional agent-to-wallet mapping stored in Neon Postgres, with BaseScan-powered transaction sync and auto-classification (revenue, cost_of_sales, sga_expense, registration_fee)."),
    p("3. Transaction Accessibility: Created in-app views for all agent transactions \u2014 each agent card shows a full transaction table with direction, label, amount, and counterparty name, all sourced from on-chain data via Blockscout."),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Scaled Setup", font: "Arial" })] }),
    tbl(["Component", "HW7", "HW8"], [
      ["Agents", "6 simulated wallets", { text: "30 OpenClaw agents on 2 Hetzner VPSes", bold: true }],
      ["Infrastructure", "Local machine + Vercel", { text: "2 VPSes (Nuremberg + Helsinki) + Vercel + Neon Postgres", bold: true }],
      ["Agent type", "Scripts generating keys", { text: "OpenClaw with SOUL.md + ERC-8004 skill + Gemini LLM", bold: true }],
      ["Financial reporting", "None", { text: "Auto income statements from on-chain transactions", bold: true }],
      ["Database", "None (chain reads only)", { text: "Neon Postgres (wallets + labeled transactions)", bold: true }],
      ["Transactions tracked", "0", { text: "184 transactions via Blockscout sync", bold: true }],
    ], [3000, 3100, 3260]),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Results", font: "Arial" })] }),
    tbl(["Experiment", "Result"], [
      [{ text: "Agent registration (30 agents)", bold: true }, { text: "30/30 registered in 62 seconds", bold: true, color: "1A5276" }],
      ["Transaction sync (Blockscout)", "184 transactions synced across 30 agents"],
      ["Financial report generation", "Income statements computed for all agents from on-chain data"],
      ["Cross-region transactions", "Successful payments between Nuremberg and Helsinki VPSes"],
      ["Agent self-identification (Gemini LLM)", "30/30 agents autonomously chose unique names"],
      ["Transaction classification accuracy", "Rule-based: incoming=revenue, outgoing=expense, contract calls=fees"],
    ], [5000, 4360]),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Failures and Bottlenecks", font: "Arial" })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "Funding agents is the hardest part: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Getting testnet ETH into 30 wallets hit rate limits after ~20 agents. This is purely a testnet problem \u2014 on mainnet, a gasless paymaster removes this entirely.", font: "Arial", size: S })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "Registration doesn\u2019t parallelize well: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Each agent registers one at a time (~2s each). At 30 agents, that\u2019s a full minute of waiting. Batch registration would be a valuable contract upgrade.", font: "Arial", size: S })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "Blockchain APIs deprecate fast: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "The transaction history API we originally used (BaseScan V1) was deprecated mid-project. We had to switch to Blockscout \u2014 a reminder that Web3 infrastructure is still maturing.", font: "Arial", size: S })] }),
    new Paragraph({ numbering: { reference: "f", level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: "Auto-classifying transactions is imperfect: ", font: "Arial", size: S, bold: true }), new TextRun({ text: "Simple rules (money in = revenue, money out = expense) work for most cases, but can\u2019t distinguish between an agent paying for a service vs. transferring funds. Human override is still needed.", font: "Arial", size: S })] }),

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
