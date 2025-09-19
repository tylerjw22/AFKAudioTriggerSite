export default function handler(req, res) {
  // Minimal backend returning the price
  res.status(200).json({
    currency: "AUD",
    value: "15.14"
  });
}
