#!/bin/sh
# Health check script - tests both GET and POST to catch 403 errors
# GET test
GET_RESULT=$(wget -q -O - http://127.0.0.1:3000/api/health 2>&1)
if ! echo "$GET_RESULT" | grep -q '"status":"healthy"'; then
  exit 1
fi
# POST test - critical for detecting 403 errors
POST_RESULT=$(wget -q -O - --post-data='' http://127.0.0.1:3000/api/health 2>&1)
if echo "$POST_RESULT" | grep -q '"status":"healthy"'; then
  exit 0
else
  exit 1
fi
