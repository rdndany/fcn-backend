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
exports.CoinApprovedEmail = void 0;
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
const CoinApprovedEmail = ({ name = "User", coinName = "Coin Name", coinSlug = "coin-slug", }) => {
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
                    "Congratulations! ",
                    coinName,
                    " is now live on FreshCoins!"),
                React.createElement(components_1.Section, { className: "mt-[18px]" },
                    React.createElement(components_1.Img, { src: `https://res.cloudinary.com/dquza9v7r/image/upload/v1742823456/freshcoins_logo_var-03_hg0skd.png`, height: "80", alt: "FreshCoins Logo", className: "my-0 mx-auto" })),
                React.createElement(components_1.Container, { className: "border border-solid border-[#eaeaea] rounded my-[30px] mx-auto p-[20px] max-w-[465px]" },
                    React.createElement(components_1.Heading, { className: "text-black text-[20px] font-normal text-center p-0 mt-[30px] mx-0" },
                        React.createElement("strong", null, coinName),
                        " is ",
                        React.createElement("strong", null, "approved!")),
                    React.createElement(components_1.Section, null,
                        React.createElement(components_1.Img, { src: `https://res.cloudinary.com/dquza9v7r/image/upload/v1742825995/freshcoins-check_gaub8n.png`, height: "80", alt: "FreshCoins Logo", className: "my-0 mx-auto" })),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hello ",
                        name,
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Great news! We're excited to let you know that your coin,",
                        " ",
                        coinName,
                        ", has been successfully approved and is now live on our platform."),
                    React.createElement(components_1.Section, { className: "mb-6" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-semibold mb-2" }, "Here\u2019s what you can do next:"),
                        React.createElement("ul", { className: "text-black text-[14px] leading-snug pl-5" },
                            React.createElement("li", { className: "mb-2" }, "Share your coin\u2019s page with your community."),
                            React.createElement("li", { className: "mb-2" }, "Drive votes to climb the rankings and maximize visibility on the platform."),
                            React.createElement("li", { className: "m-0" }, "Get verified with a green check badge by upgrading to Premium."))),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { href: `https://fcn.vercel.app/coins/${coinSlug}`, className: "bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3" }, "Go to Coin Page")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "or copy and paste this URL into your browser:",
                        " ",
                        React.createElement(components_1.Link, { className: "text-blue-600 no-underline", href: `https://fcn.vercel.app/coins/${coinSlug}` }, "link")),
                    React.createElement(components_1.Hr, { className: "border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" }),
                    React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[20px]" },
                        "Boost your coin\u2019s visibility on one of the top crypto voting platforms! Promote your project to tens of thousands of daily visitors and climb the rankings. Get started with a promoted spot. For more details on pricing and packages, reach out to us at",
                        " ",
                        React.createElement("a", { href: "mailto:office@freshcoins.io", className: "text-blue-600 underline" }, "office@freshcoins.io"),
                        "."))))));
};
exports.CoinApprovedEmail = CoinApprovedEmail;
exports.default = exports.CoinApprovedEmail;
const styles = {
    body: {
        backgroundColor: "#f6f9fc",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    container: {
        margin: "0 auto",
        padding: "20px 0",
        maxWidth: "580px",
    },
    heading: {
        fontSize: "32px",
        lineHeight: "1.3",
        fontWeight: "700",
        color: "#484848",
    },
    text: {
        fontSize: "16px",
        lineHeight: "1.6",
        color: "#484848",
        marginBottom: "20px",
    },
    button: {
        backgroundColor: "#5c6ac4",
        borderRadius: "4px",
        color: "#fff",
        fontSize: "16px",
        fontWeight: "bold",
        textDecoration: "none",
        textAlign: "center",
        display: "block",
        width: "200px",
        padding: "12px 16px",
        margin: "20px 0",
    },
    footer: {
        fontSize: "14px",
        color: "#9ca299",
        marginTop: "20px",
        fontStyle: "italic",
    },
};
