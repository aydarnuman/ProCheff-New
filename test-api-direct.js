// Direct API test without file upload
const testMenuText = `Test Menü - Restoran ABC

ANA YEMEKLER
Izgara Tavuk Göğsü - 45 TL
Bonfile Steak - 85 TL  
Kuru Fasulye - 35 TL

BAŞLANGIÇLAR
Mercimek Çorbası - 18 TL
Yeşil Salata - 22 TL

TATLILAR  
Baklava - 28 TL
Sütlaç - 20 TL

İÇECEKLER
Çay - 8 TL
Türk Kahvesi - 12 TL`;

console.log("Menu Text Analysis:");
console.log("Text length:", testMenuText.length);

const menuItems = testMenuText
  .split("\n")
  .filter(
    (line) =>
      line.includes("TL") || line.includes("₺") || line.includes("fiyat")
  );

console.log("Found menu items:", menuItems);
console.log("Items count:", menuItems.length);

const response = {
  success: true,
  message: "PDF başarıyla analiz edildi",
  panelData: {
    menu: {
      type: "Restaurant Menüsü",
      items: menuItems.length || 10,
      category: "Genel Restoran",
      currency: "TL",
      averagePrice: 35,
      analysis: {
        totalItems: menuItems.length,
        priceRange: "8-85 TL",
        categories: ["Ana Yemekler", "Başlangıçlar", "Tatlılar", "İçecekler"],
        extractedItems: menuItems.slice(0, 5),
      },
    },
    extractedText: testMenuText.slice(0, 500),
    textLength: testMenuText.length,
    timestamp: new Date().toISOString(),
  },
  processingTime: "5ms",
};

console.log("\nExpected API Response:");
console.log(JSON.stringify(response, null, 2));
