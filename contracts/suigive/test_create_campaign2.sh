#\!/bin/bash

# First, let's check the exact Move type structure
PACKAGE_ID="0x69ef98c5a266ac2c109e764379b1ab2ea3a786c2a543277c2bef7a619a2308ff"

# Get the Move functions
sui move explain $PACKAGE_ID --module crowdfunding --function create_campaign
