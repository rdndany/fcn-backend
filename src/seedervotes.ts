import mongoose from "mongoose";
import dotenv from "dotenv";
import { faker } from "@faker-js/faker";
import CoinModel, { CoinDocument } from "./models/coin.model";
import VoteModel, { VoteDocument } from "./models/vote.model";

// Load environment variables from .env file
dotenv.config();

const seedVotes = async () => {
  try {
    // Connect to MongoDB using URI from environment variable
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("✅ Connected to MongoDB");

    // Clear existing data from the Vote model
    await VoteModel.deleteMany({});
    console.log("🗑️ Existing votes deleted");

    // Fetch all coins from the Coin collection to get random coin_ids
    const coins: CoinDocument[] = await CoinModel.find({});
    if (coins.length === 0) {
      throw new Error("No coins found to seed votes");
    }

    const totalVotes = 0; // Total number of votes to seed
    const batchSize = 0; // Number of votes to insert in each batch

    // Loop to generate and insert votes in batches
    for (let i = 0; i < totalVotes; i += batchSize) {
      const votes = Array.from({ length: batchSize }).map(() => {
        // Randomly select a coin from the coins list
        const coin = faker.helpers.arrayElement(coins);

        // Generate a random IP address
        const ip_address = faker.internet.ip();

        // Generate a random date between the start of this year and the current date
        const startOfYear = new Date(new Date().getFullYear(), 0, 1); // January 1st of this year
        const randomDate = faker.date.between({
          from: startOfYear,
          to: new Date(),
        });
        // Prepare the vote object (creating a Mongoose document using `new`)
        const vote = new VoteModel({
          coin_id: coin._id, // Reference to the selected coin's ObjectId
          ip_address: ip_address, // Random IP
          organic: true, // Always set as true
          created_at: randomDate, // Random created_at within this year
        });

        return vote;
      });

      // Insert the votes in batches
      await VoteModel.insertMany(votes);
      console.log(
        `🚀 Batch ${
          Math.floor(i / batchSize) + 1
        } of votes seeded successfully!`
      );
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error seeding votes:", error);
    process.exit(1); // Exit the process if there's an error
  }
};

// Execute the seeding
seedVotes();
