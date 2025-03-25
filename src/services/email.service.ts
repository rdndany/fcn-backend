import { Resend } from "resend";
import { renderAsync } from "@react-email/render";
import { CoinApprovedEmail } from "../email-templates/coin-approved-email";
import CoinDeniedEmail from "../email-templates/coin-denied-email";

// Create a Resend instance
let resendInstance: Resend | null = null;

// Initialize the Resend client
export const initializeResend = (apiKey: string): Resend => {
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

// Get the Resend instance or throw an error if not initialized
export const getResend = (): Resend => {
  if (!resendInstance) {
    throw new Error(
      "Resend has not been initialized. Call initializeResend first."
    );
  }
  return resendInstance;
};

// Send welcome email function
export const sendCoinApprovedMail = async (
  to: string,
  name: string,
  coinName: string,
  coinSlug: string
) => {
  try {
    const resend = getResend();

    const html = await renderAsync(
      CoinApprovedEmail({
        name,
        coinName,
        coinSlug,
      })
    );

    const { data, error } = await resend.emails.send({
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
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
};

// Send welcome email function
export const sendCoinDeniedMail = async (
  to: string,
  name: string,
  coinName: string
) => {
  try {
    const resend = getResend();

    const html = await renderAsync(
      CoinDeniedEmail({
        name,
        coinName,
      })
    );

    const { data, error } = await resend.emails.send({
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
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
};
