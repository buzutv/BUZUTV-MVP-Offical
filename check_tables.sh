#!/usr/bin/env bash
# check_tables.sh
# Usage: SUPABASE_URL="https://<project>.supabase.co" SUPABASE_KEY="<anon-key>" ./check_tables.sh tables.txt
# or: ./check_tables.sh (it will read tables.txt by default)

SUPABASE_URL="${https://zkufdbuzqdxtiudhaagg.supabase.co}"
SUPABASE_KEY="${eyjhbgcioijiuzi1niisinr5cci6ikpxvcj9.eyjpc3mioijzdxbhymfzzsisinjlzii6inprdwzkynv6cwr4dgl1zghhywdniiwicm9szsi6imfub24ilcjpyxqioje3ntaxmjgwmtisimv4cci6mja2ntcwndaxmn0.cpqwe80pvdh0-mn1nqa_usqfmusbizpgs2navnyuhy8}"
TABLE_LIST_FILE="${1:-tables.txt}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo "Set SUPABASE_URL and SUPABASE_KEY environment variables."
  echo "Example: SUPABASE_URL='https://xyz.supabase.co' SUPABASE_KEY='ey...' ./check_tables.sh tables.txt"
  exit 2
fi

if [[ ! -f "$TABLE_LIST_FILE" ]]; then
  echo "Table list file not found: $TABLE_LIST_FILE"
  echo "Create a file with one candidate table name per line (e.g. users, profiles, posts)"
  exit 2
fi

echo "Checking tables from $TABLE_LIST_FILE against $SUPABASE_URL/rest/v1/"
echo

while IFS= read -r table || [[ -n "$table" ]]; do
  table=$(echo "$table" | xargs)   # trim whitespace
  [[ -z "$table" ]] && continue

  url="${SUPABASE_URL%/}/rest/v1/${table}?select=*&limit=1"
  # Ask for one row (if any). Use anon key as api key and bearer.
  http_code=$(curl -s -o /tmp/sup_resp.json -w "%{http_code}" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    "$url")

  if [[ "$http_code" == "200" ]]; then
    body=$(cat /tmp/sup_resp.json)
    # Check if returned JSON is an empty array
    if [[ "$body" == "[]" || -z "$body" ]]; then
      echo "FOUND: $table  — (exists & accessible) BUT no rows returned => can't infer columns."
    else
      # Extract column names from first object using jq (jq must be installed)
      if command -v jq >/dev/null 2>&1; then
        cols=$(echo "$body" | jq -r '.[0] | keys | .[]' | paste -sd ", " -)
        echo "FOUND: $table  — sample row columns: $cols"
        echo "Sample row:"
        echo "$body" | jq '.[0]' | sed 's/^/  /'
      else
        echo "FOUND: $table  — sample row (jq not installed). Raw JSON:"
        echo "$body"
      fi
    fi
  elif [[ "$http_code" == "404" || "$http_code" == "415" || "$http_code" == "401" ]]; then
    # 404 likely: route not found -> table probably doesn't exist or not exposed
    echo "NOT FOUND / NO ACCESS: $table (HTTP $http_code)"
  else
    echo "UNKNOWN RESPONSE for $table -> HTTP $http_code"
    echo "Response body:"
    cat /tmp/sup_resp.json
  fi

  echo "----"
done < "$TABLE_LIST_FILE"

rm -f /tmp/sup_resp.json

