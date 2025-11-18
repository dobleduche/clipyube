// get-youtube-refresh-token.js
import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost"; // MUST match Google Console

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing CLIENT_ID or CLIENT_SECRET in .env");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload"],
  });

  console.log("\n─────────────────────────────────────────");
  console.log("👉 Visit this URL and grant YouTube Upload permission:\n");
  console.log(authUrl);
  console.log("─────────────────────────────────────────\n");

  rl.question("Paste the code Google returned: ", async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      console.log("\n✔️ SUCCESS — Your Tokens:");
      console.log("REFRESH TOKEN →", tokens.refresh_token);
      console.log("\nAdd this to your .env:\n");
      console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
      rl.close();
    } catch (err) {
      console.error("Error getting tokens:", err);
      rl.close();
    }
  });
}

main();
