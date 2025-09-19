export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderID, user_id, product_id } = req.body;

  if (!orderID || !user_id || !product_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 1️⃣ Get PayPal access token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");

    const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: "PayPal authentication failed" });
    }

    // 2️⃣ Verify the order with PayPal
    const orderRes = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${orderID}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );
    const orderData = await orderRes.json();

    if (orderData.status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // 3️⃣ Call your VPS to generate the license
    const generateRes = await fetch("https://afkaudiotrigger.ignorelist.com/admin/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": process.env.ADMIN_KEY,
      },
      body: JSON.stringify({ user_id, product_id }),
    });

    const data = await generateRes.json();
    return res.status(generateRes.status).json(data);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
