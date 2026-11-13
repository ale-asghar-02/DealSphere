/**
 * Design Studio ke plans (free / monthly / yearly) DB mein daalta hai ya update karta hai.
 *
 * Chalane ka tareeqa (project ke root se):
 *   node src/scripts/seedDesignPlans.js            -> plans save karta hai
 *   node src/scripts/seedDesignPlans.js --dry-run  -> sirf dikhata hai ke kya badlega, kuch save nahi karta
 *
 * Plans ki asal values designConfig.js ke DEFAULT_PLANS se aati hain. Price ya limits badalni hon to
 * wahan badal kar ye script dobara chala dein. Discount (discountPercentage / discountValidUntil)
 * ko ye script kabhi nahi chhuta, wo admin ka set kiya hua rehta hai.
 */
const mongoose = require("mongoose");
const config = require("../configs/config");
const { DesignPlan, DesignUsage, DesignSession } = require("../models/designModel");
const { DEFAULT_PLANS } = require("../configs/designConfig");

const FIELDS = ["price", "durationInDays", "dailyLimit", "monthlyLimit", "editsPerDesign", "watermark"];

const show = (v) => (v === null || v === undefined ? "none" : String(v));

const seed = async ({ dryRun = false } = {}) => {
  const report = [];

  for (const plan of Object.values(DEFAULT_PLANS)) {
    const { name, ...fields } = plan;
    const existing = await DesignPlan.findOne({ name }).lean();

    const changes = FIELDS.filter((f) => !existing || show(existing[f]) !== show(fields[f])).map(
      (f) => `${f}: ${existing ? show(existing[f]) : "-"} -> ${show(fields[f])}`
    );
    if (existing && existing.isActive === false) changes.push("isActive: false -> true");

    if (!dryRun) {
      await DesignPlan.updateOne(
        { name },
        {
          $set: { ...fields, isActive: true },
          // Discount sirf pehli baar 0 hota hai; baad mein admin ki value salamat rehti hai
          $setOnInsert: { discountPercentage: 0, discountValidUntil: null },
        },
        { upsert: true }
      );
    }

    report.push({ name, action: !existing ? "created" : changes.length ? "updated" : "unchanged", changes });
  }

  return report;
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");

  await mongoose.connect(config.MONGO_URI);

  // Unique aur TTL indexes pehle se bana lete hain (atomic quota inhi par khara hai)
  if (!dryRun) await Promise.all([DesignPlan.init(), DesignUsage.init(), DesignSession.init()]);

  const report = await seed({ dryRun });

  console.log(dryRun ? "Design plans (dry run, nothing saved):" : "Design plans:");
  report.forEach((r) => {
    console.log(`  - ${r.name}: ${r.action}`);
    r.changes.forEach((c) => console.log(`      ${c}`));
  });

  await mongoose.disconnect();
};

if (require.main === module) {
  main().catch(async (err) => {
    console.error("Seeding failed:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = { seed };