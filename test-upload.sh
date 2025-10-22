#!/bin/bash

set -euo pipefail

API_URL_DEFAULT="http://localhost:${PORT:-3000}/api/pipeline/pdf-to-offer"
API_URL="${1:-}"  # optional first arg as full URL or file path
FILE_ARG=""

# If first arg is a file, treat it as PDF to upload; otherwise it's URL
if [[ -n "${API_URL}" && -f "${API_URL}" ]]; then
  FILE_ARG="${API_URL}"
  API_URL="${API_URL_DEFAULT}"
elif [[ -z "${API_URL}" ]]; then
  API_URL="${API_URL_DEFAULT}"
fi

echo "Testing PDF upload API -> ${API_URL}"

# If no file provided, create a tiny test.pdf
if [[ -z "${FILE_ARG}" ]]; then
  echo "Creating small test.pdf..."
  cat > test.pdf <<'PDF'
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
398
%%EOF
PDF
  FILE_ARG="test.pdf"
fi

echo "Uploading ${FILE_ARG} ..."
set +e
HTTP_CODE=$(curl -s -w "\nHTTP:%{http_code}\n" -F "file=@${FILE_ARG};type=application/pdf" "${API_URL}" | tee /dev/stderr | tail -n1 | sed 's/HTTP://')
set -e

echo "HTTP status: ${HTTP_CODE}"

if [[ "${FILE_ARG}" == "test.pdf" ]]; then
  rm -f test.pdf
fi