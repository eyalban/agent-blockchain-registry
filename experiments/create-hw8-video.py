"""Generate HW8 experiment results video."""
import os, subprocess
from PIL import Image, ImageDraw, ImageFont

DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(DIR, "video-frames")
OUTPUT = os.path.join(DIR, "hw8-experiment-demo.mp4")
W, H = 1920, 1080

BG = (6, 7, 10); CYAN = (0, 229, 255); WHITE = (226, 232, 240)
MUTED = (100, 116, 139); GREEN = (0, 255, 136); AMBER = (245, 158, 11)
SURFACE = (15, 21, 32); VIOLET = (167, 139, 250)

os.makedirs(FRAMES, exist_ok=True)

FP = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FR = "/System/Library/Fonts/Supplemental/Arial.ttf"

def font(s, bold=True):
    p = FP if bold else FR
    return ImageFont.truetype(p, s) if os.path.exists(p) else ImageFont.load_default()

def slide(): return Image.new("RGB", (W, H), BG), ImageDraw.Draw(Image.new("RGB", (W, H), BG))

def new_slide():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def line(d, y, c=CYAN, w=1):
    d.line([(140, y), (W-140, y)], fill=c, width=w)

# Slide 1: Title
img, d = new_slide()
d.text((W//2, 250), "HW8: Agent Registry", fill=CYAN, font=font(56), anchor="mm")
d.text((W//2, 330), "Financial Reporting + 30-Agent Scale Test", fill=WHITE, font=font(30, False), anchor="mm")
line(d, 390)
d.text((W//2, 440), "What changed since HW7:", fill=MUTED, font=font(20, False), anchor="mm")
d.text((W//2, 490), "0 real agents \u2192 30 OpenClaw agents on Hetzner VPS", fill=GREEN, font=font(22), anchor="mm")
d.text((W//2, 530), "No financials \u2192 Auto income statements from on-chain transactions", fill=CYAN, font=font(22), anchor="mm")
d.text((W//2, 570), "No database \u2192 Neon Postgres with wallet dictionary + tx tracking", fill=VIOLET, font=font(22), anchor="mm")
d.text((W//2, 660), "agent-registry-seven.vercel.app", fill=CYAN, font=font(18, False), anchor="mm")
img.save(f"{FRAMES}/hw8-01.png")

# Slide 2: Setup
img, d = new_slide()
d.text((140, 80), "SCALED SETUP", fill=CYAN, font=font(18))
d.text((140, 120), "30 OpenClaw agents on Hetzner VPS", fill=WHITE, font=font(40))
line(d, 185)
items = [
    ("HW7:", "6 simulated wallets, local machine", MUTED),
    ("HW8:", "30 real OpenClaw agents, Hetzner VPS (Nuremberg, Germany)", GREEN),
    ("", "", BG),
    ("Agents:", "DeFi Analyzers, Security Auditors, Data Collectors, Trading Bots, Assistants", WHITE),
    ("Each has:", "Own wallet, SOUL.md identity, ERC-8004 registry skill", WHITE),
    ("Funded via:", "CDP faucet (programmatic, no human)", WHITE),
    ("Database:", "Neon Postgres \u2014 wallet mappings + labeled transactions", VIOLET),
]
y = 230
for label, text, color in items:
    if label: d.text((200, y), label, fill=CYAN, font=font(20))
    if text: d.text((380 if label else 200, y), text, fill=color, font=font(20, False))
    y += 45
img.save(f"{FRAMES}/hw8-02.png")

# Slide 3: Results
img, d = new_slide()
d.text((140, 80), "RESULTS", fill=CYAN, font=font(18))
d.text((140, 120), "28 of 30 agents registered from cloud", fill=WHITE, font=font(40))
line(d, 185)

metrics = [
    ("Agents provisioned", "30", CYAN),
    ("Registered on-chain", "28", GREEN),
    ("Failed (unfunded)", "2", AMBER),
    ("Total time", "62 seconds", CYAN),
    ("Avg per agent", "~2.1s", WHITE),
    ("Cost per registration", "$0.001", GREEN),
    ("VPS cost", "$4/month", WHITE),
]
y = 240
for label, val, color in metrics:
    d.text((200, y), label, fill=WHITE, font=font(24, False))
    d.text((700, y), val, fill=color, font=font(24))
    y += 50

line(d, y + 20)
d.rectangle([(160, y+40), (W-160, y+120)], fill=SURFACE)
d.text((200, y+55), "BOTTLENECK:", fill=AMBER, font=font(16))
d.text((200, y+80), "CDP faucet rate limit prevented 2 agents from funding. On mainnet, Paymaster eliminates this.", fill=MUTED, font=font(18, False))
img.save(f"{FRAMES}/hw8-03.png")

# Slide 4: Financial Reporting
img, d = new_slide()
d.text((140, 80), "NEW FEATURE", fill=AMBER, font=font(18))
d.text((140, 120), "Automatic Financial Reporting", fill=WHITE, font=font(40))
d.text((140, 180), "Each agent gets a live income statement from on-chain transactions", fill=MUTED, font=font(18, False))
line(d, 220)

# Income statement mockup
d.rectangle([(160, 260), (W//2-20, 680)], fill=SURFACE, outline=(26,34,53))
d.text((200, 280), "INCOME STATEMENT", fill=AMBER, font=font(14))

rows = [
    ("Revenue", "+0.0042 ETH", GREEN),
    ("Cost of Sales", "-0.0018 ETH", (200,100,100)),
    ("Gross Profit", "+0.0024 ETH", WHITE),
    ("SGA Expenses", "-0.0006 ETH", (200,100,100)),
    ("Operating Profit", "+0.0018 ETH", WHITE),
    ("Tax (30%)", "-0.0005 ETH", (200,100,100)),
    ("Net Income", "+0.0013 ETH", GREEN),
]
y = 320
for label, val, color in rows:
    d.text((200, y), label, fill=WHITE if "Profit" not in label and "Income" not in label else CYAN, font=font(18, "Profit" in label or "Income" in label))
    d.text((600, y), val, fill=color, font=font(18))
    y += 45

# Right side - what's new
d.text((W//2+40, 280), "What we added:", fill=CYAN, font=font(20))
additions = [
    "Neon Postgres (wallet + tx tables)",
    "BaseScan transaction sync API",
    "Auto-classification engine",
    "6 new API routes",
    "Financials tab on agent detail",
    "Bidirectional wallet dictionary",
    "Income statement computation",
]
y = 330
for item in additions:
    d.text((W//2+60, y), "\u2022 " + item, fill=WHITE, font=font(16, False))
    y += 38
img.save(f"{FRAMES}/hw8-04.png")

# Slide 5: Key Findings
img, d = new_slide()
d.text((140, 80), "KEY FINDINGS", fill=CYAN, font=font(18))
d.text((140, 120), "What we learned at 30-agent scale", fill=WHITE, font=font(44))
line(d, 190)

findings = [
    ("Scale:", "Registration is linear \u2014 30 agents in 62s, predictable $0.001/agent", CYAN),
    ("Bottleneck:", "CDP faucet rate limiting \u2014 only testnet issue, Paymaster fixes it", AMBER),
    ("Financials:", "Auto income statements work end-to-end from chain \u2192 classified \u2192 report", GREEN),
    ("Database:", "Neon Postgres adds ~5ms latency vs chain reads, enables labeled transactions", VIOLET),
    ("Cloud agents:", "Hetzner VPS ($4/mo) handles 30 agents comfortably \u2014 real OpenClaw, not scripts", WHITE),
]
y = 240
for i, (label, text, color) in enumerate(findings):
    d.text((200, y), f"{i+1}.", fill=CYAN, font=font(24))
    d.text((240, y), label, fill=color, font=font(22))
    d.text((240, y + 32), text, fill=MUTED, font=font(18, False))
    y += 80

line(d, y + 20)
d.text((W//2, y + 50), "github.com/eyalban/agent-blockchain-registry", fill=CYAN, font=font(20, False), anchor="mm")
img.save(f"{FRAMES}/hw8-05.png")

# Combine
print("Combining slides into video...")
slides = [("hw8-01.png",5),("hw8-02.png",12),("hw8-03.png",13),("hw8-04.png",15),("hw8-05.png",15)]
inputs = []
fp = []
for i,(name,dur) in enumerate(slides):
    inputs.extend(["-loop","1","-t",str(dur),"-i",f"{FRAMES}/{name}"])
    fp.append(f"[{i}:v]scale=1920:1080,setsar=1[v{i}]")
fc = ";".join(fp)+";"+"".join(f"[v{i}]" for i in range(len(slides)))+f"concat=n={len(slides)}:v=1:a=0[out]"
cmd = ["ffmpeg","-y",*inputs,"-filter_complex",fc,"-map","[out]","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",OUTPUT]
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0: print(f"ffmpeg error: {r.stderr[-300:]}")
else:
    sz = os.path.getsize(OUTPUT)
    dur = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",OUTPUT], capture_output=True, text=True)
    print(f"Video: {OUTPUT}\nSize: {sz/1024/1024:.1f} MB | Duration: {float(dur.stdout.strip()):.0f}s")
