#\!/bin/bash

# Package and object IDs
PACKAGE_ID="0x69ef98c5a266ac2c109e764379b1ab2ea3a786c2a543277c2bef7a619a2308ff"
CAMPAIGN_MANAGER_ID="0xc6bd218faaccd0195918a301677c5a1066ac6316e0367cb397ee947546e17c48"

# Get current timestamp and add 30 days (in seconds)
CURRENT_TIME=$(date +%s)
DEADLINE=$((CURRENT_TIME + 2592000))

# Create campaign with empty beneficial parties
sui client call \
  --package $PACKAGE_ID \
  --module crowdfunding \
  --function create_campaign \
  --type-args "0x2::sui::SUI" \
  --args \
    $CAMPAIGN_MANAGER_ID \
    "Test Campaign" \
    "This is a test campaign" \
    "https://example.com/image.jpg" \
    "Test Category" \
    "1000000000" \
    "$DEADLINE" \
    "[]" \
    "[0]" \
  --gas-budget 10000000
