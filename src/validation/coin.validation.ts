import { z } from "zod";

// URL validation regex
const urlSchema = z
  .string()
  .url("Please provide a valid URL starting with http or https.")
  .optional();

export const createCoinSchema = z.object({
  name: z.string().min(1, "Token name is required").max(40),
  symbol: z.string().min(1, "Token symbol is required").max(40),
  slug: z.string(),
  description: z
    .string()
    .min(25, "Description must be at least 25 characters long.")
    .max(2000, "Description must be at most 2000 characters long."),
  logo: z.string().min(1, "Please upload a token logo."),
  croppedLogo: z.string().min(1, "Please upload a cropped token logo."),
  categories: z
    .array(z.string())
    .min(1, "You must select at least one category."),

  socials: z.object({
    website: urlSchema,
    telegram: urlSchema,
    x: urlSchema,
    discord: urlSchema,
    youtube: urlSchema,
    whitepaper: urlSchema,
  }),

  chain: z.string().min(1, "You need to choose the chain."),
  dexProvider: z.string().min(1, "You need to choose the DEX provider."),

  presale: z.object({
    enabled: z.boolean().default(false),
    link: urlSchema,
    softcap: z
      .number()
      .min(0, "Softcap must be greater than or equal to 0.")
      .optional(),
    hardcap: z
      .number()
      .min(0, "Hardcap must be greater than or equal to 0.")
      .optional(),
    coin: z.string().default("usdt"),
    timeStart: z.number().nullable().optional(),
    timeEnd: z.number().nullable().optional(),
  }),

  fairlaunch: z.object({
    enabled: z.boolean().default(false),
    link: urlSchema,
  }),
  audit: z.object({
    exist: z.boolean().default(false),
    auditId: z.string().default(""),
  }),

  kyc: z.object({
    exist: z.boolean().default(false),
    kycId: z.string().default(""),
  }),

  author: z.string().min(1, "Author ID is required"),
  address: z
    .string()
    .max(90, "Contract address must be at most 90 characters.")
    .optional(),

  launchDate: z.number().nullable().optional(),
  votes: z.number().default(0),
  price: z.number().default(0),
  mkap: z.number().default(0),
  price24h: z.number().default(0),
  premium: z.boolean().default(false),
  promoted: z.boolean().default(false),
});

// TypeScript Type
export type CoinSchemaType = z.infer<typeof createCoinSchema>;
