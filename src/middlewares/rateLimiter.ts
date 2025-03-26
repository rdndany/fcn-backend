// import rateLimit from "express-rate-limit";
// import RedisStore from "rate-limit-redis";
// import { redisClient } from "../config/redis.config";

// import { NextFunction, Request, Response } from "express";
// import { redisClient } from "../config/redis.config";

// // Define the RedisStore with correctly typed `sendCommand`
// export const rateLimiter = rateLimit({
//   store: new RedisStore({
//     sendCommand: async (...args: [string, ...any[]]): Promise<any> => {
//       // Make sure the call returns a Redis reply of any type
//       return redisClient.call(...args); // Redis command can return various types
//     },
//   }),
//   windowMs: 60 * 1000, // 1 minute window
//   max: 10, // Limit each IP to 10 requests per windowMs
//   message: "Too many requests, please try again later.", // Default message
//   standardHeaders: true, // Send rate limit info in headers
//   legacyHeaders: false, // Disable X-RateLimit-* headers

//   // Custom handler to send response when rate limit is exceeded
//   handler: (req, res) => {
//     res.status(429).json({
//       success: false,
//       message: "Too many requests, please try again later.",
//     });
//   },
// });

// export interface RateLimiterRule {
//     endpoint: string;
//     rate_limit: {
//       time: number;
//       limit: number;
//     };
//   }

//   export const rateLimiter = (rule: RateLimiterRule) => {
//     const { endpoint, rate_limit } = rule;

//     return async (
//       request: Request,
//       response: Response,
//       next: NextFunction
//     ): Promise<void> => {
//       const ipAddress = request.ip;

//       const redisId = `${endpoint}/${ipAddress}`;

//       // Increment the request count for the user
//       const requests = (await redisClient?.incr(redisId)) ?? 0;

//       // Set expiration for the Redis key when it's first created
//       if (requests === 1) {
//         await redisClient?.expire(redisId, rate_limit.time);
//       }

//       // If request limit is exceeded, send a 429 status and end the request-response cycle
//       if (requests > rate_limit.limit) {
//         response.status(429).send({
//           message: "Too many requests, please try again later.",
//         });
//         return; // Don't call next(), we end the cycle by sending a response
//       }

//       // If the limit is not exceeded, call next() to proceed with the request
//       next();
//     };
//   };
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import { createClient, RedisClientType } from "redis";
import { Request, Response, NextFunction } from "express";

interface RateLimiterError {
  msBeforeNext: number;
  remainingPoints: number;
  consumedPoints: number;
}

// Redis client with type and connection management
let redisClient: RedisClientType;
let isRedisConnected = false;

const initializeRedis = async (): Promise<void> => {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      connectTimeout: 5000, // 5 seconds timeout
      reconnectStrategy: (retries) => {
        const delay = Math.min(retries * 100, 5000);
        console.log(
          `Redis reconnection attempt ${retries}, retrying in ${delay}ms`
        );
        return delay;
      },
    },
    database: parseInt(process.env.REDIS_DB || "0"),
    ...(process.env.REDIS_PASSWORD
      ? { password: process.env.REDIS_PASSWORD }
      : {}),
  });

  redisClient.on("error", (err) => {
    console.error("Redis error:", err);
    isRedisConnected = false;
  });

  redisClient.on("ready", () => {
    console.log("Redis connected");
    isRedisConnected = true;
  });

  redisClient.on("end", () => {
    console.log("Redis connection closed");
    isRedisConnected = false;
  });

  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Redis initial connection failed:", err);
    isRedisConnected = false;
  }
};

// Initialize Redis immediately
initializeRedis();

// Fallback to memory store when Redis is unavailable
const createLimiter = (config: any) => {
  return isRedisConnected
    ? new RateLimiterRedis({ ...config, storeClient: redisClient })
    : new RateLimiterMemory(config);
};

const limiters = {
  listEndpoints: createLimiter({
    points: 60,
    duration: 60,
    keyPrefix: "rl:list", // Changed to colon separator
    blockDuration: 300,
  }),
  detailEndpoints: createLimiter({
    points: 30,
    duration: 60,
    keyPrefix: "rl:detail",
    blockDuration: 300,
  }),
  writeEndpoints: createLimiter({
    points: 20,
    duration: 60,
    keyPrefix: "rl:write",
    blockDuration: 300,
  }),
  uploadEndpoints: createLimiter({
    points: 10,
    duration: 60,
    keyPrefix: "rl:upload",
    blockDuration: 300,
  }),
};

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Reconnect if Redis was disconnected
    if (!isRedisConnected && redisClient) {
      try {
        await redisClient.connect();
        isRedisConnected = true;
      } catch (err) {
        console.warn("Redis reconnection failed, using memory store");
      }
    }

    const clientIP = req.ip || req.socket.remoteAddress || "unknown";
    const pathSegment = req.path.split("/")[2] || "";
    const method = req.method;

    let limiterKey: keyof typeof limiters = "listEndpoints";
    let endpointKey = pathSegment;

    if (pathSegment === "upload-image") {
      limiterKey = "uploadEndpoints";
    } else if (["POST", "PATCH", "DELETE"].includes(method)) {
      limiterKey = "writeEndpoints";
      endpointKey = `${method}:${pathSegment || "/"}`;
    } else if (req.params.slug) {
      limiterKey = "detailEndpoints";
    }

    const rateLimitKey = `${clientIP}:${endpointKey}`;
    const response = await limiters[limiterKey].consume(rateLimitKey);

    res.set({
      "X-RateLimit-Limit": limiters[limiterKey].points,
      "X-RateLimit-Remaining": response.remainingPoints,
      "X-RateLimit-Reset":
        Math.floor(Date.now() / 1000) + Math.ceil(response.msBeforeNext / 1000),
      "X-RateLimit-Policy": `${limiters[limiterKey].points};w=60`,
      "X-RateLimit-Storage": isRedisConnected ? "redis" : "memory",
    });

    return next();
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "msBeforeNext" in err) {
      const rateLimitError = err as RateLimiterError;
      const retryAfter = Math.ceil(rateLimitError.msBeforeNext / 1000);

      res.set({
        "Retry-After": retryAfter,
        "X-RateLimit-Remaining": 0,
        "X-RateLimit-Reset": Math.floor(Date.now() / 1000) + retryAfter,
      });

      return void res.status(429).json({
        error: "Too many requests",
        message: `Please try again in ${retryAfter} seconds`,
        retryAfter,
        endpoint: req.path,
        method: req.method,
        storage: isRedisConnected ? "redis" : "memory",
      });
    }

    console.error("Rate limiter error:", err);
    return next();
  }
};
