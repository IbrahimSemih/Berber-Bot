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

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>BerberBot'a Hoş Geldiniz!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hoş Geldiniz, {name}!</Heading>
        <Text style={text}>
          BerberBot'a katıldığınız için teşekkür ederiz. Dükkanınızı ve randevularınızı WhatsApp ve Web üzerinden yönetmeye başlamak için doğru yerdesiniz.
        </Text>
        <Text style={text}>
          Aşağıdaki butona tıklayarak rehberimize göz atabilir ve sisteminizi dakikalar içinde kurabilirsiniz:
        </Text>
        <Section style={buttonContainer}>
          <Link href="https://berberbot.com/rehber" style={button}>
            Kullanım Rehberine Git
          </Link>
        </Section>
        <Text style={text}>
          Herhangi bir sorunuz olursa bu e-postayı yanıtlamaktan çekinmeyin.
        </Text>
        <Text style={footer}>
          Sevgilerle,<br />
          BerberBot Ekibi
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

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
