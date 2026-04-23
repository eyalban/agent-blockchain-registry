"""
Generate experiment results video as slideshow MP4.
Creates image slides with Python/Pillow, combines with ffmpeg.
"""
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES = os.path.join(DIR, "video-frames")
OUTPUT = os.path.join(DIR, "experiment-demo.mp4")
W, H = 1920, 1080

# Colors
BG = (6, 7, 10)
CYAN = (0, 229, 255)
WHITE = (226, 232, 240)
MUTED = (100, 116, 139)
GREEN = (0, 255, 136)
AMBER = (245, 158, 11)
DARK_SURFACE = (15, 21, 32)

os.makedirs(FRAMES, exist_ok=True)

# Try system fonts
FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
FONT_PATH = None
FONT_REG_PATH = None
for p in FONT_PATHS:
    if os.path.exists(p):
        FONT_PATH = p
        break
for p in ["/System/Library/Fonts/Supplemental/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]:
    if os.path.exists(p):
        FONT_REG_PATH = p
        break

def font(size, bold=True):
    path = FONT_PATH if bold else FONT_REG_PATH
    if path:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def new_slide():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def draw_line(draw, y, color=CYAN, width=2):
    draw.line([(140, y), (W - 140, y)], fill=color, width=width)

def draw_result_row(draw, y, label, value, value_color=WHITE):
    draw.text((200, y), label, fill=WHITE, font=font(26, False))
    draw.text((820, y), value, fill=value_color, font=font(28))

# ============================================================
# Slide 1: Title
# ============================================================
img, d = new_slide()
d.text((W//2, 300), "Agent Blockchain Registry", fill=CYAN, font=font(60), anchor="mm")
d.text((W//2, 390), "System Experiments on Base Sepolia", fill=WHITE, font=font(34, False), anchor="mm")
draw_line(d, 450, CYAN, 1)
d.text((W//2, 500), "60 agents registered  \u2022  3 experiments  \u2022  12 on-chain transactions", fill=MUTED, font=font(22, False), anchor="mm")
d.text((W//2, 560), "agent-registry-seven.vercel.app", fill=CYAN, font=font(20, False), anchor="mm")
d.text((W//2, 620), "April 2026  \u2022  ERC-8004 Trustless Agents  \u2022  Base L2", fill=MUTED, font=font(18, False), anchor="mm")
img.save(f"{FRAMES}/01.png")
print("  Slide 1: Title")

# ============================================================
# Slide 2: Setup
# ============================================================
img, d = new_slide()
d.text((140, 80), "EXPERIMENT SETUP", fill=CYAN, font=font(18))
d.text((140, 120), "How we tested the registry", fill=WHITE, font=font(44))
draw_line(d, 185)

items = [
    "6 AI agents deployed on Vercel serverless (cloud infrastructure)",
    "Each agent generates its own crypto wallet autonomously",
    "Wallets funded via Coinbase CDP faucet \u2014 no human needed",
    "Agents register on Base Sepolia blockchain (ERC-8004 standard)",
    "REST API on Vercel queried from multiple sources",
]
y = 230
for item in items:
    d.text((200, y), "\u2022  " + item, fill=WHITE, font=font(24, False))
    y += 50

d.rectangle([(160, y+30), (W-160, y+130)], fill=DARK_SURFACE, outline=(26, 34, 53))
d.text((200, y+45), "Agents:", fill=MUTED, font=font(18))
d.text((200, y+75), "DeFi Analyzer  \u2022  Security Auditor  \u2022  Data Collector  \u2022  Trading Bot  \u2022  Research Agent  \u2022  Governance Watcher", fill=CYAN, font=font(18, False))
img.save(f"{FRAMES}/02.png")
print("  Slide 2: Setup")

# ============================================================
# Slide 3: Experiment 1
# ============================================================
img, d = new_slide()
d.text((140, 80), "EXPERIMENT 1", fill=CYAN, font=font(18))
d.text((140, 120), "How should agents store identity data?", fill=WHITE, font=font(40))
d.text((140, 185), "Compared: Embedding full data in the transaction vs. storing on IPFS and referencing a short link", fill=MUTED, font=font(20, False))
draw_line(d, 230)

# Table header
d.rectangle([(160, 270), (W-160, 320)], fill=DARK_SURFACE)
d.text((200, 280), "Method", fill=CYAN, font=font(20))
d.text((750, 280), "Cost per agent", fill=CYAN, font=font(20))
d.text((1100, 280), "Result", fill=CYAN, font=font(20))

# Rows
d.text((200, 340), "Embed data in transaction", fill=WHITE, font=font(26, False))
d.text((750, 340), "$0.0025", fill=WHITE, font=font(26))
d.text((1100, 340), "\u2014", fill=MUTED, font=font(26, False))

d.text((200, 400), "Store on IPFS, use short link", fill=WHITE, font=font(26, False))
d.text((750, 400), "$0.0011", fill=GREEN, font=font(26))
d.text((1100, 400), "56% cheaper", fill=GREEN, font=font(26))

draw_line(d, 480)

d.rectangle([(160, 520), (W-160, 620)], fill=DARK_SURFACE, outline=(0, 229, 255, 40))
d.text((200, 535), "RESULT", fill=CYAN, font=font(18))
d.text((200, 565), "IPFS saves 56% \u2014 the protocol can sponsor 2.3x more registrations per dollar", fill=WHITE, font=font(24, False))
img.save(f"{FRAMES}/03.png")
print("  Slide 3: Experiment 1")

# ============================================================
# Slide 4: Experiment 2
# ============================================================
img, d = new_slide()
d.text((140, 80), "EXPERIMENT 2", fill=CYAN, font=font(18))
d.text((140, 120), "How fast can agents discover each other?", fill=WHITE, font=font(40))
d.text((140, 185), "Compared: Direct blockchain reads vs. our REST API  \u2022  30 queries each", fill=MUTED, font=font(20, False))
draw_line(d, 230)

# Table
d.rectangle([(160, 270), (W-160, 320)], fill=DARK_SURFACE)
d.text((200, 280), "Method", fill=CYAN, font=font(20))
d.text((800, 280), "Avg response time", fill=CYAN, font=font(20))

draw_result_row(d, 340, "Direct blockchain read", "32ms", GREEN)
draw_result_row(d, 400, "REST API (single agent)", "112ms", WHITE)
draw_result_row(d, 460, "REST API (list 5 agents)", "102ms", WHITE)

draw_line(d, 530)

d.rectangle([(160, 570), (W-160, 670)], fill=DARK_SURFACE, outline=(0, 229, 255, 40))
d.text((200, 585), "RESULT", fill=CYAN, font=font(18))
d.text((200, 615), "API adds 80ms overhead but stays under 200ms \u2014 fast enough for real-time agent queries", fill=WHITE, font=font(24, False))
img.save(f"{FRAMES}/04.png")
print("  Slide 4: Experiment 2")

# ============================================================
# Slide 5: Experiment 3
# ============================================================
img, d = new_slide()
d.text((140, 80), "EXPERIMENT 3", fill=CYAN, font=font(18))
d.text((140, 120), "Can agents register from the cloud autonomously?", fill=WHITE, font=font(40))
d.text((140, 185), "6 agents on Vercel serverless \u2014 zero human intervention", fill=MUTED, font=font(20, False))
draw_line(d, 230)

metrics = [
    ("Agents created", "6", CYAN),
    ("Successfully registered on-chain", "5 of 6", GREEN),
    ("Total time (all agents)", "12.3 seconds", CYAN),
    ("Cost per registration", "$0.001", GREEN),
    ("Failure (1 agent)", "Testnet faucet rate limit", AMBER),
]
y = 280
for label, val, color in metrics:
    draw_result_row(d, y, label, val, color)
    y += 55

draw_line(d, y + 20)

d.rectangle([(160, y+50), (W-160, y+150)], fill=DARK_SURFACE, outline=(0, 229, 255, 40))
d.text((200, y+65), "RESULT", fill=CYAN, font=font(18))
d.text((200, y+95), "Fully autonomous cloud registration works. Paymaster eliminates the faucet bottleneck on mainnet.", fill=WHITE, font=font(24, False))
img.save(f"{FRAMES}/05.png")
print("  Slide 5: Experiment 3")

# ============================================================
# Slide 6: Key Findings
# ============================================================
img, d = new_slide()
d.text((140, 80), "KEY FINDINGS", fill=CYAN, font=font(18))
d.text((140, 120), "What we learned", fill=WHITE, font=font(48))
draw_line(d, 195)

findings = [
    ("Cost:", "Store data on IPFS to cut registration costs by 56%", CYAN),
    ("Speed:", "API responds in 112ms \u2014 fast enough for real-time agent discovery", GREEN),
    ("Autonomy:", "Agents register from cloud infrastructure with zero human help", AMBER),
    ("Scale:", "60 agents live on Base Sepolia with consistent, predictable costs", WHITE),
]
y = 250
for i, (label, text, color) in enumerate(findings):
    d.text((200, y), f"{i+1}.", fill=CYAN, font=font(28))
    d.text((250, y), label, fill=color, font=font(26))
    d.text((250, y + 38), text, fill=MUTED, font=font(22, False))
    y += 100

draw_line(d, y + 20)
d.text((W//2, y + 60), "ERC-8004 Trustless Agents  \u2022  Base L2  \u2022  Gasless via CDP Paymaster", fill=MUTED, font=font(20, False), anchor="mm")
d.text((W//2, y + 100), "github.com/eyalban/agent-registry-framework", fill=CYAN, font=font(22, False), anchor="mm")
img.save(f"{FRAMES}/06.png")
print("  Slide 6: Key Findings")

# ============================================================
# Combine into video with ffmpeg
# ============================================================
print("\nCombining slides into video...")

# Create input file for ffmpeg
slides = [
    ("01.png", 5),
    ("02.png", 8),
    ("03.png", 12),
    ("04.png", 12),
    ("05.png", 12),
    ("06.png", 11),
]

# Use ffmpeg concat with image durations
inputs = []
filter_parts = []
for i, (name, dur) in enumerate(slides):
    inputs.extend(["-loop", "1", "-t", str(dur), "-i", f"{FRAMES}/{name}"])
    filter_parts.append(f"[{i}:v]scale=1920:1080,setsar=1[v{i}]")

filter_concat = ";".join(filter_parts) + ";" + "".join(f"[v{i}]" for i in range(len(slides))) + f"concat=n={len(slides)}:v=1:a=0[out]"

cmd = [
    "ffmpeg", "-y",
    *inputs,
    "-filter_complex", filter_concat,
    "-map", "[out]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    OUTPUT,
]

result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print(f"ffmpeg error: {result.stderr[-500:]}")
else:
    size = os.path.getsize(OUTPUT)
    print(f"\nVideo created: {OUTPUT}")
    print(f"Size: {size / 1024 / 1024:.1f} MB")

    # Get duration
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", OUTPUT],
        capture_output=True, text=True,
    )
    print(f"Duration: {float(probe.stdout.strip()):.1f}s")
