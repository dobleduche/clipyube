// server/adapters/youtube.ts
import { google } from "googleapis";
import fs from "fs";
import path from "path";

export interface VideoMetadata {
  title: string;
  description: string;
  tags: string[];
  categoryId?: string; // default 22 (People & Blogs)
  privacyStatus?: "private" | "public" | "unlisted";
}

const getOAuthClient = () => {
  const {
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI,
    YOUTUBE_REFRESH_TOKEN,
  } = process.env;

  if (
    !YOUTUBE_CLIENT_ID ||
    !YOUTUBE_CLIENT_SECRET ||
    !YOUTUBE_REDIRECT_URI ||
    !YOUTUBE_REFRESH_TOKEN
  ) {
    throw new Error(
      "YouTube API credentials missing. Check OAuth env vars in .env."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: YOUTUBE_REFRESH_TOKEN,
  });

  return oauth2Client;
};

export const uploadVideo = async (
  filePath: string,
  metadata: VideoMetadata
): Promise<{ id: string; url: string }> => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file does not exist: ${filePath}`);
  }

  const auth = getOAuthClient();
  const youtube = google.youtube({ version: "v3", auth });

  const {
    title,
    description,
    tags = [],
    categoryId = "22",
    privacyStatus = "public",
  } = metadata;

  console.log("────────────────────────────────────────────");
  console.log("📡 YOUTUBE UPLOAD START");
  console.log("Title:", title);
  console.log("File:", filePath);
  console.log("────────────────────────────────────────────");

  try {
    const res = await youtube.videos.insert(
      {
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title,
            description,
            tags,
            categoryId,
          },
          status: {
            privacyStatus,
          },
        },
        media: {
          body: fs.createReadStream(filePath),
        },
      },
      {
        // Enable resumable upload
        onUploadProgress(e) {
          const percent = +((e.bytesRead / fs.statSync(filePath).size) * 100).toFixed(2);
          console.log(`Uploading… ${percent}%`);
        },
      }
    );

    const videoId = res.data.id;
    if (!videoId) throw new Error("YouTube did not return a video ID.");

    console.log(`✔️ Upload Complete → Video ID: ${videoId}`);

    return {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err: any) {
    console.error("YouTube Upload Failed:", err?.response?.data || err.message);
    throw new Error("YouTube upload failed. See logs for details.");
  }
};
