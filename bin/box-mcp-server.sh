#!/bin/bash

# Node v22 shows punycode warnings and Box ts sdk has not been updated yet
# So we need to disable warnings for now

# Add the no-warnings flag if NODE_OPTIONS is not already set
export NODE_OPTIONS="${NODE_OPTIONS:---no-warnings}"

# Execute the main script
node "$(dirname "$0")/../dist/index.js" "$@"