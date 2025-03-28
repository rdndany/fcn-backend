import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import CoinModel, { CoinDocument } from "./models/coin.model";
import VoteModel, { VoteDocument } from "./models/vote.model";

// Load environment variables
dotenv.config();

const seedVotesAndUpdateCounts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ Connected to MongoDB");

    // 1. DELETE ALL EXISTING VOTES
    await VoteModel.deleteMany({});
    console.log("🗑️ All existing votes deleted");

    // 2. RESET ALL COINS' VOTE COUNTS TO 0
    await CoinModel.updateMany(
      {},
      {
        $set: {
          votes: 0,
          todayVotes: 0,
        },
      }
    );
    console.log("🔄 Reset all coins' vote counts to 0");

    // 3. SEED NEW VOTES (using your working approach)
    const coins: CoinDocument[] = await CoinModel.find({});
    if (coins.length === 0) {
      throw new Error("No coins found to seed votes");
    }

    const totalVotes = 50000;
    const batchSize = 5000;

    for (let i = 0; i < totalVotes; i += batchSize) {
      const votes = Array.from({ length: batchSize }).map(() => {
        const coin = faker.helpers.arrayElement(coins);
        const ip_address = faker.internet.ip();

        // Pure UTC date handling
        const nowUTC = new Date();
        const sevenDaysAgoUTC = new Date(
          Date.UTC(
            nowUTC.getUTCFullYear(),
            nowUTC.getUTCMonth(),
            nowUTC.getUTCDate() - 2,
            0,
            0,
            0,
            0
          )
        );

        // Ensure faker uses UTC
        const randomDate = new Date(
          faker.date
            .between({
              from: sevenDaysAgoUTC,
              to: nowUTC,
            })
            .toISOString()
        ); // Convert to ISO string and back to ensure UTC

        return new VoteModel({
          coin_id: coin._id,
          ip_address: ip_address,
          organic: true,
          created_at: randomDate,
        });
      });

      await VoteModel.insertMany(votes);
      console.log(`🚀 Batch ${Math.floor(i / batchSize) + 1} seeded`);
    }

    // 4. UPDATE VOTE COUNTS FOR EACH COIN
    console.log("🔄 Updating vote counts for coins...");

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    for (const coin of coins) {
      const totalVotes = await VoteModel.countDocuments({
        coin_id: coin._id,
      });

      const todayVotes = await VoteModel.countDocuments({
        coin_id: coin._id,
        created_at: { $gte: todayStart },
      });

      await CoinModel.updateOne(
        { _id: coin._id },
        {
          $set: {
            votes: totalVotes,
            todayVotes: todayVotes,
          },
        }
      );

      console.log(
        `🪙 Updated ${coin.name}: ${totalVotes} total, ${todayVotes} today`
      );
    }

    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedVotesAndUpdateCounts();
