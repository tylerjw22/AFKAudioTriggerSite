import fetch from "node-fetch";

const PAYPAL_API = "https://api-m.paypal.com"; // live
// const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // uncomment for sandbox testing

// Get PayPal access token
async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { action, orderID } = req.body;

    try {
      const accessToken = await getAccessToken();

      if (action === "create") {
        // Create order
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                amount: {
                  currency_code: "AUD",
                  value: "11.99", // secure backend price
                },
                description: "AFK Audio Trigger Paid Version",
              },
            ],
            application_context: { shipping_preference: "NO_SHIPPING" },
          }),
        });

        const order = await response.json();
        return res.status(200).json(order);

      } else if (action === "capture") {
        // Capture order
        const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        const captureData = await response.json();

        // TODO: Validate captureData.purchase_units[0].payments.captures[0].amount.value === 11.99
        // TODO: Generate license and return it
        const license = "GENERATED_LICENSE"; // replace with actual license logic

        return res.status(200).json({ status: captureData.status, license });
      } else {
        res.status(400).json({ error: "Invalid action" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
