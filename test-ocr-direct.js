// Test OCR.space API directly with different approaches
const testKey = process.env.OCR_SPACE_API_KEY;

if (!testKey) {
  console.error(
    "Missing OCR.space API key. Set OCR_SPACE_API_KEY to run this test."
  );
  process.exit(1);
}

async function testOCRAPI() {
  console.log("🧪 Testing OCR.space API\n");
  console.log(`🔑 Key: ${testKey}`);
  console.log(`📏 Length: ${testKey.length}\n`);

  // Test 1: Basic URL test
  console.log("Test 1: Basic URL recognition");
  try {
    const response = await fetch("https://apipro1.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: testKey,
      },
      body: new URLSearchParams({
        url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=HELLO",
        language: "eng",
      }),
    });
    const text = await response.text();
    console.log("Response:", text, "\n");
  } catch (e) {
    console.log("Error:", e.message, "\n");
  }

  // Test 2: Check if key might need different casing
  console.log("Test 2: Try with lowercase apikey header");
  try {
    const response = await fetch("https://apipro1.ocr.space/parse/image", {
      method: "POST",
      headers: {
        Apikey: testKey,
      },
      body: new URLSearchParams({
        url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=TEST",
        language: "eng",
      }),
    });
    const text = await response.text();
    console.log("Response:", text, "\n");
  } catch (e) {
    console.log("Error:", e.message, "\n");
  }

  // Test 3: Try apikey as URL parameter
  console.log("Test 3: Try apikey as URL parameter");
  try {
    const response = await fetch(
      "https://apipro1.ocr.space/parse/image?apikey=" + testKey,
      {
        method: "POST",
        body: new URLSearchParams({
          url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=PARAM",
          language: "eng",
        }),
      }
    );
    const text = await response.text();
    console.log("Response:", text, "\n");
  } catch (e) {
    console.log("Error:", e.message, "\n");
  }

  // Test 4: Without any API key to see the error message
  console.log("Test 4: Request without API key (baseline)");
  try {
    const response = await fetch("https://apipro1.ocr.space/parse/image", {
      method: "POST",
      body: new URLSearchParams({
        url: "https://via.placeholder.com/300x200/000000/FFFFFF?text=NOKEY",
        language: "eng",
      }),
    });
    const text = await response.text();
    console.log("Response:", text, "\n");
  } catch (e) {
    console.log("Error:", e.message, "\n");
  }
}

testOCRAPI();
