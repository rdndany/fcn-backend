"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const coin_model_1 = __importDefault(require("./models/coin.model"));
dotenv_1.default.config(); // Load environment variables
const seedCoins = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        // Exclude specific coin IDs from deletion
        const excludedCoinIds = [
            "67d3e109d81c7a4de6ad5d75",
            "67d3c7fbb1cb04d257dda2bc",
            "67d4e1106a818aaba17e4838",
            "67d3b53b315021a27076c816",
            "67d3b771852c8542785cb0d7",
            "67d3e58553e54f8800960f9b",
            "67d3e62d53e54f8800960fe4",
            "67d3e94858555fc644da9b84",
            "67d3e98e58555fc644da9b94",
            "67d428168aec4b9d3718f6b7",
            "67d46ce01b1856ce4c167649",
            "67d3e1edd81c7a4de6ad5dad",
            "67d3e43f818f535669ef6f85",
            "67d3eade58555fc644da9ba4",
            "67d3eb96dbff3a5cf4513a6f",
            "67d3f0f8f3c8f070fa00fb5a",
            "67d41d8f63c64f5438f1de6d",
            "67d41e2863c64f5438f1de88",
            "67d41eaf63c64f5438f1de98",
            "67d41f0f63c64f5438f1dec0",
            "67d46a3984da5a97c5b2f9fc",
            "67d46be71b1856ce4c167596",
            "67d4b34b9ec2f6055937084e",
            "67d4b5571c7e07d9426414b9",
            "67d4b6d01c7e07d942641563",
            "67d4b72f1c7e07d942641573",
            "67d4e17c6a818aaba17e4886",
            "67d56d26c01b6b58428edd43",
        ];
        // Clear existing coins except the ones we want to exclude
        await coin_model_1.default.deleteMany({
            _id: {
                $nin: excludedCoinIds.map((id) => new mongoose_1.default.Types.ObjectId(id).toString()),
            }, // Convert each ID to ObjectId and then to string
        });
        console.log("🗑️ Existing coins (except excluded ones) deleted");
        // Fetch the entire user document
        // const author = await UserModel.findById("user_2ty0xuA9LYlgq7DG7YglGCidWY1");
        // if (!author) {
        //   throw new Error("Author not found!");
        // }
        // // Generate and insert 100 coins in batches of 10
        // const totalCoins = 25000;
        // const batchSize = 250;
        // // Loop to generate and insert coins in batches of 10
        // for (let i = 0; i < totalCoins; i += batchSize) {
        //   const coins = Array.from({ length: batchSize }).map(() => {
        //     const name = faker.finance.currencyName().slice(0, 40); // Ensure the coin name is max 40 characters
        //     const slug = name
        //       .toLowerCase() // Convert to lowercase
        //       .replace(/\s+/g, "-") // Replace spaces with hyphens
        //       .replace(/[^\w\-]+/g, ""); // Remove special characters (except hyphens)
        //     // Decide whether price should exist (i.e. coin is launched or in presale/fairlaunch)
        //     const priceExists = faker.datatype.boolean();
        //     let presaleEnabled = false;
        //     let fairlaunchEnabled = false;
        //     // If the coin is not launched, randomly assign either presale or fairlaunch to be enabled, but not both
        //     if (!priceExists) {
        //       const randomChoice = faker.datatype.boolean();
        //       presaleEnabled = randomChoice;
        //       fairlaunchEnabled = !randomChoice; // Ensure only one is true
        //     }
        //     const launchDate = priceExists
        //       ? faker.date.past().getTime()
        //       : faker.date.future().getTime(); // If price exists, launchDate should be in the past
        //     return {
        //       name: name,
        //       symbol: faker.finance.currencyCode(),
        //       slug: slug,
        //       description: faker.lorem.sentences(3),
        //       logo: "https://www.coditt.com/images/LogoPlaceholder.png",
        //       croppedLogo: "https://www.coditt.com/images/LogoPlaceholder.png",
        //       categories: faker.helpers.arrayElements(
        //         ["DeFi", "Gaming", "NFT", "Metaverse"],
        //         2
        //       ),
        //       socials: {
        //         website: faker.internet.url(),
        //         telegram: faker.internet.url(),
        //         x: faker.internet.url(),
        //         discord: faker.internet.url(),
        //         youtube: faker.internet.url(),
        //         whitepaper: faker.internet.url(),
        //       },
        //       chain: faker.helpers.arrayElement([
        //         "eth",
        //         "bnb",
        //         "sol",
        //         "matic",
        //         "trx",
        //       ]),
        //       dexProvider: faker.helpers.arrayElement([
        //         "Uniswap",
        //         "PancakeSwap",
        //         "SushiSwap",
        //       ]),
        //       presale: {
        //         enabled: presaleEnabled,
        //         link: presaleEnabled ? faker.internet.url() : null, // Set to null if not enabled
        //         softcap: presaleEnabled
        //           ? faker.number.float({ min: 10000, max: 500000 })
        //           : null,
        //         hardcap: presaleEnabled
        //           ? faker.number.float({ min: 500000, max: 1000000 })
        //           : null,
        //         coin: faker.helpers.arrayElement(["usdt", "eth", "bnb"]),
        //         timeStart: presaleEnabled ? faker.date.future().getTime() : null,
        //         timeEnd: presaleEnabled ? faker.date.future().getTime() : null,
        //       },
        //       fairlaunch: {
        //         enabled: fairlaunchEnabled,
        //         link: fairlaunchEnabled ? faker.internet.url() : null, // Set to null if not enabled
        //       },
        //       address: faker.finance.ethereumAddress(),
        //       audit: {
        //         exist: false,
        //         auditId: "",
        //       },
        //       kyc: {
        //         exist: false,
        //         kycId: "",
        //       },
        //       author: author,
        //       launchDate: launchDate,
        //       price: priceExists
        //         ? faker.number.float({ min: 0.00000000001, max: 0.0001 })
        //         : 0, // If there's price, set it, otherwise set it to 0
        //       mkap: priceExists
        //         ? faker.number.float({ min: 10000, max: 500000 })
        //         : 0,
        //       price24h: priceExists
        //         ? faker.number.float({ min: -90, max: 120 })
        //         : 0,
        //       premium: faker.datatype.boolean(),
        //       promoted: false,
        //       votes: Math.floor(faker.number.float({ min: 150, max: 2500 })),
        //       todayVotes: Math.floor(faker.number.float({ min: 1, max: 5 })),
        //     };
        //   });
        //   // Insert the current batch of 10 coins
        //   await CoinModel.insertMany(coins);
        //   console.log(
        //     `🚀 Batch ${
        //       Math.floor(i / batchSize) + 1
        //     } of coins seeded successfully!`
        //   );
        //   // You can add a delay between batches if needed, for example, using `setTimeout`
        //   // await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay between batches
        // }
        // Disconnect
        await mongoose_1.default.disconnect();
        console.log("🔌 Database connection closed");
    }
    catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
};
// Execute seeding
seedCoins();
