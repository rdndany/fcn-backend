import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
import { config } from "../config/app.config";

interface CoinDeniedEmailProps {
  name: string;
  coinName: string;
}

export const CoinDeniedEmail = ({
  name = "User",
  coinName = "Coin Name",
}: CoinDeniedEmailProps) => {
  return (
    <Html>
      <Head>
        <style>
          {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
          body, p, h1, h2, h3, h4, h5, h6 {
            font-family: 'Inter', sans-serif;
          }
        `}
        </style>
      </Head>

      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Preview>{coinName} was not approved on FreshCoins</Preview>
          <Section className="mt-[18px]">
            <Img
              src={`https://res.cloudinary.com/dquza9v7r/image/upload/v1742823456/freshcoins_logo_var-03_hg0skd.png`}
              height="80"
              alt="FreshCoins Logo"
              className="my-0 mx-auto"
            />
          </Section>
          <Container className="border border-solid border-[#eaeaea] rounded my-[30px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[20px] font-normal text-center p-0 mt-[30px] mx-0">
              <strong>{coinName}</strong> was <strong>denied</strong> for
              listing.
            </Heading>
            <Section>
              <Img
                src={`https://res.cloudinary.com/dquza9v7r/image/upload/v1742826310/freshcoins-denied_vrd34d.png`}
                height="80"
                alt="FreshCoins Logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {name},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Unfortunately, your coin, {coinName}, has not been approved for
              listing on FreshCoins at this time. Our team reviewed your
              submission, and we found some areas that need improvement before
              your coin can be listed.
            </Text>
            <Section className="mb-6">
              <Text className="text-black text-[14px] font-semibold mb-2">
                Here's what you can do next:
              </Text>

              <ul className="text-black text-[14px] leading-snug pl-5">
                <li className="mb-2">
                  Review the guidelines and ensure your coin meets all
                  requirements. (valid smart contract address, working website,
                  reasonable holding of supply)
                </li>
                <li className="mb-2">
                  Improve your coin’s community engagement and visibility.
                </li>
                <li className="m-0">
                  Submit a new application once you've addressed the feedback.
                </li>
              </ul>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                href={`https://fcn.vercel.app/`}
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
              >
                Check our platform
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link
                className="text-blue-600 no-underline"
                href={`https://fcn.vercel.app/`}
              >
                link
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[20px]">
              We understand this may be disappointing. However, we encourage you
              to keep working on your coin’s presence and resubmit. For more
              details or if you need assistance, feel free to contact us at{" "}
              <a
                href="mailto:office@freshcoins.io"
                className="text-blue-600 underline"
              >
                office@freshcoins.io
              </a>
              .
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CoinDeniedEmail;
