import pool from "../config/db";

const brands = [
  "Samsung", "Apple", "Xiaomi", "OnePlus", "Oppo", "Vivo", "Realme", 
  "Tecno", "Infinix", "Nokia", "Motorola", "Google", "Huawei", "Nothing"
];

const cities = [
  "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar", "Quetta", 
  "Multan", "Faisalabad", "Abbottabad", "Sialkot", "Gujranwala", 
  "Hyderabad", "Sukkur", "Mardan"
];

async function seed() {
  console.log("🌱 Starting seeding...");

  try {
    // Seed Brands
    console.log("Inserting brands...");
    for (const brand of brands) {
      await pool.execute("INSERT IGNORE INTO brands (name) VALUES (?)", [brand]);
    }

    // Seed Cities
    console.log("Inserting cities...");
    for (const city of cities) {
      await pool.execute("INSERT IGNORE INTO cities (name) VALUES (?)", [city]);
    }

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seed();
