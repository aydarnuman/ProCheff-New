const { PrismaClient } = require("./src/generated/prisma");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function seedData() {
  try {
    let admin = await prisma.user.findUnique({
      where: { email: "admin@procheff.com" },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      admin = await prisma.user.create({
        data: {
          email: "admin@procheff.com",
          name: "ProCheff Admin",
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log("Admin user created:", admin.id);
    }

    let restaurant = await prisma.restaurant.findFirst();
    if (!restaurant) {
      restaurant = await prisma.restaurant.create({
        data: {
          name: "Demo Restaurant",
          description: "Demo restaurant for testing",
          cuisine: "Turkish",
          address: "İstanbul, Türkiye",
          ownerId: admin.id,
        },
      });
      console.log("Restaurant created:", restaurant.id);
    }

    console.log("Ready! Admin ID:", admin.id, "Restaurant ID:", restaurant.id);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
