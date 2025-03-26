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
exports.sendCoinDeniedMail = exports.sendCoinApprovedMail = exports.getResend = exports.initializeResend = void 0;
const resend_1 = require("resend");
const render_1 = require("@react-email/render");
const coin_approved_email_1 = require("../email-templates/coin-approved-email");
const coin_denied_email_1 = __importDefault(require("../email-templates/coin-denied-email"));
// Create a Resend instance
let resendInstance = null;
// Initialize the Resend client
const initializeResend = (apiKey) => {
    if (!resendInstance) {
        resendInstance = new resend_1.Resend(apiKey);
    }
    return resendInstance;
};
exports.initializeResend = initializeResend;
// Get the Resend instance or throw an error if not initialized
const getResend = () => {
    if (!resendInstance) {
        throw new Error("Resend has not been initialized. Call initializeResend first.");
    }
    return resendInstance;
};
exports.getResend = getResend;
// Send welcome email function
const sendCoinApprovedMail = (to, name, coinName, coinSlug) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resend = (0, exports.getResend)();
        const html = yield (0, render_1.renderAsync)((0, coin_approved_email_1.CoinApprovedEmail)({
            name,
            coinName,
            coinSlug,
        }));
        const { data, error } = yield resend.emails.send({
            from: "FreshCoins <no-reply@update.analizesportive.ro>",
            to,
            subject: `Success! ${coinName} is now live and approved`,
            html,
        });
        if (error) {
            console.error("Failed to send welcome email:", error);
            return { success: false, error };
        }
        return { success: true, data };
    }
    catch (error) {
        console.error("Error sending welcome email:", error);
        return { success: false, error };
    }
});
exports.sendCoinApprovedMail = sendCoinApprovedMail;
// Send welcome email function
const sendCoinDeniedMail = (to, name, coinName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resend = (0, exports.getResend)();
        const html = yield (0, render_1.renderAsync)((0, coin_denied_email_1.default)({
            name,
            coinName,
        }));
        const { data, error } = yield resend.emails.send({
            from: "FreshCoins <no-reply@update.analizesportive.ro>",
            to,
            subject: `${coinName} listing request on FreshCoins was denied`,
            html,
        });
        if (error) {
            console.error("Failed to send welcome email:", error);
            return { success: false, error };
        }
        return { success: true, data };
    }
    catch (error) {
        console.error("Error sending welcome email:", error);
        return { success: false, error };
    }
});
exports.sendCoinDeniedMail = sendCoinDeniedMail;
