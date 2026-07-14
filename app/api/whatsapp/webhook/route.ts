import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Meta uses GET request to verify the webhook URL during setup
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  } else {
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

// Meta sends POST request when a message is received
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if it's a WhatsApp status update or a message
    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.value && change.value.messages && change.value.messages.length > 0) {
                const message = change.value.messages[0];
                const from = message.from; // Sender's phone number

                // We only auto-reply to text messages for now
                if (message.type === 'text') {
                   console.log(`Received WhatsApp message from ${from}: ${message.text.body}`);
                   
                   // Send auto-reply
                   const autoReply = "Bu bir otomatik bildirim hattıdır. Lütfen randevu aldığınız berberiniz/kuaförünüz ile kendi iletişim numaralarından irtibata geçiniz.";
                   await sendWhatsAppMessage(from, autoReply);
                }
              }
            }
          }
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: 'Not a WhatsApp event' }, { status: 404 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
