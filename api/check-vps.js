// /pages/api/check-vps.js
export default async function handler(req, res) {
  try {
    const vpsRes = await fetch("https://afkaudiotrigger.ignorelist.com/", {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!vpsRes.ok) {
      return res.status(500).json({ status: "error", message: "VPS not reachable" });
    }

    const data = await vpsRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("VPS check failed:", err);
    return res.status(500).json({ status: "error", message: "Server check failed" });
  }
}
