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

interface CoinApprovedEmailProps {
  name: string;
  coinName: string;
  coinSlug: string;
}

export const CoinApprovedEmail = ({
  name = "User",
  coinName = "Coin Name",
  coinSlug = "coin-slug",
}: CoinApprovedEmailProps) => {
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
          <Preview>
            Congratulations! {coinName} is now live on FreshCoins!
          </Preview>
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
              <strong>{coinName}</strong> is <strong>approved!</strong>
            </Heading>
            <Section>
              <Img
                src={`https://res.cloudinary.com/dquza9v7r/image/upload/v1742825995/freshcoins-check_gaub8n.png`}
                height="80"
                alt="FreshCoins Logo"
                className="my-0 mx-auto"
              />
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {name},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Great news! We're excited to let you know that your coin,{" "}
              {coinName}, has been successfully approved and is now live on our
              platform.
            </Text>
            <Section className="mb-6">
              <Text className="text-black text-[14px] font-semibold mb-2">
                Here’s what you can do next:
              </Text>

              <ul className="text-black text-[14px] leading-snug pl-5">
                <li className="mb-2">
                  Share your coin’s page with your community.
                </li>
                <li className="mb-2">
                  Drive votes to climb the rankings and maximize visibility on
                  the platform.
                </li>
                <li className="m-0">
                  Get verified with a green check badge by upgrading to Premium.
                </li>
              </ul>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                href={`https://fcn.vercel.app/coins/${coinSlug}`}
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
              >
                Go to Coin Page
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{" "}
              <Link
                className="text-blue-600 no-underline"
                href={`https://fcn.vercel.app/coins/${coinSlug}`}
              >
                link
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[20px]">
              Boost your coin’s visibility on one of the top crypto voting
              platforms! Promote your project to tens of thousands of daily
              visitors and climb the rankings. Get started with a promoted spot.
              For more details on pricing and packages, reach out to us at{" "}
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

export default CoinApprovedEmail;

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    textAlign: "center" as const,
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
