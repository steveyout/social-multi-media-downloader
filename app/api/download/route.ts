import { NextRequest } from "next/server";
import { YtDlp } from 'ytdlp-nodejs';
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

interface YtDlpOptions {
    path?: string;
}

const getBinaryPath = () => {
    const vpsPath = '/usr/bin/yt-dlp';
    const localBin = path.join(process.cwd(), 'bin', 'yt-dlp');

    if (fs.existsSync(vpsPath)) return vpsPath;
    if (fs.existsSync(localBin)) return localBin;

    return 'yt-dlp';
};

// We use 'unknown' then the specific interface to avoid the "unexpected any" lint error
const ytdlp = new (YtDlp as unknown as new (options: YtDlpOptions) => typeof YtDlp)({
    path: getBinaryPath()
}) as unknown as YtDlp;

export async function POST(req: NextRequest) {
    try {
        const { url, type } = await req.json();


        const info = await ytdlp.getInfoAsync(url);
        const realTitle = info.title || "Youplex Download";
        // @ts-expect-error - ytdlp-nodejs type definitions
        const thumbnail = info.thumbnails?.[info.thumbnails.length - 1]?.url || "";

        // Dynamically find the best format for size calculation
        // @ts-expect-error - ytdlp-nodejs type definitions
        const selectedFormat = info.formats.reverse().find(f =>
            type === 'audio' ? f.vcodec === 'none' : f.vcodec !== 'none'
        ) || // @ts-expect-error - ytdlp-nodejs type definitions
            info.formats[0];

        const fileSize = selectedFormat?.filesize || selectedFormat?.filesize_approx || 0;

        const streamBuilder = ytdlp.stream(url);

        if (type === "audio") {
            // "bestaudio" ensures we get the highest bitrate audio available
            // @ts-expect-error - ytdlp-nodejs type definitions for .filter().type() are overly restrictive
            streamBuilder.filter('bestaudio/best').type('mp3');
        } else {
            // "bestvideo+bestaudio/best" is the gold standard for best quality
            // It grabs the highest res video and highest res audio and merges them
            // @ts-expect-error - ytdlp-nodejs type definitions for .filter().type() are overly restrictive
            streamBuilder.filter('bestvideo+bestaudio/best').type('mp4');
        }

        const nodeStream = streamBuilder.getStream();
        const passThrough = new PassThrough();
        nodeStream.pipe(passThrough);

        // Convert Node PassThrough to Web ReadableStream
        const webStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of passThrough) {
                    controller.enqueue(new Uint8Array(chunk));
                }
                controller.close();
            },
            cancel() {
                nodeStream.destroy();
                passThrough.destroy();
            }
        });

        return new Response(webStream, {
            headers: {
                "Content-Disposition": `attachment; filename="download.${type === "audio" ? "mp3" : "mp4"}"`,
                "Content-Type": type === "audio" ? "audio/mpeg" : "video/mp4",
                "Content-Length": fileSize.toString(),
                "X-Video-Title": encodeURIComponent(realTitle),
                "X-Video-Thumbnail": encodeURIComponent(thumbnail),
                "Cache-Control": "no-cache",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to process stream" }), { status: 500 });
    }
}