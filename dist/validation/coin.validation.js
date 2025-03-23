"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCoinSchema = void 0;
const zod_1 = require("zod");
// URL validation regex
const urlSchema = zod_1.z
    .string()
    .url("Please provide a valid URL starting with http or https.")
    .optional();
exports.createCoinSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Token name is required").max(40),
    symbol: zod_1.z.string().min(1, "Token symbol is required").max(40),
    slug: zod_1.z.string(),
    description: zod_1.z
        .string()
        .min(25, "Description must be at least 25 characters long.")
        .max(2000, "Description must be at most 2000 characters long."),
    logo: zod_1.z.string().min(1, "Please upload a token logo."),
    croppedLogo: zod_1.z.string().min(1, "Please upload a cropped token logo."),
    categories: zod_1.z
        .array(zod_1.z.string())
        .min(1, "You must select at least one category."),
    socials: zod_1.z.object({
        website: urlSchema,
        telegram: urlSchema,
        x: urlSchema,
        discord: urlSchema,
        youtube: urlSchema,
        whitepaper: urlSchema,
    }),
    chain: zod_1.z.string().min(1, "You need to choose the chain."),
    dexProvider: zod_1.z.string().min(1, "You need to choose the DEX provider."),
    presale: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        link: urlSchema,
        softcap: zod_1.z
            .number()
            .min(0, "Softcap must be greater than or equal to 0.")
            .optional(),
        hardcap: zod_1.z
            .number()
            .min(0, "Hardcap must be greater than or equal to 0.")
            .optional(),
        coin: zod_1.z.string().default("usdt"),
        timeStart: zod_1.z.number().nullable().optional(),
        timeEnd: zod_1.z.number().nullable().optional(),
    }),
    fairlaunch: zod_1.z.object({
        enabled: zod_1.z.boolean().default(false),
        link: urlSchema,
    }),
    audit: zod_1.z.object({
        exist: zod_1.z.boolean().default(false),
        auditId: zod_1.z.string().default(""),
    }),
    kyc: zod_1.z.object({
        exist: zod_1.z.boolean().default(false),
        kycId: zod_1.z.string().default(""),
    }),
    author: zod_1.z.string().min(1, "Author ID is required"),
    address: zod_1.z
        .string()
        .max(90, "Contract address must be at most 90 characters.")
        .optional(),
    launchDate: zod_1.z.number().nullable().optional(),
    votes: zod_1.z.number().default(0),
    price: zod_1.z.number().default(0),
    mkap: zod_1.z.number().default(0),
    price24h: zod_1.z.number().default(0),
    premium: zod_1.z.boolean().default(false),
    promoted: zod_1.z.boolean().default(false),
});
