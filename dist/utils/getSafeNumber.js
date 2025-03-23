"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSafeNumber = void 0;
const getSafeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : defaultValue;
};
exports.getSafeNumber = getSafeNumber;
