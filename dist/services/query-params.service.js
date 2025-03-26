"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueryParams = processQueryParams;
exports.processUserQueryParams = processUserQueryParams;
function processQueryParams(query) {
    // 1. Extract and set default values
    const { pageSize = "25", pageNumber = "1", presale = "false", fairlaunch = "false", chain = [""], audit = "false", kyc = "false", sortColumn = "todayVotes", sortDirection = "descending", selectedKeys = ["Today_best"], userId = "", } = query;
    // 2. Process pagination
    let size = parseInt(pageSize, 10);
    let page = parseInt(pageNumber, 10);
    // Validate pagination values
    size = !isNaN(size) && size > 0 ? size : 25;
    page = !isNaN(page) && page > 0 ? page : 1;
    // 3. Process boolean flags with strict type checking
    const isPresale = presale === "true";
    const isFairlaunch = fairlaunch === "true";
    const isAudit = audit === "true";
    const isKyc = kyc === "true";
    // 4. Process chains
    let chains = [];
    if (typeof chain === "string" && chain.trim() !== "") {
        chains = chain.split(",").map((item) => item.trim());
    }
    else if (Array.isArray(chain)) {
        chains = chain.map((c) => String(c)).filter((c) => c.trim() !== "");
    }
    // 5. Process sort parameters
    let finalSortColumn = Array.isArray(sortColumn)
        ? String(sortColumn[0])
        : sortColumn;
    let finalSortDirection = Array.isArray(sortDirection)
        ? sortDirection[0]
        : sortDirection;
    // 6. Process selected keys
    let finalSelectedKeys = Array.isArray(selectedKeys)
        ? selectedKeys
        : [selectedKeys].filter(Boolean);
    // 7. Determine sort column based on selected keys
    if (!query.sortColumn || // no manual sort column provided
        finalSortColumn === "votes" ||
        finalSortColumn === "todayVotes") {
        if (Array.isArray(finalSelectedKeys) &&
            !finalSelectedKeys.includes("Today_best")) {
            finalSortColumn = "votes"; // All time best → votes
        }
        else {
            finalSortColumn = "todayVotes"; // Today best → todayVotes
        }
    }
    // 8. Return processed parameters
    return {
        pageSize: size,
        pageNumber: page,
        isPresale,
        isFairlaunch,
        chains,
        isAudit,
        isKyc,
        sortColumn: String(finalSortColumn),
        sortDirection: finalSortDirection,
        selectedKeys: finalSelectedKeys.map((key) => String(key)),
        userId: String(userId || ""),
    };
}
function processUserQueryParams(query) {
    // 1. Extract and set default values
    const { pageSize = "25", pageNumber = "1" } = query;
    // 2. Process pagination
    let size = parseInt(pageSize, 10);
    let page = parseInt(pageNumber, 10);
    // Validate pagination values
    size = !isNaN(size) && size > 0 ? size : 25;
    page = !isNaN(page) && page > 0 ? page : 1;
    // 8. Return processed parameters
    return {
        pageSize: size,
        pageNumber: page,
    };
}
