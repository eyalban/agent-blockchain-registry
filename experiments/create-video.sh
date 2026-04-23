#!/usr/bin/env bash
# ============================================================
# Create experiment results video from text slides + screenshots
# Output: experiments/experiment-demo.mp4
# ============================================================

set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"

DIR="$(cd "$(dirname "$0")" && pwd)"
FRAMES="$DIR/video-frames"
OUTPUT="$DIR/experiment-demo.mp4"

rm -rf "$FRAMES"
mkdir -p "$FRAMES"

# Colors
BG="#06070a"
CYAN="#00e5ff"
WHITE="#e2e8f0"
MUTED="#64748b"
GREEN="#00ff88"

# ============================================================
# Generate title slides using ffmpeg drawtext
# Each slide is a 5-second segment at 1920x1080
# ============================================================

make_slide() {
  local num=$1
  local duration=$2
  local output="$FRAMES/slide_${num}.mp4"
  shift 2
  # Remaining args are drawtext filters
  local filters="$*"

  ffmpeg -y -f lavfi -i "color=c=${BG}:s=1920x1080:d=${duration}" \
    -vf "$filters" \
    -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
    "$output" 2>/dev/null

  echo "  Created slide $num (${duration}s)"
}

echo "Generating video slides..."

# Slide 1: Title (5s)
make_slide 01 5 "\
drawtext=text='Agent Blockchain Registry':fontsize=64:fontcolor=${CYAN}:x=(w-text_w)/2:y=340:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='System Experiments on Base Sepolia':fontsize=36:fontcolor=${WHITE}:x=(w-text_w)/2:y=430:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='60 agents registered  |  3 experiments  |  12 on-chain transactions':fontsize=22:fontcolor=${MUTED}:x=(w-text_w)/2:y=520:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='April 2026  |  agent-registry-seven.vercel.app':fontsize=20:fontcolor=${MUTED}:x=(w-text_w)/2:y=620:fontfile=/System/Library/Fonts/Helvetica.ttc"

# Slide 2: Setup (8s)
make_slide 02 8 "\
drawtext=text='EXPERIMENT SETUP':fontsize=20:fontcolor=${CYAN}:x=140:y=120:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='How we tested Statemate':fontsize=48:fontcolor=${WHITE}:x=140:y=170:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='- 6 autonomous AI agents deployed on Vercel serverless (cloud)':fontsize=28:fontcolor=${WHITE}:x=140:y=300:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='- Each agent generates its own wallet and registers on-chain':fontsize=28:fontcolor=${WHITE}:x=140:y=360:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='- Wallets funded via Coinbase CDP faucet (no human intervention)':fontsize=28:fontcolor=${WHITE}:x=140:y=420:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='- All transactions on Base Sepolia (ERC-8004 Identity Registry)':fontsize=28:fontcolor=${WHITE}:x=140:y=480:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='- REST API deployed on Vercel, queried from multiple sources':fontsize=28:fontcolor=${WHITE}:x=140:y=540:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Agents\: DeFi Analyzer, Security Auditor, Data Collector, Trading Bot, Research Agent, Governance Watcher':fontsize=20:fontcolor=${MUTED}:x=140:y=660:fontfile=/System/Library/Fonts/Helvetica.ttc"

# Slide 3: Experiment 1 (12s)
make_slide 03 12 "\
drawtext=text='EXPERIMENT 1':fontsize=20:fontcolor=${CYAN}:x=140:y=100:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='How should agents store identity data?':fontsize=44:fontcolor=${WHITE}:x=140:y=150:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Compared\: Embedding full data in transaction vs. storing on IPFS':fontsize=24:fontcolor=${MUTED}:x=140:y=230:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='6 agents registered (3 each method)':fontsize=24:fontcolor=${MUTED}:x=140:y=270:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Data URI (embed in tx)':fontsize=32:fontcolor=${WHITE}:x=200:y=370:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='\$0.0025 per agent':fontsize=32:fontcolor=${WHITE}:x=800:y=370:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='IPFS reference (short link)':fontsize=32:fontcolor=${WHITE}:x=200:y=440:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='\$0.0011 per agent':fontsize=32:fontcolor=${GREEN}:x=800:y=440:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='RESULT\: IPFS saves 56%% of costs':fontsize=40:fontcolor=${CYAN}:x=200:y=560:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='2.3x more registrations per dollar when the protocol sponsors gas':fontsize=24:fontcolor=${MUTED}:x=200:y=630:fontfile=/System/Library/Fonts/Helvetica.ttc"

# Slide 4: Experiment 2 (12s)
make_slide 04 12 "\
drawtext=text='EXPERIMENT 2':fontsize=20:fontcolor=${CYAN}:x=140:y=100:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='How fast can agents discover each other?':fontsize=44:fontcolor=${WHITE}:x=140:y=150:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Compared\: Direct blockchain reads vs. our REST API (30 queries each)':fontsize=24:fontcolor=${MUTED}:x=140:y=230:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Direct blockchain read':fontsize=32:fontcolor=${WHITE}:x=200:y=360:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='32ms average':fontsize=32:fontcolor=${GREEN}:x=800:y=360:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='REST API (single agent)':fontsize=32:fontcolor=${WHITE}:x=200:y=430:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='112ms average':fontsize=32:fontcolor=${WHITE}:x=800:y=430:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='REST API (list 5 agents)':fontsize=32:fontcolor=${WHITE}:x=200:y=500:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='102ms average':fontsize=32:fontcolor=${WHITE}:x=800:y=500:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='RESULT\: API adds 80ms overhead, stays under 200ms':fontsize=40:fontcolor=${CYAN}:x=200:y=620:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Fast enough for real-time agent-to-agent discovery':fontsize=24:fontcolor=${MUTED}:x=200:y=690:fontfile=/System/Library/Fonts/Helvetica.ttc"

# Slide 5: Experiment 3 (12s)
make_slide 05 12 "\
drawtext=text='EXPERIMENT 3':fontsize=20:fontcolor=${CYAN}:x=140:y=100:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Can agents register autonomously from the cloud?':fontsize=44:fontcolor=${WHITE}:x=140:y=150:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='6 agents created on Vercel serverless - zero human intervention':fontsize=24:fontcolor=${MUTED}:x=140:y=230:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Agents created':fontsize=28:fontcolor=${WHITE}:x=200:y=340:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='6':fontsize=36:fontcolor=${CYAN}:x=800:y=335:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Successfully registered on-chain':fontsize=28:fontcolor=${WHITE}:x=200:y=400:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='5 of 6':fontsize=36:fontcolor=${GREEN}:x=800:y=395:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Total time (all 6 agents)':fontsize=28:fontcolor=${WHITE}:x=200:y=460:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='12.3 seconds':fontsize=36:fontcolor=${CYAN}:x=800:y=455:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Cost per registration':fontsize=28:fontcolor=${WHITE}:x=200:y=520:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='\$0.001':fontsize=36:fontcolor=${GREEN}:x=800:y=515:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='RESULT\: Fully autonomous cloud registration works':fontsize=40:fontcolor=${CYAN}:x=200:y=640:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='1 agent failed due to testnet faucet rate limit (not an issue on mainnet)':fontsize=22:fontcolor=${MUTED}:x=200:y=710:fontfile=/System/Library/Fonts/Helvetica.ttc"

# Slide 6: Key Findings (11s)
make_slide 06 11 "\
drawtext=text='KEY FINDINGS':fontsize=20:fontcolor=${CYAN}:x=140:y=100:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='What we learned':fontsize=48:fontcolor=${WHITE}:x=140:y=150:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='1. Cost\: Store data on IPFS to cut registration costs by 56%%':fontsize=30:fontcolor=${WHITE}:x=200:y=300:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='2. Speed\: API responds in 112ms - fast enough for real-time agent queries':fontsize=30:fontcolor=${WHITE}:x=200:y=380:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='3. Autonomy\: Agents register from cloud with zero human help':fontsize=30:fontcolor=${WHITE}:x=200:y=460:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='4. Scale\: 60 agents live on Base Sepolia, consistent gas costs':fontsize=30:fontcolor=${WHITE}:x=200:y=540:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='Built on ERC-8004 Trustless Agents  |  Base L2  |  Gasless via CDP Paymaster':fontsize=22:fontcolor=${MUTED}:x=(w-text_w)/2:y=680:fontfile=/System/Library/Fonts/Helvetica.ttc,\
drawtext=text='github.com/eyalban/agent-registry-framework':fontsize=22:fontcolor=${CYAN}:x=(w-text_w)/2:y=730:fontfile=/System/Library/Fonts/Helvetica.ttc"

# ============================================================
# Concatenate all slides
# ============================================================
echo ""
echo "Concatenating slides..."

# Create concat file
cat > "$FRAMES/concat.txt" << EOF
file 'slide_01.mp4'
file 'slide_02.mp4'
file 'slide_03.mp4'
file 'slide_04.mp4'
file 'slide_05.mp4'
file 'slide_06.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$FRAMES/concat.txt" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -movflags +faststart \
  "$OUTPUT" 2>/dev/null

echo ""
echo "========================================="
echo "  Video created: $OUTPUT"
ls -lh "$OUTPUT"
echo ""
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" 2>/dev/null)
echo "  Duration: ${DURATION}s"
echo "========================================="
