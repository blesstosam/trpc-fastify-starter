#!/bin/bash

# =============================================================================
# auto.sh - Automated Task Runner
# =============================================================================
# This script runs Codex CLI multiple times in a loop to automatically
# complete tasks defined in task.json
#
# Usage: ./auto.sh <number_of_runs>
# Example: ./auto.sh 5
# =============================================================================

set -e

# Colors for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log file
LOG_DIR="./automation-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/automation-$(date +%Y%m%d_%H%M%S).log"

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"

    case $level in
        INFO)
            echo -e "${BLUE}[INFO]${NC} ${message}"
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}"
            ;;
        WARNING)
            echo -e "${YELLOW}[WARNING]${NC} ${message}"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}"
            ;;
        PROGRESS)
            echo -e "${CYAN}[PROGRESS]${NC} ${message}"
            ;;
    esac
}

# Function to count remaining tasks
count_remaining_tasks() {
    if [ -f "task.json" ]; then
        # Count tasks with passes: false
        local count
        count=$(grep -c '"passes": false' task.json 2>/dev/null || true)
        echo "${count:-0}"
    else
        echo "0"
    fi
}

# Check if number argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <number_of_runs>"
    echo "Example: $0 5"
    exit 1
fi

# Validate input is a number
if ! [[ "$1" =~ ^[0-9]+$ ]]; then
    echo "Error: Argument must be a positive integer"
    exit 1
fi

TOTAL_RUNS=$1

# Banner
echo ""
echo "========================================"
echo "  Codex Automation Runner"
echo "========================================"
echo ""

log "INFO" "Starting automation with $TOTAL_RUNS runs"
log "INFO" "Log file: $LOG_FILE"

# Check if task.json exists
if [ ! -f "task.json" ]; then
    log "ERROR" "task.json not found in current directory: $(pwd)"
    exit 1
fi

# Prompt source file (read on every run)
WORKFLOW_PROMPT_FILE="./auto-workflow.md"
if [ ! -f "$WORKFLOW_PROMPT_FILE" ]; then
    log "ERROR" "Prompt file not found: $WORKFLOW_PROMPT_FILE"
    exit 1
fi

# Initial task count
INITIAL_TASKS=$(count_remaining_tasks)
log "INFO" "Tasks remaining at start: $INITIAL_TASKS"

# Main loop
for ((run=1; run<=TOTAL_RUNS; run++)); do
    echo ""
    echo "========================================"
    log "PROGRESS" "Run $run of $TOTAL_RUNS"
    echo "========================================"

    # Check remaining tasks before this run
    REMAINING=$(count_remaining_tasks)

    if [ "$REMAINING" -eq 0 ]; then
        log "SUCCESS" "All tasks completed! No more tasks to process."
        log "INFO" "Automation finished early after $((run-1)) runs"
        exit 0
    fi

    log "INFO" "Tasks remaining before this run: $REMAINING"

    # Run timestamp for this iteration
    RUN_START=$(date +%s)
    RUN_LOG="$LOG_DIR/run-${run}-$(date +%Y%m%d_%H%M%S).log"

    log "INFO" "Starting Codex exec session..."
    log "INFO" "Run log: $RUN_LOG"

    # Run Codex with the prompt from stdin
    # Read prompt content directly from auto-workflow.md every run
    # Use --yolo to bypass approvals and sandboxing in trusted environments
    if codex exec --yolo - < "$WORKFLOW_PROMPT_FILE" 2>&1 | tee "$RUN_LOG"; then

        RUN_END=$(date +%s)
        RUN_DURATION=$((RUN_END - RUN_START))

        log "SUCCESS" "Run $run completed in ${RUN_DURATION} seconds"
    else
        RUN_END=$(date +%s)
        RUN_DURATION=$((RUN_END - RUN_START))

        log "WARNING" "Run $run finished with exit code $? after ${RUN_DURATION} seconds"
    fi

    # Check remaining tasks after this run
    REMAINING_AFTER=$(count_remaining_tasks)
    COMPLETED=$((REMAINING - REMAINING_AFTER))

    if [ "$COMPLETED" -gt 0 ]; then
        log "SUCCESS" "Task(s) completed this run: $COMPLETED"
    else
        log "WARNING" "No tasks marked as completed this run"
    fi

    log "INFO" "Tasks remaining after run $run: $REMAINING_AFTER"

    # Add separator in log
    echo "" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    # Small delay between runs
    if [ $run -lt $TOTAL_RUNS ]; then
        log "INFO" "Waiting 2 seconds before next run..."
        sleep 2
    fi
done

# Final summary
echo ""
echo "========================================"
log "SUCCESS" "Automation completed!"
echo "========================================"

FINAL_REMAINING=$(count_remaining_tasks)
TOTAL_COMPLETED=$((INITIAL_TASKS - FINAL_REMAINING))

log "INFO" "Summary:"
log "INFO" "  - Total runs: $TOTAL_RUNS"
log "INFO" "  - Tasks completed: $TOTAL_COMPLETED"
log "INFO" "  - Tasks remaining: $FINAL_REMAINING"
log "INFO" "  - Log file: $LOG_FILE"

if [ "$FINAL_REMAINING" -eq 0 ]; then
    log "SUCCESS" "All tasks have been completed!"
else
    log "WARNING" "Some tasks remain. You may need to run more iterations."
fi
