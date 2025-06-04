#!/bin/bash

# Script to donate to a SuiGive campaign using the Sui CLI
# Usage: ./donate-sui-cli.sh <campaign-id> <amount-in-sui>

# Configuration
PACKAGE_ID="0x9b1398e542c72df0448054e98d59406468edb3379e2f35e12829e903a13fec51"
REGISTRY_ID="0xbea7df830dca9675ea4cd4aa8c243bef7f91dc048921e77ac074f8416788333e"
SG_USD_TYPE="0x1e8b532cca6569cab9f9b9ebc73f8c13885012ade714729aa3b450e0339ac766::sg_usd::SG_USD"

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <campaign-id> <amount-in-sui>"
    echo "Example: $0 0x7b30511945c28e9c5c0487e0291df5739e5035f65310628a0899db3b84d8ae36 0.1"
    exit 1
fi

CAMPAIGN_ID=$1
AMOUNT=$2

# Convert amount to MIST (1 SUI = 10^9 MIST)
AMOUNT_MIST=$(echo "$AMOUNT * 1000000000" | bc | awk '{printf "%.0f", $0}')

echo "Donating $AMOUNT SUI ($AMOUNT_MIST MIST) to campaign $CAMPAIGN_ID"

# Check if active address is set
ACTIVE_ADDRESS=$(sui client active-address)
if [ -z "$ACTIVE_ADDRESS" ]; then
    echo "Error: No active address set. Use 'sui client switch --address <address>' to set one."
    exit 1
fi

echo "Using address: $ACTIVE_ADDRESS"

# Execute donation transaction
echo "Executing donation transaction..."
sui client call --package $PACKAGE_ID \
    --module crowdfunding \
    --function donate \
    --args $REGISTRY_ID $CAMPAIGN_ID \
    --gas-budget 10000000

echo "Transaction completed!"
