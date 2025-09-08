export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderID, user_id, product_id, status } = req.body;

  if (!orderID || !user_id || !product_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1️⃣ Verify payment with PayPal
    const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT; // your client ID
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET; // your secret
    const base64Auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString("base64");

    // Get access token
    const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("PayPal auth failed");

    // Get order details from PayPal
    const orderRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const orderData = await orderRes.json();

    // ✅ Accept "COMPLETED"
    // ✅ In sandbox, also allow "APPROVED" if frontend said capture succeeded
    if (orderData.status !== "COMPLETED") {
      if (!(process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") || status !== "COMPLETED") {
        return res.status(400).json({ error: "Payment not completed" });
      }
    }

    // 2️⃣ Payment verified, generate license
    const generateResponse = await fetch("https://afkaudiotrigger.ignorelist.com/admin/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": process.env.ADMIN_KEY,
      },
      body: JSON.stringify({ user_id, product_id }),
    });

    const data = await generateResponse.json();
    return res.status(generateResponse.status).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
