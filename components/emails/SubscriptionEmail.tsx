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

interface SubscriptionEmailProps {
  name: string;
  planName: string;
  amount: string;
  isSuccess: boolean;
  reason?: string;
}

export const SubscriptionEmail = ({ 
  name, 
  planName, 
  amount, 
  isSuccess, 
  reason 
}: SubscriptionEmailProps) => {
  const title = isSuccess ? "Aboneliğiniz Başlatıldı" : "Ödeme Başarısız Oldu";
  const preview = isSuccess 
    ? "BerberBot aboneliğiniz başarıyla başlatıldı." 
    : "BerberBot abonelik yenileme işleminiz başarısız oldu.";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>
            Merhaba {name},
          </Text>
          {isSuccess ? (
            <>
              <Text style={text}>
                BerberBot <strong>{planName}</strong> planı aboneliğiniz başarıyla başlatıldı. 
                Sistemimizi kesintisiz olarak kullanmaya devam edebilirsiniz.
              </Text>
              <Text style={text}>Tahsil edilen tutar: <strong>{amount}</strong></Text>
              <Section style={buttonContainer}>
                <Link href="https://berberbot.com/panel" style={button()}>
                  Panele Git
                </Link>
              </Section>
            </>
          ) : (
            <>
              <Text style={text}>
                BerberBot <strong>{planName}</strong> planınız için yenileme ödemesi alınamadı. 
                Lütfen ödeme bilgilerinizi güncelleyin.
              </Text>
              {reason && <Text style={text}>Hata nedeni: {reason}</Text>}
              <Section style={buttonContainer}>
                <Link href="https://berberbot.com/panel/billing" style={button(true)}>
                  Ödeme Bilgilerini Güncelle
                </Link>
              </Section>
            </>
          )}
          <Text style={footer}>
            Sevgilerle,<br />
            BerberBot Ekibi
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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

const button = (isDanger?: boolean) => ({
  backgroundColor: isDanger ? "#e53e3e" : "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
});

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  padding: "0 48px",
  marginTop: "48px",
};
