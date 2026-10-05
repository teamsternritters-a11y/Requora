import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

const GMAIL_SMTP_USER = Deno.env.get('GMAIL_SMTP_USER')
const GMAIL_SMTP_PASSWORD = Deno.env.get('GMAIL_SMTP_PASSWORD')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GMAIL_SMTP_USER || !GMAIL_SMTP_PASSWORD) {
      throw new Error('GMAIL_SMTP_USER or GMAIL_SMTP_PASSWORD is not set in secrets')
    }

    const body = await req.json()
    const { to, customerName, orderId, amount, requirementTitle, providerName } = body

    if (!to || !customerName || !orderId || !amount) {
      throw new Error('Missing required fields')
    }

    // Connect to Gmail SMTP using denomailer
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: GMAIL_SMTP_USER,
          password: GMAIL_SMTP_PASSWORD,
        },
      },
    })

    // Format the email HTML
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <h1 style="color: #0ea5e9;">Order Confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>Your payment for <strong>₹${amount.toLocaleString()}</strong> has been successfully processed and securely held in escrow.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="font-size: 16px; margin-top: 0;">Order Summary</h2>
          <p style="margin-bottom: 5px;"><strong>Project:</strong> ${requirementTitle || 'Requirement'}</p>
          <p style="margin-bottom: 5px;"><strong>Provider:</strong> ${providerName || 'Provider'}</p>
          <p style="margin-bottom: 5px;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin-bottom: 0;"><strong>Amount Paid:</strong> ₹${amount.toLocaleString()}</p>
        </div>

        <p>The provider has been notified to begin work on your order. You will receive another notification once the delivery is ready for your review.</p>
        <p>Thank you for using Requora!</p>
      </div>
    `

    // Send the email
    await client.send({
      from: `"Requora" <${GMAIL_SMTP_USER}>`,
      to: to,
      subject: `Order Confirmed: ${requirementTitle || 'Your Requirement'}`,
      content: "Your order has been confirmed.",
      html: htmlContent,
    })

    // Close SMTP connection
    await client.close()

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully via Gmail SMTP" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("SMTP Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
