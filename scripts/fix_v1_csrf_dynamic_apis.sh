#!/usr/bin/env bash
set -euo pipefail

WEB="apps/web"
SRC="$WEB/src"
echo "🔧 Patching dynamic APIs (cookies/headers) in $SRC/app/api/**/route.ts"

# A) isCsrfValid in statements-Route auf async umstellen
if [[ -f "$SRC/app/api/statements/route.ts" ]]; then
  # function isCsrfValid() -> async function isCsrfValid()
  sed -E -i '' 's/function[[:space:]]+isCsrfValid\(/async function isCsrfValid\(/' "$SRC/app/api/statements/route.ts" 2>/dev/null || \
  sed -E -i 's/function[[:space:]]+isCsrfValid\(/async function isCsrfValid\(/' "$SRC/app/api/statements/route.ts"

  # cookies().get(...) -> (await cookies()).get(...)
  sed -E -i '' 's/cookies\(\)\.get/\(await cookies\(\)\)\.get/g' "$SRC/app/api/statements/route.ts" 2>/dev/null || \
  sed -E -i 's/cookies\(\)\.get/\(await cookies\(\)\)\.get/g' "$SRC/app/api/statements/route.ts"

  # headers().get(...) -> (await headers()).get(...)
  sed -E -i '' 's/headers\(\)\.get/\(await headers\(\)\)\.get/g' "$SRC/app/api/statements/route.ts" 2>/dev/null || \
  sed -E -i 's/headers\(\)\.get/\(await headers\(\)\)\.get/g' "$SRC/app/api/statements/route.ts"

  # Aufrufer: isCsrfValid() -> await isCsrfValid()
  sed -E -i '' 's/([^a-zA-Z])isCsrfValid\(\)/\1await isCsrfValid()/g' "$SRC/app/api/statements/route.ts" 2>/dev/null || \
  sed -E -i 's/([^a-zA-Z])isCsrfValid\(\)/\1await isCsrfValid()/g' "$SRC/app/api/statements/route.ts"
fi

# B) Generisch für ALLE route.ts unter app/api:
#    - = cookies() → = await cookies()
#    - = headers() → = await headers()
#    - .get via cookies()/headers() ebenfalls auf await
find "$SRC/app/api" -type f -name 'route.ts' | while read -r f; do
  sed -E -i '' 's/=\s*cookies\(\)/= await cookies()/g' "$f" 2>/dev/null || sed -E -i 's/=\s*cookies\(\)/= await cookies()/g' "$f"
  sed -E -i '' 's/=\s*headers\(\)/= await headers()/g' "$f" 2>/dev/null || sed -E -i 's/=\s*headers\(\)/= await headers()/g' "$f"
  sed -E -i '' 's/cookies\(\)\.get/\(await cookies\(\)\)\.get/g' "$f" 2>/dev/null || sed -E -i 's/cookies\(\)\.get/\(await cookies\(\)\)\.get/g' "$f"
  sed -E -i '' 's/headers\(\)\.get/\(await headers\(\)\)\.get/g' "$f" 2>/dev/null || sed -E -i 's/headers\(\)\.get/\(await headers\(\)\)\.get/g' "$f"
done

echo "✅ Patches angewendet"
echo "ℹ️  Falls du dev laufen hast: bitte neu starten, damit Next den Code neu lädt."
