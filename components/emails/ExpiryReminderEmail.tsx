import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ExpiryReminderEmailProps {
  shopName: string;
  isTrial: boolean;
  endDate: string;
  daysLeft: number;
  billingUrl: string;
}

export const ExpiryReminderEmail = ({ shopName, isTrial, endDate, daysLeft, billingUrl }: ExpiryReminderEmailProps) => {
  const what = isTrial ? "ücretsiz deneme süreniz" : "aboneliğiniz";
  const when = daysLeft <= 0 ? "bugün" : daysLeft === 1 ? "yarın" : `${daysLeft} gün sonra`;
  const preview = `${shopName}: ${what} ${when} sona eriyor`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{isTrial ? "Deneme süreniz bitiyor" : "Aboneliğiniz bitiyor"}</Heading>
          <Text style={text}>Merhaba {shopName},</Text>
          <Text style={text}>
            BerberBot {what} <strong>{endDate}</strong> tarihinde ({when}) sona eriyor. Süre dolduğunda online randevu
            sayfanız yeni randevu almayı durdurur ve müşterilerinize WhatsApp hatırlatmaları gönderilmez.
          </Text>
          <Text style={text}>
            BerberBot&apos;ta otomatik yenileme yoktur; kesinti yaşamamak için aşağıdaki butondan dilediğiniz planı seçebilirsiniz.
            {isTrial ? " Şimdi geçerseniz kalan deneme günleriniz kaybolmaz." : " Erken yenilemede yeni dönem mevcut bitiş tarihinin üzerine eklenir."}
          </Text>
          <Section style={buttonContainer}>
            <Link href={billingUrl} style={button}>
              {isTrial ? "Pro'ya Geç" : "Aboneliği Uzat"}
            </Link>
          </Section>
          <Text style={footer}>
            Sorunuz olursa bu e-postayı yanıtlayabilirsiniz.<br />
            BerberBot Ekibi
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ExpiryReminderEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  padding: "0 48px",
  margin: "40px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  padding: "0 48px",
};

const buttonContainer = {
  padding: "0 48px",
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  padding: "0 48px",
  marginTop: "48px",
};
