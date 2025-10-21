/**
 * ProCheff Database Seed Script
 * Test verileri ve demo kullanıcıları oluşturur
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.tenderBid.deleteMany();
  await prisma.tender.deleteMany();
  await prisma.offerItem.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.menuAnalysis.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing data");

  // Create users
  const hashedPassword = await bcrypt.hash("123456", 12);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@procheff.com",
      password: hashedPassword,
      name: "ProCheff Admin",
      role: "ADMIN",
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@example.com",
      password: hashedPassword,
      name: "Demo Restaurant Owner",
      role: "CLIENT",
    },
  });

  const supplierUser = await prisma.user.create({
    data: {
      email: "supplier@example.com",
      password: hashedPassword,
      name: "Demo Supplier",
      role: "SUPPLIER",
    },
  });

  console.log("👥 Created users");

  // Create demo restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Demo Restaurant",
      description: "Modern Türk mutfağı restoranı",
      cuisine: "Turkish",
      address: "İstanbul, Türkiye",
      phone: "+90 212 123 4567",
      email: "info@demorestaurant.com",
      ownerId: clientUser.id,
      averageCheckAmount: 85.5,
      monthlyRevenue: 125000,
      customerCount: 1200,
    },
  });

  console.log("🏪 Created restaurant");

  // Create demo menu
  const menu = await prisma.menu.create({
    data: {
      name: "Ana Menü",
      description: "Restoranımızın ana yemek menüsü",
      type: "MAIN",
      restaurantId: restaurant.id,
      rawText: `
Ana Yemekler
- Izgara Köfte - 35 TL
- Tavuk Şiş - 42 TL  
- Karides Güveç - 68 TL
- Kuzu Pirzola - 85 TL

Çorbalar
- Mercimek Çorbası - 18 TL
- Tavuk Suyu Çorbası - 20 TL

Salatalar
- Mevsim Salata - 25 TL
- Çoban Salata - 22 TL
      `,
      nutritionScore: 78.5,
      costScore: 82.0,
      riskScore: 15.2,
    },
  });

  // Create menu items
  const menuItems = [
    {
      name: "Izgara Köfte",
      price: 35,
      category: "Ana Yemek",
      calories: 420,
      protein: 28,
      carbs: 12,
      fat: 18,
    },
    {
      name: "Tavuk Şiş",
      price: 42,
      category: "Ana Yemek",
      calories: 380,
      protein: 35,
      carbs: 8,
      fat: 15,
    },
    {
      name: "Karides Güveç",
      price: 68,
      category: "Ana Yemek",
      calories: 320,
      protein: 25,
      carbs: 15,
      fat: 12,
    },
    {
      name: "Kuzu Pirzola",
      price: 85,
      category: "Ana Yemek",
      calories: 520,
      protein: 42,
      carbs: 5,
      fat: 28,
    },
    {
      name: "Mercimek Çorbası",
      price: 18,
      category: "Çorba",
      calories: 180,
      protein: 12,
      carbs: 28,
      fat: 3,
    },
    {
      name: "Tavuk Suyu Çorbası",
      price: 20,
      category: "Çorba",
      calories: 120,
      protein: 8,
      carbs: 15,
      fat: 2,
    },
    {
      name: "Mevsim Salata",
      price: 25,
      category: "Salata",
      calories: 95,
      protein: 3,
      carbs: 18,
      fat: 2,
    },
    {
      name: "Çoban Salata",
      price: 22,
      category: "Salata",
      calories: 110,
      protein: 4,
      carbs: 20,
      fat: 3,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        ...item,
        menuId: menu.id,
        materialCost: item.price * 0.35, // %35 malzeme maliyeti
        laborCost: item.price * 0.25, // %25 işçilik maliyeti
      },
    });
  }

  console.log("📋 Created menu and items");

  // Create demo offer
  const offer = await prisma.offer.create({
    data: {
      title: "Restoran Menü Optimizasyonu",
      description: "AI destekli menü analizi ve maliyet optimizasyonu hizmeti",
      clientId: clientUser.id,
      restaurantId: restaurant.id,
      totalCost: 15000,
      materialCost: 5000,
      laborCost: 8000,
      overheadCost: 2000,
      profitMargin: 0.25,
      estimatedRevenue: 18750,
      status: "PENDING",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      tags: JSON.stringify(["menu-analysis", "cost-optimization", "ai"]),
      priority: "HIGH",
    },
  });

  // Create offer items
  const offerItems = [
    {
      name: "Menü Analizi",
      description: "AI ile beslenme ve maliyet analizi",
      quantity: 1,
      unitCost: 5000,
    },
    {
      name: "Optimizasyon Raporu",
      description: "Detaylı öneriler ve iyileştirmeler",
      quantity: 1,
      unitCost: 4000,
    },
    {
      name: "Uygulama Desteği",
      description: "3 aylık implementasyon desteği",
      quantity: 1,
      unitCost: 3000,
    },
    {
      name: "Personel Eğitimi",
      description: "Yeni süreçler için personel eğitimi",
      quantity: 1,
      unitCost: 3000,
    },
  ];

  for (const item of offerItems) {
    await prisma.offerItem.create({
      data: {
        ...item,
        offerId: offer.id,
        totalCost: item.unitCost * item.quantity,
        category: "consulting",
      },
    });
  }

  console.log("💼 Created offer");

  // Create demo tender
  const tender = await prisma.tender.create({
    data: {
      title: "Yeni Restoran Konsepti Geliştirme",
      description:
        "Modern fast-casual restoran konsepti için kapsamlı menü ve operasyon danışmanlığı",
      restaurantId: restaurant.id,
      budget: 50000,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      requirements: JSON.stringify({
        scope: ["Menu Development", "Cost Analysis", "Operational Setup"],
        timeline: "45 days",
        deliverables: ["Complete Menu", "Cost Structure", "Training Materials"],
        experience: "Minimum 2 years restaurant consulting",
      }),
      status: "OPEN",
      publishedAt: new Date(),
    },
  });

  console.log("📊 Created tender");

  // Create API keys
  await prisma.apiKey.create({
    data: {
      userId: adminUser.id,
      name: "Admin API Key",
      key: "procheff_admin_key_" + Math.random().toString(36).substr(2, 20),
      permissions: JSON.stringify(["*"]),
      rateLimit: 10000,
    },
  });

  await prisma.apiKey.create({
    data: {
      userId: clientUser.id,
      name: "Client API Key",
      key: "procheff_client_key_" + Math.random().toString(36).substr(2, 20),
      permissions: JSON.stringify(["restaurant:*", "menu:*", "offer:read"]),
      rateLimit: 1000,
    },
  });

  console.log("🔑 Created API keys");

  console.log("✅ Seeding completed successfully!");
  console.log("");
  console.log("Demo Users:");
  console.log("  Admin: admin@procheff.com / 123456");
  console.log("  Client: client@example.com / 123456");
  console.log("  Supplier: supplier@example.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
