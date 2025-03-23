"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = generateCode;
const uuid_1 = require("uuid");
function generateCode() {
    return (0, uuid_1.v4)().replace(/-/g, "").substring(0, 8);
}
