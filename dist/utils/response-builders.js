"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCoinResponse = buildCoinResponse;
function buildCoinResponse(data) {
    return {
        message: "All coins fetched and votes updated successfully",
        coins: data.coinsWithUpdatedFlags,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
        skip: data.skip,
    };
}
