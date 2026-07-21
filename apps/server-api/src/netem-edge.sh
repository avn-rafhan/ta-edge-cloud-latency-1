#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${1:-edge-api}"
MODE="${2:-apply}"
DELAY_MS="${3:-20}"
JITTER_MS="${4:-5}"
LOSS_PERCENT="${5:-0.5}"

if [[ "$MODE" == "apply" ]]; then
  echo "Applying netem to $CONTAINER_NAME"
  docker exec "$CONTAINER_NAME" sh -c "
    tc qdisc replace dev eth0 root netem delay ${DELAY_MS}ms ${JITTER_MS}ms distribution normal loss ${LOSS_PERCENT}%
  "
elif [[ "$MODE" == "clear" ]]; then
  echo "Clearing netem from $CONTAINER_NAME"
  docker exec "$CONTAINER_NAME" sh -c "tc qdisc del dev eth0 root || true"
else
  echo "Usage: ./netem-edge.sh [container-name] [apply|clear] [delay_ms] [jitter_ms] [loss_percent]"
  exit 1
fi
