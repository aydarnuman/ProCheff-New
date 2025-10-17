/**
 * ProCheff Reasoning Engine Test
 * 🧪 Cognitive engine'i test et
 */

import { runReasoning } from "@/lib/reasoning/core/engine";

// Test verileri
const menu = {
  macroBalance: {
    protein: 14, // Düşük protein
    fat: 18,
    carb: 68, // Yüksek karbonhidrat
  },
  warnings: ["Protein oranı düşük"],
  menuType: "15 Günlük",
  totalItems: 40,
};

const offer = {
  kThreshold: 0.93,
  detail: {
    material: 35,
    labor: 4.5,
    overhead: 2.5,
    profit: 2.5, // Düşük kar
  },
  totalCost: 45,
  offerPrice: 48,
  belowThreshold: false, // Eşik aşıldı
};

console.log("🧠 ProCheff Reasoning Engine Test\n");
console.log("📊 Test Verileri:");
console.log("Menu:", JSON.stringify(menu, null, 2));
console.log("Offer:", JSON.stringify(offer, null, 2));

console.log("\n🔍 Reasoning Sonuçları:");
const result = runReasoning(menu, offer);
console.log(JSON.stringify(result, null, 2));

console.log("\n📈 Beklenen Sonuçlar:");
console.log("- Risks: Düşük protein, yüksek karb, düşük kar");
console.log("- Score: ~70 (risk penalty'ler nedeniyle)");
console.log("- Compliance: KİK uyumlu ancak eşik aşıldı uyarısı");
