import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log("[api/test] Node.js:", process.version);
  res.status(200).json({ nodejs: process.version });
}
