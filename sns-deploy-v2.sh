#!/bin/bash

# SNS-Governed Frontend Deployment Script v2.0
# Fully automated SNS frontend canister deployment with state tracking
# Features:
# - Auto-creates canister if missing
# - Sets up all permissions automatically
# - Registers with SNS via proposals
# - Tracks proposal status and waits for completion
# - Resumable (save state, can be interrupted and continued)
# - Validates canister ID (resets state if changed)

set -e

# ============================================
# CONFIGURATION
# ============================================

CANISTER_NAME="taco_dao_frontend"
NETWORK="ic"

# SNS Canister IDs
SNS_GOVERNANCE_CANISTER_ID="lhdfz-wqaaa-aaaaq-aae3q-cai"
SNS_ROOT_CANISTER_ID="lacdn-3iaaa-aaaaq-aae3a-cai"

# Proposal settings
PROPOSER_IDENTITY="launch"
PROPOSER_NEURON_ID="7383674bbd7de7568a767ce2bb9f56f64228cf60ca80eb11782b3b4e2a3dfad5"
PROPOSAL_URL="https://tacodao.com"

# Canister creation settings
CYCLES_AMOUNT="900000000000"  # 900B cycles (500B fee + 400B for canister)

# State file for tracking progress
STATE_FILE=".sns-deploy-state.json"

# ============================================
# COLORS
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# LOGGING FUNCTIONS
# ============================================

print_step() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

print_info() {
    echo -e "${BLUE}INFO:${NC} $1"
}

# ============================================
# STATE MANAGEMENT FUNCTIONS
# ============================================

# Initialize empty state
init_state() {
    cat > "$STATE_FILE" << EOF
{
  "canister_id": "",
  "canister_created": false,
  "permissions_cleaned": false,
  "root_controller_added": false,
  "governance_controller_added": false,
  "prepare_granted_to_deployer": false,
  "commit_granted_to_root": false,
  "commit_granted_to_governance": false,
  "manage_granted_to_root": false,
  "manage_granted_to_governance": false,
  "deployer_manage_revoked": false,
  "registration_proposal_id": 0,
  "registration_proposal_status": "not_submitted",
  "function_id": 0,
  "function_proposal_id": 0,
  "function_proposal_status": "not_submitted",
  "setup_complete": false,
  "last_updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

# Load state from file
load_state() {
    if [ ! -f "$STATE_FILE" ]; then
        print_info "No state file found, starting fresh."
        init_state
    fi
}

# Save a specific state key-value
save_state() {
    local key="$1"
    local value="$2"

    # Update timestamp
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Use jq to update the JSON (install jq if not available)
    if command -v jq &> /dev/null; then
        local temp_file=$(mktemp)
        jq --arg key "$key" --arg val "$value" --arg ts "$timestamp" \
           '.[$key] = $val | .last_updated = $ts' \
           "$STATE_FILE" > "$temp_file"
        mv "$temp_file" "$STATE_FILE"
    else
        # Fallback: simple sed replacement (less robust)
        sed -i "s/\"$key\": \"[^\"]*\"/\"$key\": \"$value\"/" "$STATE_FILE"
        sed -i "s/\"$key\": [0-9]*/\"$key\": $value/" "$STATE_FILE"
        sed -i "s/\"$key\": false/\"$key\": $value/" "$STATE_FILE"
        sed -i "s/\"$key\": true/\"$key\": $value/" "$STATE_FILE"
    fi
}

# Get state value
get_state() {
    local key="$1"

    if command -v jq &> /dev/null; then
        jq -r ".$key" "$STATE_FILE"
    else
        # Fallback: grep and extract
        grep "\"$key\"" "$STATE_FILE" | sed 's/.*: "\?\([^",]*\)"\?.*/\1/'
    fi
}

# Reset state completely
reset_state() {
    print_warning "Resetting state..."
    rm -f "$STATE_FILE"
    init_state
    print_info "State reset complete."
}

# Validate state matches current canister
validate_canister_state() {
    local current_canister="$1"
    local saved_canister=$(get_state "canister_id")

    if [ -n "$saved_canister" ] && [ "$saved_canister" != "null" ] && [ "$saved_canister" != "" ]; then
        if [ "$current_canister" != "$saved_canister" ]; then
            print_warning "Canister ID mismatch!"
            print_warning "State: $saved_canister → Current: $current_canister"
            print_warning "Resetting state for new canister..."
            reset_state
            save_state "canister_id" "$current_canister"
            return 1
        else
            print_info "Canister ID matches state: $current_canister ✓"
            return 0
        fi
    else
        # No saved canister, save current one
        save_state "canister_id" "$current_canister"
        return 0
    fi
}

# ============================================
# CANISTER MANAGEMENT FUNCTIONS
# ============================================

# Ensure canister exists, create if missing
ensure_canister_exists() {
    print_step "Checking canister status..."

    # Check if canister_ids.json exists and has our canister
    if [ -f "canister_ids.json" ]; then
        if grep -q "\"$CANISTER_NAME\"" canister_ids.json 2>/dev/null; then
            # Canister exists, get ID
            TARGET_CANISTER_ID=$(dfx canister --network "$NETWORK" id "$CANISTER_NAME" 2>/dev/null || echo "")

            if [ -n "$TARGET_CANISTER_ID" ]; then
                print_info "Canister found: $TARGET_CANISTER_ID"

                # Validate against state
                validate_canister_state "$TARGET_CANISTER_ID"

                return 0
            fi
        fi
    fi

    # Canister doesn't exist, create it
    print_info "No canister found, creating new one..."

    # Switch to deployer identity
    dfx identity use "$PROPOSER_IDENTITY"

    # Create canister with cycles
    print_info "Creating canister with ${CYCLES_AMOUNT} cycles..."
    dfx canister --network "$NETWORK" create "$CANISTER_NAME" --with-cycles "$CYCLES_AMOUNT"

    # Get canister ID
    TARGET_CANISTER_ID=$(dfx canister --network "$NETWORK" id "$CANISTER_NAME")
    print_info "Canister created: $TARGET_CANISTER_ID"

    # Deploy initial empty frontend
    print_info "Deploying initial frontend..."
    dfx build "$CANISTER_NAME" --network "$NETWORK"
    dfx canister --network "$NETWORK" install "$CANISTER_NAME" --mode install

    # Save to state
    save_state "canister_id" "$TARGET_CANISTER_ID"
    save_state "canister_created" "true"

    print_info "Canister creation complete ✓"
}

# Get current canister ID
get_canister_id() {
    if [ -n "$TARGET_CANISTER_ID" ]; then
        echo "$TARGET_CANISTER_ID"
    else
        dfx canister --network "$NETWORK" id "$CANISTER_NAME"
    fi
}

# Get deployer principal
get_deployer_principal() {
    dfx identity use "$PROPOSER_IDENTITY" > /dev/null 2>&1
    dfx identity get-principal
}

# ============================================
# CONTROLLER MANAGEMENT FUNCTIONS
# ============================================

# Check if a principal is a controller
is_controller() {
    local canister="$1"
    local principal="$2"

    local controllers=$(dfx canister --network "$NETWORK" info "$canister" 2>&1 | grep "Controllers:" | sed 's/Controllers: //')

    if echo "$controllers" | grep -q "$principal"; then
        return 0
    else
        return 1
    fi
}

# Add a controller to the canister
add_controller() {
    local canister="$1"
    local new_controller="$2"
    local description="$3"

    print_info "Adding $description as controller..."

    # Get current controllers
    local current_controllers=$(dfx canister --network "$NETWORK" info "$canister" 2>&1 | grep "Controllers:" | sed 's/Controllers: //')

    # Check if already a controller
    if echo "$current_controllers" | grep -q "$new_controller"; then
        print_info "$description is already a controller ✓"
        return 0
    fi

    # Build controllers list
    local all_controllers="$current_controllers $new_controller"

    # Update settings
    dfx canister --network "$NETWORK" update-settings "$canister" --add-controller "$new_controller"

    print_info "$description added as controller ✓"
}

# ============================================
# PERMISSION MANAGEMENT FUNCTIONS
# ============================================

# Check if a principal has a specific permission
has_permission() {
    local canister="$1"
    local principal="$2"
    local permission="$3"  # Prepare, Commit, or ManagePermissions

    local permitted=$(dfx canister --network "$NETWORK" call "$canister" list_permitted "(record { permission = variant { $permission } })" 2>&1)

    if echo "$permitted" | grep -q "$principal"; then
        return 0
    else
        return 1
    fi
}

# Grant permission to a principal
grant_permission() {
    local canister="$1"
    local principal="$2"
    local permission="$3"
    local description="$4"

    print_info "Granting $permission permission to $description..."

    # Check if already has permission
    if has_permission "$canister" "$principal" "$permission"; then
        print_info "$description already has $permission permission ✓"
        return 0
    fi

    # Grant permission
    dfx canister --network "$NETWORK" call "$canister" grant_permission "(record {
        to_principal = principal \"$principal\";
        permission = variant { $permission }
    })"

    print_info "$permission permission granted to $description ✓"
}

# List all principals with a specific permission
list_principals_with_permission() {
    local canister="$1"
    local permission="$2"

    local permitted=$(dfx canister --network "$NETWORK" call "$canister" list_permitted "(record { permission = variant { $permission } })" 2>&1)
    echo "$permitted" | grep -oP 'principal "[^"]+"' | sed 's/principal "//g' | sed 's/"//g'
}

# Revoke permission from a principal
revoke_permission() {
    local canister="$1"
    local principal="$2"
    local permission="$3"

    print_info "Revoking $permission from $principal..."
    dfx canister --network "$NETWORK" call "$canister" revoke_permission "(record {
        of_principal = principal \"$principal\";
        permission = variant { $permission }
    })"
}

# Check and cleanup unwanted permissions
cleanup_unwanted_permissions() {
    local canister="$1"
    local deployer="$2"

    print_step "Checking for unwanted permissions..."

    # Check if deployer is still a controller (RegisterDappCanisters not executed)
    if ! is_controller "$canister" "$deployer"; then
        print_info "RegisterDappCanisters already executed, skipping cleanup..."
        return 0
    fi

    # Collect only UNWANTED permissions
    local has_unwanted=false
    local unwanted_list=""

    # Track unknown principals with Commit (they should get Prepare)
    local unknown_with_commit=""

    # Check deployer's Commit permission (UNWANTED - deployer should only have Prepare)
    local deployer_commit=$(list_principals_with_permission "$canister" "Commit" | grep -x "$deployer" || true)
    if [ -n "$deployer_commit" ]; then
        unwanted_list+="  - Deployer has Commit (should only have Prepare)\n"
        has_unwanted=true
    fi

    # Check deployer's ManagePermissions (UNWANTED - will be revoked at the end anyway)
    local deployer_manage=$(list_principals_with_permission "$canister" "ManagePermissions" | grep -x "$deployer" || true)
    if [ -n "$deployer_manage" ]; then
        unwanted_list+="  - Deployer has ManagePermissions (will be revoked at end of setup)\n"
        has_unwanted=true
    fi

    # First pass: find unknown principals with Commit (revoke Commit, grant Prepare instead)
    local commit_principals=$(list_principals_with_permission "$canister" "Commit")
    if [ -n "$commit_principals" ]; then
        while IFS= read -r principal; do
            if [ "$principal" != "$deployer" ] && [ "$principal" != "$SNS_ROOT_CANISTER_ID" ] && [ "$principal" != "$SNS_GOVERNANCE_CANISTER_ID" ]; then
                unwanted_list+="  - $principal has Commit (will revoke Commit, grant Prepare)\n"
                unknown_with_commit+="$principal"$'\n'
                has_unwanted=true
            fi
        done <<< "$commit_principals"
    fi

    # Check for any OTHER principals with ManagePermissions (not Root, not Governance, not Deployer)
    local manage_principals=$(list_principals_with_permission "$canister" "ManagePermissions")
    if [ -n "$manage_principals" ]; then
        while IFS= read -r principal; do
            if [ "$principal" != "$deployer" ] && [ "$principal" != "$SNS_ROOT_CANISTER_ID" ] && [ "$principal" != "$SNS_GOVERNANCE_CANISTER_ID" ]; then
                unwanted_list+="  - $principal has ManagePermissions (unknown principal, will revoke)\n"
                has_unwanted=true
            fi
        done <<< "$manage_principals"
    fi

    if [ "$has_unwanted" = false ]; then
        print_info "No unwanted permissions found ✓"
        return 0
    fi

    # Warn user
    print_warning "Permission issues detected:"
    echo -e "$unwanted_list"
    echo ""
    print_warning "These permissions should be fixed before SNS setup."
    echo ""
    read -p "Should I fix these permissions? (y/N) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Cannot proceed with permission issues."
        print_error "Please fix permissions manually or rerun with permission to fix."
        exit 1
    fi

    # Fix permissions
    print_step "Fixing permissions..."

    # Revoke deployer's Commit if they have it
    if [ -n "$deployer_commit" ]; then
        revoke_permission "$canister" "$deployer" "Commit"
    fi

    # For unknown principals with Commit: revoke Commit, grant Prepare
    if [ -n "$unknown_with_commit" ]; then
        while IFS= read -r principal; do
            if [ -n "$principal" ]; then
                # First grant Prepare (so they still have access)
                if ! has_permission "$canister" "$principal" "Prepare"; then
                    grant_permission "$canister" "$principal" "Prepare" "unknown principal $principal"
                fi
                # Then revoke Commit
                revoke_permission "$canister" "$principal" "Commit"
            fi
        done <<< "$unknown_with_commit"
    fi

    # Revoke ManagePermissions from unknown principals
    if [ -n "$manage_principals" ]; then
        while IFS= read -r principal; do
            if [ "$principal" != "$deployer" ] && [ "$principal" != "$SNS_ROOT_CANISTER_ID" ] && [ "$principal" != "$SNS_GOVERNANCE_CANISTER_ID" ]; then
                revoke_permission "$canister" "$principal" "ManagePermissions"
            fi
        done <<< "$manage_principals"
    fi

    # Note: We DON'T revoke deployer's ManagePermissions here - that happens at the very end

    print_info "Permissions fixed ✓"
}

# ============================================
# PROPOSAL MANAGEMENT FUNCTIONS
# ============================================

# Get highest function ID from SNS governance
get_highest_function_id() {
    local functions_output=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" list_nervous_system_functions '(record {})' 2>&1)
    local highest_id=$(echo "$functions_output" | grep -oP 'id = \K[0-9_]+' | tr -d '_' | sort -n | tail -1)

    if [ -n "$highest_id" ]; then
        echo "$highest_id"
    else
        echo "3000"
    fi
}

# Check if commit_proposed_batch function is registered for this canister
check_function_registered() {
    local canister="$1"

    local functions_output=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" list_nervous_system_functions '(record {})' 2>&1)

    # Use Python to correctly parse the function records and find the one matching our canister
    local function_id=$(echo "$functions_output" | python3 -c "
import sys, re

data = sys.stdin.read()

# Find all function IDs and check if their record contains both our canister and commit_proposed_batch
for match in re.finditer(r'record \{ id = ([0-9_]+)', data):
    id_val = match.group(1).replace('_', '')
    start_pos = match.start()

    # Find the next record start to define boundaries
    next_match = re.search(r'record \{ id = [0-9_]+', data[match.end():])
    if next_match:
        end_pos = match.end() + next_match.start()
    else:
        end_pos = len(data)

    # Extract this record's content
    record_content = data[start_pos:end_pos]

    # Check if it contains both our canister and commit_proposed_batch method
    if '$canister' in record_content and 'commit_proposed_batch' in record_content:
        print(id_val)
        break
" 2>/dev/null)

    if [ -n "$function_id" ]; then
        echo "$function_id"
        return 0
    else
        return 1
    fi
}

# Check proposal status
check_proposal_status() {
    local proposal_id="$1"

    local proposal_data=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" get_proposal "(record { proposal_id = opt record { id = ${proposal_id} : nat64 } })" 2>&1)

    # Check if executed (timestamp must be > 0, not just present)
    # Numbers can have underscores like 1_768_232_431
    if echo "$proposal_data" | grep -qP "executed_timestamp_seconds = [1-9][0-9_]* :"; then
        echo "executed"
        return 0
    fi

    # Check if failed (timestamp must be > 0)
    if echo "$proposal_data" | grep -qP "failed_timestamp_seconds = [1-9][0-9_]* :"; then
        echo "failed"
        return 1
    fi

    # Check if rejected (timestamp must be > 0)
    if echo "$proposal_data" | grep -qP "rejected_timestamp_seconds = [1-9][0-9_]* :"; then
        echo "rejected"
        return 1
    fi

    # Still pending
    echo "pending"
    return 2
}

# Wait for proposal to execute
wait_for_proposal() {
    local proposal_id="$1"
    local description="$2"

    print_step "Checking proposal $proposal_id status..."
    print_info "Description: $description"

    # Check initial status
    local status=$(check_proposal_status "$proposal_id")

    if [ "$status" == "executed" ]; then
        print_info "Proposal $proposal_id already executed! ✓"
        return 0
    elif [ "$status" == "failed" ] || [ "$status" == "rejected" ]; then
        print_error "Proposal $proposal_id already failed or was rejected!"
        return 1
    fi

    # Proposal is pending, start waiting
    print_info "Proposal is pending, waiting for execution..."
    echo ""

    local max_wait=60000  # 1000 minutes max
    local elapsed=0
    local interval=5
    local indicator="-"

    while [ $elapsed -lt $max_wait ]; do
        local status=$(check_proposal_status "$proposal_id")

        if [ "$status" == "executed" ]; then
            echo -ne "\r\033[K"  # Clear the line
            print_info "Proposal $proposal_id executed successfully! ✓"
            return 0
        elif [ "$status" == "failed" ] || [ "$status" == "rejected" ]; then
            echo -ne "\r\033[K"  # Clear the line
            print_error "Proposal $proposal_id failed or was rejected!"
            return 1
        fi

        # Get voting progress
        local proposal_data=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" get_proposal "(record { proposal_id = opt record { id = ${proposal_id} : nat64 } })" 2>&1)

        # Extract yes/no/total votes from latest_tally using Python, convert from e8s to tokens
        local votes=$(echo "$proposal_data" | python3 -c "
import sys, re
data = sys.stdin.read()
# Look for latest_tally block
tally_match = re.search(r'latest_tally = opt record \{[^}]*no = ([0-9_]+)[^}]*yes = ([0-9_]+)[^}]*total = ([0-9_]+)', data, re.DOTALL)
if tally_match:
    no_e8s = int(tally_match.group(1).replace('_', ''))
    yes_e8s = int(tally_match.group(2).replace('_', ''))
    total_e8s = int(tally_match.group(3).replace('_', ''))
else:
    no_e8s = yes_e8s = total_e8s = 0
# Convert from e8s to tokens (divide by 10^8)
yes_tokens = yes_e8s / 100_000_000
no_tokens = no_e8s / 100_000_000
total_tokens = total_e8s / 100_000_000
voted_tokens = yes_tokens + no_tokens
# Approval is yes / total voting power
yes_pct = (yes_tokens * 100 / total_tokens) if total_tokens > 0 else 0
# Use pipe delimiter to avoid comma issues in number formatting
print(f'{yes_tokens:.2f}|{no_tokens:.2f}|{voted_tokens:.2f}|{yes_pct:.1f}')
" 2>/dev/null)

        if [ -n "$votes" ]; then
            IFS='|' read -r yes_tokens no_tokens voted_tokens yes_pct <<< "$votes"
            # Display progress on same line (overwrite previous) with alternating indicator
            echo -ne "\r\033[0;34mVoting:\033[0m Yes: ${yes_tokens} | No: ${no_tokens} | Voted: ${voted_tokens} | Approval: ${yes_pct}% ${indicator}"
        else
            echo -ne "\r\033[0;34mWaiting for voting data...\033[0m ${indicator}"
        fi

        # Toggle indicator between - and _
        if [ "$indicator" == "-" ]; then
            indicator="_"
        else
            indicator="-"
        fi

        sleep "$interval"
        elapsed=$((elapsed + interval))
    done

    echo ""  # New line after progress
    print_warning "Proposal $proposal_id still pending after ${max_wait}s"
    print_info "Check status manually or wait longer"
    return 2
}

# Check for existing RegisterDappCanisters proposals for this canister
check_existing_register_proposal() {
    local canister="$1"

    print_step "Checking for existing RegisterDappCanisters proposals..." >&2

    # List all proposals (last 100, status 1 = Open/pending)
    local proposals=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" list_proposals "(record { limit = 100 : nat32; include_reward_status = vec {}; before_proposal = null; exclude_type = vec {}; include_status = vec { 1 : int32 } })" 2>&1)

    # Use Python to properly parse and find RegisterDappCanisters proposal for our canister
    local proposal_id=$(echo "$proposals" | python3 -c "
import sys, re

data = sys.stdin.read()
canister = '$canister'

# Find all proposal blocks
for match in re.finditer(r'id = opt record \{ id = ([0-9_]+)', data):
    prop_id = match.group(1).replace('_', '')
    start_pos = match.start()

    # Find the next proposal to define boundaries
    next_match = re.search(r'id = opt record \{ id = [0-9_]+', data[match.end():])
    if next_match:
        end_pos = match.end() + next_match.start()
    else:
        end_pos = len(data)

    # Extract this proposal's content
    proposal_content = data[start_pos:end_pos]

    # Check if it's a RegisterDappCanisters proposal for our canister
    if 'RegisterDappCanisters' in proposal_content and canister in proposal_content:
        print(prop_id)
        break
" 2>/dev/null)

    # Validate proposal_id is a non-empty number
    if [ -n "$proposal_id" ] && [[ "$proposal_id" =~ ^[0-9]+$ ]]; then
        print_info "Found existing RegisterDappCanisters proposal: $proposal_id" >&2
        echo "$proposal_id"
        return 0
    fi

    return 1
}

# Check for existing AddGenericNervousSystemFunction proposals for this canister
check_existing_function_proposal() {
    local canister="$1"

    print_step "Checking for existing AddGenericNervousSystemFunction proposals..." >&2

    # List all proposals (last 100, status 1 = Open/pending)
    local proposals=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" list_proposals "(record { limit = 100 : nat32; include_reward_status = vec {}; before_proposal = null; exclude_type = vec {}; include_status = vec { 1 : int32 } })" 2>&1)

    # Use Python to properly parse and find AddGenericNervousSystemFunction proposal for our canister
    local proposal_id=$(echo "$proposals" | python3 -c "
import sys, re

data = sys.stdin.read()
canister = '$canister'

# Find all proposal blocks
for match in re.finditer(r'id = opt record \{ id = ([0-9_]+)', data):
    prop_id = match.group(1).replace('_', '')
    start_pos = match.start()

    # Find the next proposal to define boundaries
    next_match = re.search(r'id = opt record \{ id = [0-9_]+', data[match.end():])
    if next_match:
        end_pos = match.end() + next_match.start()
    else:
        end_pos = len(data)

    # Extract this proposal's content
    proposal_content = data[start_pos:end_pos]

    # Check if it's an AddGenericNervousSystemFunction with commit_proposed_batch for our canister
    if 'AddGenericNervousSystemFunction' in proposal_content and canister in proposal_content and 'commit_proposed_batch' in proposal_content:
        print(prop_id)
        break
" 2>/dev/null)

    # Validate proposal_id is a non-empty number
    if [ -n "$proposal_id" ] && [[ "$proposal_id" =~ ^[0-9]+$ ]]; then
        print_info "Found existing AddGenericNervousSystemFunction proposal: $proposal_id" >&2
        echo "$proposal_id"
        return 0
    fi

    return 1
}

# Submit RegisterDappCanisters proposal
submit_register_dapp_proposal() {
    local canister="$1"

    print_step "Submitting RegisterDappCanisters proposal..." >&2

    local title="Register Frontend Canister with SNS"
    local summary="Register frontend canister $canister with SNS. This will set SNS Root as the sole controller, enabling SNS-governed upgrades."

    local neuron_subaccount=$(echo "$PROPOSER_NEURON_ID" | sed 's/../\\&/g')

    export DFX_WARNING=-mainnet_plaintext_identity

    local output=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" manage_neuron "(record {
        subaccount = blob \"$neuron_subaccount\";
        command = opt variant {
            MakeProposal = record {
                url = \"$PROPOSAL_URL\";
                title = \"$title\";
                action = opt variant {
                    RegisterDappCanisters = record {
                        canister_ids = vec { principal \"$canister\" };
                    }
                };
                summary = \"$summary\";
            }
        };
    })" 2>&1)

    # Extract proposal ID from output (remove ANSI color codes first)
    local clean_output=$(echo "$output" | sed 's/\x1b\[[0-9;]*m//g')
    local proposal_id=$(echo "$clean_output" | grep -oP 'proposal_id = opt record \{ id = \K[0-9_]+' | tr -d '_' | head -1)

    if [ -n "$proposal_id" ]; then
        print_info "Proposal submitted! ID: $proposal_id" >&2
        echo "$proposal_id"
        return 0
    else
        print_error "Failed to extract proposal ID from output" >&2
        echo "$clean_output"
        return 1
    fi
}

# Submit AddNervousSystemFunction proposal
submit_register_function_proposal() {
    local canister="$1"
    local function_id="$2"

    print_step "Registering commit_proposed_batch function (ID: $function_id)..." >&2

    local title="Register commit_proposed_batch for Frontend"
    local summary="Register commit_proposed_batch function (ID $function_id) for frontend canister $canister to enable SNS-governed deployments."

    local neuron_subaccount=$(echo "$PROPOSER_NEURON_ID" | sed 's/../\\&/g')

    export DFX_WARNING=-mainnet_plaintext_identity

    local output=$(dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" manage_neuron "(record {
        subaccount = blob \"$neuron_subaccount\";
        command = opt variant {
            MakeProposal = record {
                url = \"$PROPOSAL_URL\";
                title = \"$title\";
                action = opt variant {
                    AddGenericNervousSystemFunction = record {
                        id = ${function_id} : nat64;
                        name = \"commit_proposed_batch\";
                        description = opt \"Commit a proposed batch of assets to the frontend canister ($canister)\";
                        function_type = opt variant {
                            GenericNervousSystemFunction = record {
                                topic = opt variant { DappCanisterManagement };
                                validator_canister_id = opt principal \"$canister\";
                                target_canister_id = opt principal \"$canister\";
                                validator_method_name = opt \"validate_commit_proposed_batch\";
                                target_method_name = opt \"commit_proposed_batch\";
                            }
                        };
                    }
                };
                summary = \"$summary\";
            }
        };
    })" 2>&1)

    # Extract proposal ID from output (remove ANSI color codes first)
    local clean_output=$(echo "$output" | sed 's/\x1b\[[0-9;]*m//g')
    local proposal_id=$(echo "$clean_output" | grep -oP 'proposal_id = opt record \{ id = \K[0-9_]+' | tr -d '_' | head -1)

    if [ -n "$proposal_id" ]; then
        print_info "Proposal submitted! ID: $proposal_id" >&2
        echo "$proposal_id"
        return 0
    else
        print_error "Failed to extract proposal ID from output" >&2
        echo "$clean_output"
        return 1
    fi
}

# ============================================
# SETUP VALIDATION
# ============================================

validate_setup() {
    local canister="$1"
    local deployer="$2"
    local auto_fix="${3:-false}"  # Pass "true" to auto-fix issues

    print_step "Validating setup..."

    local all_valid=true
    local needs_proposals=false

    # Check deployer has Prepare
    if has_permission "$canister" "$deployer" "Prepare"; then
        print_info "Deployer has Prepare: YES ✓"
    else
        print_warning "Deployer has Prepare: NO"
        if [ "$auto_fix" == "true" ]; then
            grant_permission "$canister" "$deployer" "Prepare" "deployer"
            save_state "prepare_granted_to_deployer" "true"
        else
            all_valid=false
        fi
    fi

    # Check Governance has Commit
    if has_permission "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "Commit"; then
        print_info "Governance has Commit: YES ✓"
    else
        print_warning "Governance has Commit: NO"
        if [ "$auto_fix" == "true" ]; then
            grant_permission "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "Commit" "SNS Governance"
            save_state "commit_granted_to_governance" "true"
        else
            all_valid=false
        fi
    fi

    # Check Root has Commit
    if has_permission "$canister" "$SNS_ROOT_CANISTER_ID" "Commit"; then
        print_info "Root has Commit: YES ✓"
    else
        print_warning "Root has Commit: NO"
        if [ "$auto_fix" == "true" ]; then
            grant_permission "$canister" "$SNS_ROOT_CANISTER_ID" "Commit" "SNS Root"
            save_state "commit_granted_to_root" "true"
        else
            all_valid=false
        fi
    fi

    # Check Governance has ManagePermissions
    if has_permission "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "ManagePermissions"; then
        print_info "Governance has ManagePermissions: YES ✓"
    else
        print_warning "Governance has ManagePermissions: NO"
        if [ "$auto_fix" == "true" ]; then
            grant_permission "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "ManagePermissions" "SNS Governance"
            save_state "manage_granted_to_governance" "true"
        else
            all_valid=false
        fi
    fi

    # Check Root has ManagePermissions
    if has_permission "$canister" "$SNS_ROOT_CANISTER_ID" "ManagePermissions"; then
        print_info "Root has ManagePermissions: YES ✓"
    else
        print_warning "Root has ManagePermissions: NO"
        if [ "$auto_fix" == "true" ]; then
            grant_permission "$canister" "$SNS_ROOT_CANISTER_ID" "ManagePermissions" "SNS Root"
            save_state "manage_granted_to_root" "true"
        else
            all_valid=false
        fi
    fi

    # Check deployer does NOT have ManagePermissions (should be revoked)
    if has_permission "$canister" "$deployer" "ManagePermissions"; then
        print_warning "Deployer has ManagePermissions: YES (should be revoked)"
        if [ "$auto_fix" == "true" ]; then
            revoke_permission "$canister" "$deployer" "ManagePermissions"
            save_state "deployer_manage_revoked" "true"
            print_info "Deployer's ManagePermissions revoked ✓"
        else
            all_valid=false
        fi
    else
        print_info "Deployer has ManagePermissions: NO ✓"
    fi

    # Check Root is controller
    if is_controller "$canister" "$SNS_ROOT_CANISTER_ID"; then
        print_info "Root is controller: YES ✓"
    else
        print_warning "Root is controller: NO"
        if [ "$auto_fix" == "true" ]; then
            add_controller "$canister" "$SNS_ROOT_CANISTER_ID" "SNS Root"
            save_state "root_controller_added" "true"
        else
            all_valid=false
        fi
    fi

    # Check Governance is controller
    if is_controller "$canister" "$SNS_GOVERNANCE_CANISTER_ID"; then
        print_info "Governance is controller: YES ✓"
    else
        print_warning "Governance is controller: NO"
        if [ "$auto_fix" == "true" ]; then
            add_controller "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "SNS Governance"
            save_state "governance_controller_added" "true"
        else
            all_valid=false
        fi
    fi

    # Check function registered (must have valid ID > 0)
    local func_id=$(check_function_registered "$canister")
    if [ $? -eq 0 ] && [ -n "$func_id" ] && [ "$func_id" -gt 0 ] 2>/dev/null; then
        print_info "Function registered: YES (ID: $func_id) ✓"
        save_state "function_id" "$func_id"
        save_state "function_proposal_status" "executed"
    else
        print_warning "Function registered: NO"
        all_valid=false
        needs_proposals=true
    fi

    # Check registration proposal executed (CRITICAL - must be executed, not just pending)
    local reg_status=$(get_state "registration_proposal_status")
    if [ "$reg_status" == "executed" ]; then
        print_info "RegisterDappCanisters proposal: EXECUTED ✓"
    else
        print_warning "RegisterDappCanisters proposal: $reg_status (must be executed)"
        all_valid=false
        needs_proposals=true
    fi

    # Check function proposal executed
    local func_status=$(get_state "function_proposal_status")
    if [ "$func_status" == "executed" ]; then
        print_info "Function registration proposal: EXECUTED ✓"
    else
        print_warning "Function registration proposal: $func_status (must be executed)"
        all_valid=false
        needs_proposals=true
    fi

    if [ "$all_valid" == "true" ]; then
        print_info "All checks passed! ✓"
        return 0
    else
        if [ "$auto_fix" == "true" ] && [ "$needs_proposals" == "true" ]; then
            print_warning "Permissions fixed, but proposals still needed"
            return 1
        elif [ "$auto_fix" == "true" ]; then
            print_info "All fixable issues resolved! ✓"
            return 0
        fi
        print_warning "Setup incomplete"
        return 1
    fi
}

# ============================================
# MAIN SETUP FLOW
# ============================================

run_setup() {
    local canister="$1"
    local deployer="$2"

    print_step "Starting SNS setup..."

    # Check if setup already complete
    local setup_complete=$(get_state "setup_complete")
    if [ "$setup_complete" == "true" ]; then
        print_info "Setup already complete, skipping..."
        return 0
    fi

    # Step 0a: Grant ManagePermissions to Root (BEFORE cleanup)
    local manage_root=$(get_state "manage_granted_to_root")
    if [ "$manage_root" != "true" ]; then
        grant_permission "$canister" "$SNS_ROOT_CANISTER_ID" "ManagePermissions" "SNS Root"
        save_state "manage_granted_to_root" "true"
    else
        print_info "ManagePermissions already granted to Root, skipping..."
    fi

    # Step 0b: Grant ManagePermissions to Governance (BEFORE cleanup)
    local manage_gov=$(get_state "manage_granted_to_governance")
    if [ "$manage_gov" != "true" ]; then
        grant_permission "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "ManagePermissions" "SNS Governance"
        save_state "manage_granted_to_governance" "true"
    else
        print_info "ManagePermissions already granted to Governance, skipping..."
    fi

    # Step 0c: Clean up unwanted permissions (after granting ManagePermissions)
    local permissions_cleaned=$(get_state "permissions_cleaned")
    if [ "$permissions_cleaned" != "true" ]; then
        cleanup_unwanted_permissions "$canister" "$deployer"
        save_state "permissions_cleaned" "true"
    else
        print_info "Permissions already cleaned, skipping..."
    fi

    # Step 1: Add Root as controller
    local root_added=$(get_state "root_controller_added")
    if [ "$root_added" != "true" ]; then
        add_controller "$canister" "$SNS_ROOT_CANISTER_ID" "SNS Root"
        save_state "root_controller_added" "true"
    else
        print_info "Root controller already added, skipping..."
    fi

    # Step 2: Add Governance as controller
    local gov_added=$(get_state "governance_controller_added")
    if [ "$gov_added" != "true" ]; then
        add_controller "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "SNS Governance"
        save_state "governance_controller_added" "true"
    else
        print_info "Governance controller already added, skipping..."
    fi

    # Step 3: Grant Prepare to deployer
    local prepare_granted=$(get_state "prepare_granted_to_deployer")
    if [ "$prepare_granted" != "true" ]; then
        grant_permission "$canister" "$deployer" "Prepare" "deployer"
        save_state "prepare_granted_to_deployer" "true"
    else
        print_info "Prepare permission already granted to deployer, skipping..."
    fi

    # Step 4: Grant Commit to Root
    local commit_root=$(get_state "commit_granted_to_root")
    if [ "$commit_root" != "true" ]; then
        grant_permission "$canister" "$SNS_ROOT_CANISTER_ID" "Commit" "SNS Root"
        save_state "commit_granted_to_root" "true"
    else
        print_info "Commit permission already granted to Root, skipping..."
    fi

    # Step 5: Grant Commit to Governance
    local commit_gov=$(get_state "commit_granted_to_governance")
    if [ "$commit_gov" != "true" ]; then
        grant_permission "$canister" "$SNS_GOVERNANCE_CANISTER_ID" "Commit" "SNS Governance"
        save_state "commit_granted_to_governance" "true"
    else
        print_info "Commit permission already granted to Governance, skipping..."
    fi

    # Step 6: Register with SNS
    local reg_status=$(get_state "registration_proposal_status")
    if [ "$reg_status" != "executed" ]; then
        if [ "$reg_status" == "not_submitted" ]; then
            # Check for existing proposal first
            local existing_prop
            existing_prop=$(check_existing_register_proposal "$canister")
            local check_result=$?
            if [ $check_result -eq 0 ] && [ -n "$existing_prop" ] && [[ "$existing_prop" =~ ^[0-9]+$ ]]; then
                print_info "Using existing RegisterDappCanisters proposal: $existing_prop"
                save_state "registration_proposal_id" "$existing_prop"
                save_state "registration_proposal_status" "pending"
            else
                # Submit new proposal
                local reg_prop_id
                reg_prop_id=$(submit_register_dapp_proposal "$canister")
                local submit_result=$?
                if [ $submit_result -eq 0 ] && [ -n "$reg_prop_id" ] && [[ "$reg_prop_id" =~ ^[0-9]+$ ]]; then
                    save_state "registration_proposal_id" "$reg_prop_id"
                    save_state "registration_proposal_status" "pending"
                else
                    print_error "Failed to submit RegisterDappCanisters proposal"
                    return 1
                fi
            fi
        fi

        # Wait for proposal
        local reg_prop_id=$(get_state "registration_proposal_id")
        if wait_for_proposal "$reg_prop_id" "RegisterDappCanisters"; then
            save_state "registration_proposal_status" "executed"
        else
            print_error "RegisterDappCanisters proposal failed"
            return 1
        fi
    elif [ "$reg_status" == "executed" ]; then
        print_info "RegisterDappCanisters already executed, skipping..."
    fi

    # Step 7: Register commit function
    local func_status=$(get_state "function_proposal_status")
    if [ "$func_status" != "executed" ]; then
        # Check if function already exists
        local existing_func
        existing_func=$(check_function_registered "$canister")
        local func_check_result=$?
        if [ $func_check_result -eq 0 ] && [ -n "$existing_func" ] && [[ "$existing_func" =~ ^[0-9]+$ ]]; then
            print_info "Function already registered with ID: $existing_func"
            save_state "function_id" "$existing_func"
            save_state "function_proposal_status" "executed"
        else
            if [ "$func_status" == "not_submitted" ]; then
                # Check if there's already a pending proposal for this function
                local existing_func_prop
                existing_func_prop=$(check_existing_function_proposal "$canister")
                local func_prop_check=$?
                if [ $func_prop_check -eq 0 ] && [ -n "$existing_func_prop" ] && [[ "$existing_func_prop" =~ ^[0-9]+$ ]]; then
                    print_info "Using existing function proposal: $existing_func_prop"
                    save_state "function_proposal_id" "$existing_func_prop"
                    save_state "function_proposal_status" "pending"
                else
                    # Generate new function ID
                    local highest=$(get_highest_function_id)
                    local new_func_id=$((highest + 1))
                    save_state "function_id" "$new_func_id"

                    # Submit proposal
                    local func_prop_id
                    func_prop_id=$(submit_register_function_proposal "$canister" "$new_func_id")
                    local func_submit_result=$?
                    if [ $func_submit_result -eq 0 ] && [ -n "$func_prop_id" ] && [[ "$func_prop_id" =~ ^[0-9]+$ ]]; then
                        save_state "function_proposal_id" "$func_prop_id"
                        save_state "function_proposal_status" "pending"
                    else
                        print_error "Failed to submit function registration proposal"
                        return 1
                    fi
                fi
            fi

            # Wait for proposal
            local func_prop_id=$(get_state "function_proposal_id")
            if wait_for_proposal "$func_prop_id" "AddNervousSystemFunction"; then
                save_state "function_proposal_status" "executed"
                # After proposal executes, get the actual function ID that was created
                local registered_func
                registered_func=$(check_function_registered "$canister")
                local reg_func_result=$?
                if [ $reg_func_result -eq 0 ] && [ -n "$registered_func" ] && [[ "$registered_func" =~ ^[0-9]+$ ]]; then
                    save_state "function_id" "$registered_func"
                fi
            else
                print_error "Function registration proposal failed"
                return 1
            fi
        fi
    else
        print_info "Function already registered, skipping..."
    fi

    # Step 8: Revoke deployer's ManagePermissions (final cleanup)
    local deployer_manage_revoked=$(get_state "deployer_manage_revoked")
    if [ "$deployer_manage_revoked" != "true" ]; then
        print_step "Revoking deployer's ManagePermissions (final cleanup)..."

        # Check if deployer still has ManagePermissions
        if has_permission "$canister" "$deployer" "ManagePermissions"; then
            revoke_permission "$canister" "$deployer" "ManagePermissions"
            print_info "Deployer's ManagePermissions revoked ✓"
        else
            print_info "Deployer doesn't have ManagePermissions, skipping..."
        fi

        save_state "deployer_manage_revoked" "true"
    else
        print_info "Deployer's ManagePermissions already revoked, skipping..."
    fi

    # Mark setup complete
    save_state "setup_complete" "true"
    print_step "Setup complete! ✓"
}

# ============================================
# DEPLOYMENT FLOW
# ============================================

deploy_frontend() {
    local canister="$1"

    print_step "Building project..."
    dfx build --network "$NETWORK"

    print_step "Deploying by proposal..."
    local deploy_output=$(dfx deploy "$CANISTER_NAME" --network "$NETWORK" --by-proposal 2>&1)

    echo "$deploy_output"

    # Extract batch ID and evidence
    local batch_id=$(echo "$deploy_output" | grep -oP 'batch \K[0-9]+' | head -1)
    local evidence=$(echo "$deploy_output" | grep -oP 'evidence \K[a-f0-9]{64}')

    if [ -z "$batch_id" ] || [ -z "$evidence" ]; then
        print_error "Could not extract batch ID or evidence from deployment output"
        return 1
    fi

    print_info "Batch ID: $batch_id"
    print_info "Evidence: $evidence"

    # Get function ID
    local function_id=$(get_state "function_id")

    # Generate Candid payload
    print_step "Encoding commit arguments..."

    local payload=$(python3 << PYEOF
def leb128_unsigned(n):
    result = []
    while True:
        byte = n & 0x7f
        n >>= 7
        if n != 0:
            byte |= 0x80
        result.append(byte)
        if n == 0:
            break
    return bytes(result)

def candid_hash(name):
    h = 0
    for c in name:
        h = (h * 223 + ord(c)) & 0xFFFFFFFF
    return h

evidence_hex = '$evidence'
evidence_bytes = bytes.fromhex(evidence_hex)
batch_id = $batch_id

batch_id_hash = candid_hash('batch_id')
evidence_hash = candid_hash('evidence')

result = b'DIDL'
result += bytes([0x02])
result += bytes([0x6d, 0x7b])
result += bytes([0x6c, 0x02])
result += leb128_unsigned(batch_id_hash)
result += bytes([0x7d])
result += leb128_unsigned(evidence_hash)
result += bytes([0x00])
result += bytes([0x01, 0x01])
result += leb128_unsigned(batch_id)
result += leb128_unsigned(len(evidence_bytes))
result += evidence_bytes
print(''.join(f'\\\\{b:02x}' for b in result))
PYEOF
)

    print_info "Payload generated"

    # Create proposal
    print_step "Submitting commit proposal..."

    local title="Update Frontend Canister"
    local summary="Update frontend canister $canister with batch $batch_id. Evidence: $evidence"

    local neuron_subaccount=$(echo "$PROPOSER_NEURON_ID" | sed 's/../\\&/g')

    export DFX_WARNING=-mainnet_plaintext_identity

    dfx canister --network "$NETWORK" call "$SNS_GOVERNANCE_CANISTER_ID" manage_neuron "(record {
        subaccount = blob \"$neuron_subaccount\";
        command = opt variant {
            MakeProposal = record {
                url = \"$PROPOSAL_URL\";
                title = \"$title\";
                action = opt variant {
                    ExecuteGenericNervousSystemFunction = record {
                        function_id = ${function_id} : nat64;
                        payload = blob \"$payload\";
                    }
                };
                summary = \"$summary\";
            }
        };
    })"

    print_step "Deployment proposal submitted! ✓"
    print_info "If rejected, delete batch with:"
    echo "dfx canister --network $NETWORK call $canister delete_batch '(record { batch_id = $batch_id : nat })'"
}

# ============================================
# MAIN SCRIPT
# ============================================

main() {
    print_step "SNS-Governed Frontend Deployment Script v2.0"
    echo ""

    # Load state
    print_step "Loading state..."
    load_state

    # Ensure canister exists
    ensure_canister_exists

    # Get canister ID
    TARGET_CANISTER_ID=$(get_canister_id)

    # Get deployer principal
    DEPLOYER_PRINCIPAL=$(get_deployer_principal)
    print_info "Deployer principal: $DEPLOYER_PRINCIPAL"

    # First validate to see what's missing
    if validate_setup "$TARGET_CANISTER_ID" "$DEPLOYER_PRINCIPAL"; then
        print_info "Setup is complete!"
        echo ""

        # Proceed to deployment
        deploy_frontend "$TARGET_CANISTER_ID"
    else
        print_warning "Setup incomplete, attempting to fix..."
        echo ""

        # Try to auto-fix permission issues first
        if validate_setup "$TARGET_CANISTER_ID" "$DEPLOYER_PRINCIPAL" "true"; then
            print_info "All fixable issues resolved!"
            echo ""
            # Proceed to deployment
            deploy_frontend "$TARGET_CANISTER_ID"
        else
            # Still need proposals, run full setup
            print_warning "Proposals needed, running full setup..."
            echo ""

            # Run setup for proposals
            if run_setup "$TARGET_CANISTER_ID" "$DEPLOYER_PRINCIPAL"; then
                print_step "Setup completed successfully! ✓"
                print_info "Run the script again to deploy."
            else
                print_error "Setup failed"
                exit 1
            fi
        fi
    fi
}

# Run main
main
