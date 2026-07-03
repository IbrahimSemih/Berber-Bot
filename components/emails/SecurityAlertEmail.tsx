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

interface SecurityAlertEmailProps {
  name: string;
  alertType: "password_reset" | "new_login";
  ipAddress?: string;
  time?: string;
  resetLink?: string;
}

export const SecurityAlertEmail = ({ 
  name, 
  alertType, 
  ipAddress, 
  time, 
  resetLink 
}: SecurityAlertEmailProps) => {
  const isReset = alertType === "password_reset";
  const title = isReset ? "Şifre Sıfırlama İsteği" : "Yeni Giriş Uyarı";
  const preview = isReset ? "BerberBot hesabınız için şifre sıfırlama" : "Hesabınıza yeni bir cihazdan giriş yapıldı";

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>Merhaba {name},</Text>
          
          {isReset ? (
            <>
              <Text style={text}>
                Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
              </Text>
              <Section style={buttonContainer}>
                <Link href={resetLink || "#"} style={button}>
                  Şifremi Sıfırla
                </Link>
              </Section>
              <Text style={text}>
                Eğer bu isteği siz yapmadıysanız, bu e-postayı güvenle görmezden gelebilirsiniz.
              </Text>
            </>
          ) : (
            <>
              <Text style={text}>
                BerberBot hesabınıza yeni bir cihazdan veya konumdan giriş yapıldığını fark ettik.
              </Text>
              <Text style={text}>
                <strong>Zaman:</strong> {time || new Date().toLocaleString("tr-TR")}<br />
                <strong>IP Adresi:</strong> {ipAddress || "Bilinmiyor"}
              </Text>
              <Text style={text}>
                Eğer bu girişi siz yaptıysanız herhangi bir işlem yapmanıza gerek yoktur. Ancak bu işlemi siz yapmadıysanız, lütfen derhal şifrenizi değiştirin.
              </Text>
              <Section style={buttonContainer}>
                <Link href="https://berberbot.com/panel/security" style={button}>
                  Hesap Güvenliğini Kontrol Et
                </Link>
              </Section>
            </>
          )}

          <Text style={footer}>
            Güvenliğiniz için,<br />
            BerberBot Güvenlik Ekibi
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default SecurityAlertEmail;

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
