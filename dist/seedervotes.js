"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const faker_1 = require("@faker-js/faker");
const coin_model_1 = __importDefault(require("./models/coin.model"));
const vote_model_1 = __importDefault(require("./models/vote.model"));
// Load environment variables from .env file
dotenv_1.default.config();
const seedVotes = async () => {
    try {
        // Connect to MongoDB using URI from environment variable
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        // Clear existing data from the Vote model
        await vote_model_1.default.deleteMany({});
        console.log("🗑️ Existing votes deleted");
        // Fetch all coins from the Coin collection to get random coin_ids
        const coins = await coin_model_1.default.find({});
        if (coins.length === 0) {
            throw new Error("No coins found to seed votes");
        }
        const totalVotes = 0; // Total number of votes to seed
        const batchSize = 0; // Number of votes to insert in each batch
        // Loop to generate and insert votes in batches
        for (let i = 0; i < totalVotes; i += batchSize) {
            const votes = Array.from({ length: batchSize }).map(() => {
                // Randomly select a coin from the coins list
                const coin = faker_1.faker.helpers.arrayElement(coins);
                // Generate a random IP address
                const ip_address = faker_1.faker.internet.ip();
                // Generate a random date between the start of this year and the current date
                const startOfYear = new Date(new Date().getFullYear(), 0, 1); // January 1st of this year
                const randomDate = faker_1.faker.date.between({
                    from: startOfYear,
                    to: new Date(),
                });
                // Prepare the vote object (creating a Mongoose document using `new`)
                const vote = new vote_model_1.default({
                    coin_id: coin._id, // Reference to the selected coin's ObjectId
                    ip_address: ip_address, // Random IP
                    organic: true, // Always set as true
                    created_at: randomDate, // Random created_at within this year
                });
                return vote;
            });
            // Insert the votes in batches
            await vote_model_1.default.insertMany(votes);
            console.log(`🚀 Batch ${Math.floor(i / batchSize) + 1} of votes seeded successfully!`);
        }
        // Disconnect from MongoDB
        await mongoose_1.default.disconnect();
        console.log("🔌 Database connection closed");
    }
    catch (error) {
        console.error("❌ Error seeding votes:", error);
        process.exit(1); // Exit the process if there's an error
    }
};
// Execute the seeding
seedVotes();
