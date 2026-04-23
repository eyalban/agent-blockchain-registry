const pptxgen = require('pptxgenjs')

const pptx = new pptxgen()
pptx.layout = 'LAYOUT_WIDE'

const BG = '06070A'
const CYAN = '00E5FF'
const WHITE = 'E2E8F0'
const MUTED = '64748B'
const SURFACE = '0F1520'
const VIOLET = 'A78BFA'

const slide = pptx.addSlide()
slide.background = { color: BG }

// Accent bar top
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.04, fill: { color: CYAN } })

// Title
slide.addText('Agent Blockchain Registry', {
  x: 0.8, y: 0.5, w: 7, h: 0.7,
  fontSize: 36, fontFace: 'Arial', bold: true, color: CYAN,
})

// Subtitle
slide.addText('Trustless Financial Infrastructure for AI Agents', {
  x: 0.8, y: 1.15, w: 7, h: 0.4,
  fontSize: 18, fontFace: 'Arial', color: MUTED, italic: true,
})

// Left column - Key points
const bullets = [
  'On-chain registry for AI agents using ERC-8004 standard on Base L2',
  '30 OpenClaw agents deployed on Hetzner VPS, registered autonomously',
  'Automatic financial reporting: income statements from on-chain transactions',
  'Bidirectional wallet-agent dictionary with transaction classification',
  'Gasless registration via CDP Paymaster (agents need zero ETH)',
]

bullets.forEach((text, i) => {
  // Bullet dot
  slide.addShape(pptx.shapes.OVAL, {
    x: 0.9, y: 1.95 + i * 0.72, w: 0.12, h: 0.12,
    fill: { color: CYAN },
  })
  // Text
  slide.addText(text, {
    x: 1.2, y: 1.8 + i * 0.72, w: 6.5, h: 0.6,
    fontSize: 14, fontFace: 'Arial', color: WHITE,
    valign: 'middle',
  })
})

// Right column - Stats cards
const stats = [
  { value: '28', label: 'Agents Registered', color: CYAN },
  { value: '62s', label: 'Total Deploy Time', color: VIOLET },
  { value: '$0.001', label: 'Cost per Registration', color: '00FF88' },
  { value: 'ERC-8004', label: 'Standard', color: 'F59E0B' },
]

stats.forEach((stat, i) => {
  const y = 1.8 + i * 1.0
  // Card background
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 8.8, y, w: 3.8, h: 0.85,
    fill: { color: SURFACE },
    line: { color: '1A2235', width: 1 },
    rectRadius: 0.1,
  })
  // Value
  slide.addText(stat.value, {
    x: 9.0, y: y + 0.05, w: 3.4, h: 0.45,
    fontSize: 24, fontFace: 'Arial', bold: true, color: stat.color,
  })
  // Label
  slide.addText(stat.label.toUpperCase(), {
    x: 9.0, y: y + 0.45, w: 3.4, h: 0.3,
    fontSize: 9, fontFace: 'Arial', color: MUTED,
    charSpacing: 2,
  })
})

// Bottom bar
slide.addShape(pptx.shapes.RECTANGLE, {
  x: 0, y: 6.9, w: 13.33, h: 0.6,
  fill: { color: SURFACE },
})

slide.addText('Live: agent-registry-seven.vercel.app  |  GitHub: eyalban/agent-registry-framework  |  Base Sepolia  |  Hetzner VPS (Nuremberg)', {
  x: 0.8, y: 6.95, w: 11.7, h: 0.45,
  fontSize: 10, fontFace: 'Arial', color: MUTED,
  valign: 'middle',
})

// Accent bar bottom
slide.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 7.46, w: 13.33, h: 0.04, fill: { color: CYAN } })

pptx.writeFile({ fileName: '/Users/eyalban/Documents/MIT Sloan/Media Lab/Agent Blockchain Registry/experiments/project-slide.pptx' })
  .then(() => console.log('PPTX created'))
  .catch(e => console.error(e))
