const mongoose = require("mongoose");
const slugify = require("slugify");
require("dotenv").config();

const Category = require("../models/categoryModel");

const parentCategories = [
  { name: "Mobiles", icon: "IconDeviceMobile" },
  { name: "Vehicles", icon: "IconCar" },
  { name: "Property", icon: "IconHome" },
  { name: "Electronics & Appliances", icon: "IconDeviceTv" },
  { name: "Furniture & Home Decor", icon: "IconSofa" },
  { name: "Fashion & Beauty", icon: "IconShirt" },
  { name: "Books, Sports & Hobbies", icon: "IconBallFootball" },
  { name: "Kids & Baby Items", icon: "IconBabyCarriage" },
  { name: "Business & Industrial", icon: "IconBuildingFactory2" },
  { name: "Health & Fitness", icon: "IconHeartbeat" },
  { name: "Services", icon: "IconTool" },
  { name: "Jobs", icon: "IconBriefcase" },
  { name: "Animals & Pets", icon: "IconPaw" },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI); // apna env var name check kar lena

    for (const cat of parentCategories) {
      const exists = await Category.findOne({ name: cat.name, parent: null });
      if (exists) {
        console.log(`Skip (already exists): ${cat.name}`);
        continue;
      }

      await Category.create({
        name: cat.name,
        slug: slugify(cat.name, { lower: true, strict: true }),
        icon: cat.icon,
        parent: null,
      });

      console.log(`Created: ${cat.name}`);
    }

    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();