"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinDeniedEmail = void 0;
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
const CoinDeniedEmail = ({ name = "User", coinName = "Coin Name", }) => {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null,
            React.createElement("style", null, `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
          body, p, h1, h2, h3, h4, h5, h6 {
            font-family: 'Inter', sans-serif;
          }
        `)),
        React.createElement(components_1.Tailwind, null,
            React.createElement(components_1.Body, { className: "bg-white my-auto mx-auto font-sans px-2" },
                React.createElement(components_1.Preview, null,
                    coinName,
                    " was not approved on FreshCoins"),
                React.createElement(components_1.Section, { className: "mt-[18px]" },
                    React.createElement(components_1.Img, { src: `https://res.cloudinary.com/dquza9v7r/image/upload/v1742823456/freshcoins_logo_var-03_hg0skd.png`, height: "80", alt: "FreshCoins Logo", className: "my-0 mx-auto" })),
                React.createElement(components_1.Container, { className: "border border-solid border-[#eaeaea] rounded my-[30px] mx-auto p-[20px] max-w-[465px]" },
                    React.createElement(components_1.Heading, { className: "text-black text-[20px] font-normal text-center p-0 mt-[30px] mx-0" },
                        React.createElement("strong", null, coinName),
                        " was ",
                        React.createElement("strong", null, "denied"),
                        " for listing."),
                    React.createElement(components_1.Section, null,
                        React.createElement(components_1.Img, { src: `https://res.cloudinary.com/dquza9v7r/image/upload/v1742826310/freshcoins-denied_vrd34d.png`, height: "80", alt: "FreshCoins Logo", className: "my-0 mx-auto" })),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hello ",
                        name,
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Unfortunately, your coin, ",
                        coinName,
                        ", has not been approved for listing on FreshCoins at this time. Our team reviewed your submission, and we found some areas that need improvement before your coin can be listed."),
                    React.createElement(components_1.Section, { className: "mb-6" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-semibold mb-2" }, "Here's what you can do next:"),
                        React.createElement("ul", { className: "text-black text-[14px] leading-snug pl-5" },
                            React.createElement("li", { className: "mb-2" }, "Review the guidelines and ensure your coin meets all requirements. (valid smart contract address, working website, reasonable holding of supply)"),
                            React.createElement("li", { className: "mb-2" }, "Improve your coin\u2019s community engagement and visibility."),
                            React.createElement("li", { className: "m-0" }, "Submit a new application once you've addressed the feedback."))),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { href: `https://fcn.vercel.app/`, className: "bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3" }, "Check our platform")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "or copy and paste this URL into your browser:",
                        " ",
                        React.createElement(components_1.Link, { className: "text-blue-600 no-underline", href: `https://fcn.vercel.app/` }, "link")),
                    React.createElement(components_1.Hr, { className: "border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" }),
                    React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[20px]" },
                        "We understand this may be disappointing. However, we encourage you to keep working on your coin\u2019s presence and resubmit. For more details or if you need assistance, feel free to contact us at",
                        " ",
                        React.createElement("a", { href: "mailto:office@freshcoins.io", className: "text-blue-600 underline" }, "office@freshcoins.io"),
                        "."))))));
};
exports.CoinDeniedEmail = CoinDeniedEmail;
exports.default = exports.CoinDeniedEmail;
