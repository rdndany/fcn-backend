"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const faker_1 = require("@faker-js/faker");
const coin_model_1 = __importDefault(require("./models/coin.model"));
const user_model_1 = __importDefault(require("./models/user.model"));
dotenv_1.default.config(); // Load environment variables
const seedCoins = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");
        // Exclude specific coin IDs from deletion
        const excludedCoinIds = ["67da191e6c742ca65bdf9da0"];
        // Clear existing coins except the ones we want to exclude
        yield coin_model_1.default.deleteMany({
            _id: {
                $nin: excludedCoinIds.map((id) => new mongoose_1.default.Types.ObjectId(id).toString()),
            }, // Convert each ID to ObjectId and then to string
        });
        console.log("🗑️ Existing coins (except excluded ones) deleted");
        //Fetch the entire user document
        const author = yield user_model_1.default.findById("user_2uW7bvjpqchkKmt7h3WdBtx3rS0");
        if (!author) {
            throw new Error("Author not found!");
        }
        // Generate and insert 100 coins in batches of 10
        const totalCoins = 0;
        const batchSize = 0;
        // Loop to generate and insert coins in batches of 10
        for (let i = 0; i < totalCoins; i += batchSize) {
            const coins = Array.from({ length: batchSize }).map(() => {
                const name = faker_1.faker.finance.currencyName().slice(0, 40); // Ensure the coin name is max 40 characters
                const slug = name
                    .toLowerCase() // Convert to lowercase
                    .replace(/\s+/g, "-") // Replace spaces with hyphens
                    .replace(/[^\w\-]+/g, ""); // Remove special characters (except hyphens)
                // Decide whether price should exist (i.e. coin is launched or in presale/fairlaunch)
                const priceExists = faker_1.faker.datatype.boolean();
                let presaleEnabled = false;
                let fairlaunchEnabled = false;
                // If the coin is not launched, randomly assign either presale or fairlaunch to be enabled, but not both
                if (!priceExists) {
                    const randomChoice = faker_1.faker.datatype.boolean();
                    presaleEnabled = randomChoice;
                    fairlaunchEnabled = !randomChoice; // Ensure only one is true
                }
                const launchDate = priceExists
                    ? faker_1.faker.date.past().getTime()
                    : faker_1.faker.date.future().getTime(); // If price exists, launchDate should be in the past
                return {
                    name: name,
                    symbol: faker_1.faker.finance.currencyCode(),
                    slug: slug,
                    description: faker_1.faker.lorem.sentences(3),
                    logo: "https://www.coditt.com/images/LogoPlaceholder.png",
                    croppedLogo: "https://www.coditt.com/images/LogoPlaceholder.png",
                    categories: faker_1.faker.helpers.arrayElements(["DeFi", "Gaming", "NFT", "Metaverse"], 2),
                    socials: {
                        website: faker_1.faker.internet.url(),
                        telegram: faker_1.faker.internet.url(),
                        x: faker_1.faker.internet.url(),
                        discord: faker_1.faker.internet.url(),
                        youtube: faker_1.faker.internet.url(),
                        whitepaper: faker_1.faker.internet.url(),
                    },
                    chain: faker_1.faker.helpers.arrayElement([
                        "eth",
                        "bnb",
                        "sol",
                        "matic",
                        "trx",
                    ]),
                    dexProvider: faker_1.faker.helpers.arrayElement([
                        "Uniswap",
                        "PancakeSwap",
                        "SushiSwap",
                    ]),
                    presale: {
                        enabled: presaleEnabled,
                        link: presaleEnabled ? faker_1.faker.internet.url() : null, // Set to null if not enabled
                        softcap: presaleEnabled
                            ? faker_1.faker.number.float({ min: 10000, max: 500000 })
                            : null,
                        hardcap: presaleEnabled
                            ? faker_1.faker.number.float({ min: 500000, max: 1000000 })
                            : null,
                        coin: faker_1.faker.helpers.arrayElement(["usdt", "eth", "bnb"]),
                        timeStart: presaleEnabled ? faker_1.faker.date.future().getTime() : null,
                        timeEnd: presaleEnabled ? faker_1.faker.date.future().getTime() : null,
                    },
                    fairlaunch: {
                        enabled: fairlaunchEnabled,
                        link: fairlaunchEnabled ? faker_1.faker.internet.url() : null, // Set to null if not enabled
                    },
                    address: "",
                    audit: {
                        exist: false,
                        auditId: "",
                    },
                    kyc: {
                        exist: false,
                        kycId: "",
                    },
                    author: author,
                    launchDate: launchDate,
                    price: priceExists
                        ? faker_1.faker.number.float({ min: 0.00000000001, max: 0.0001 })
                        : 0, // If there's price, set it, otherwise set it to 0
                    mkap: priceExists
                        ? faker_1.faker.number.float({ min: 10000, max: 500000 })
                        : 0,
                    price24h: priceExists
                        ? faker_1.faker.number.float({ min: -90, max: 120 })
                        : 0,
                    premium: faker_1.faker.datatype.boolean(),
                    promoted: false,
                    votes: Math.floor(faker_1.faker.number.float({ min: 150, max: 2500 })),
                    todayVotes: Math.floor(faker_1.faker.number.float({ min: 1, max: 5 })),
                };
            });
            // Insert the current batch of 10 coins
            yield coin_model_1.default.insertMany(coins);
            console.log(`🚀 Batch ${Math.floor(i / batchSize) + 1} of coins seeded successfully!`);
            // You can add a delay between batches if needed, for example, using `setTimeout`
            // await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay between batches
        }
        // Disconnect
        yield mongoose_1.default.disconnect();
        console.log("🔌 Database connection closed");
    }
    catch (error) {
        console.error("❌ Error seeding database:", error);
        process.exit(1);
    }
});
// Execute seeding
seedCoins();
