// Test different ways to send API key
const testKey = process.env.OCR_SPACE_API_KEY;

if (!testKey) {
  console.error(
    "Missing OCR.space API key. Set OCR_SPACE_API_KEY to run this test."
  );
  process.exit(1);
}

async function testModes() {
  console.log("🔍 Testing API key transmission modes\n");

  const modes = [
    {
      name: "Header: apikey (lowercase)",
      headers: { apikey: testKey },
    },
    {
      name: "Header: API_KEY",
      headers: { API_KEY: testKey },
    },
    {
      name: "Header: X-API-Key",
      headers: { "X-API-Key": testKey },
    },
    {
      name: "Body parameter: apikey",
      bodyParam: "apikey",
    },
    {
      name: "URL query string",
      urlParam: true,
    },
  ];

  for (const mode of modes) {
    console.log(`\n📋 ${mode.name}:`);

    try {
      let url = "https://apipro1.ocr.space/parse/image";
      let body = new URLSearchParams({
        url: "https://via.placeholder.com/300x200?text=TEST",
        language: "eng",
      });

      let init = {
        method: "POST",
        headers: mode.headers || {},
      };

      if (mode.bodyParam) {
        body.append(mode.bodyParam, testKey);
      }

      if (mode.urlParam) {
        url += "?apikey=" + testKey;
      }

      init.body = body;

      const response = await fetch(url, init);
      const text = await response.text();

      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text}`);
    } catch (e) {
      console.log(`   Error: ${e.message}`);
    }
  }
}

testModes();
