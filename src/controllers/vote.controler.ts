import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { createVoteByCoinId, getVotesByCoinId } from "../services/vote.service";
import { HTTPSTATUS } from "../config/http.config";
import { getClientIp } from "request-ip";
import { BadRequestException } from "../utils/appError";
import VoteModel from "../models/vote.model";

export const getByCoinId = asyncHandler(async (req: Request, res: Response) => {
  const { coin_id } = req.params;
  const rawIp = String(
    req.headers["x-forwarded-for"] || req.socket.remoteAddress
  );

  const ip = rawIp.split(",")[rawIp.split(",").length - 1].trim();

  const [todayDate] = new Date().toISOString().split("T");

  const countVotesByCoinId = await getVotesByCoinId(coin_id);

  return res.status(HTTPSTATUS.OK).json({
    message: "Votes by coin fetched successfully",
    countVotesByCoinId,
  });
});

export const voteByCoinId = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { coin_id } = req.params;
    const userIp = getClientIp(req);

    if (!userIp) {
      throw new BadRequestException("IP address not found");
    }

    try {
      const { vote, updatedCoin } = await createVoteByCoinId(coin_id, userIp);

      return res.status(201).json({
        message: "Vote successfully recorded",
        vote,
        updatedVotes: {
          votes: updatedCoin.votes,
          todayVotes: updatedCoin.todayVotes,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "An unexpected error occurred.",
      });
    }
  }
);

export const hasVotedToday = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { coin_id } = req.params;
    const userIp = getClientIp(req);

    if (!userIp) {
      throw new BadRequestException("IP address not found");
    }

    try {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      // Check if the user has already voted today for this coin
      const existingVote = await VoteModel.findOne({
        coin_id,
        ip_address: userIp,
        created_at: { $gte: todayStart },
      });

      if (existingVote) {
        return res.status(HTTPSTATUS.OK).json({
          message: "User has already voted today",
          hasVoted: true,
        });
      }

      return res.status(HTTPSTATUS.OK).json({
        message: "User has not voted today",
        hasVoted: false,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "An unexpected error occurred.",
      });
    }
  }
);
