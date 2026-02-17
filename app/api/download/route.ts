import { NextRequest } from "next/server";
import { YtDlp } from 'ytdlp-nodejs';
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

/**
 * AUTHENTICATED VPS ENGINE:
 * We inject --cookies into the binary arguments globally.
 */
interface IDownloadBuilder {
    format(options: { filter?: string; quality?: string; type?: string }): IDownloadBuilder;
    Auth: {
        cookies(path: string): IDownloadBuilder;
    };
    getStream(): import("stream").Readable;
}

interface IInfoBuilder {
    Auth: {
        cookies(path: string): IInfoBuilder;
    };
    fetch(): Promise<Record<string, unknown>>;
}

interface IYtDlpInstance {
    getInfo(url: string): IInfoBuilder;
    download(url: string): IDownloadBuilder;
}

const getBinaryPath = (): string => {
    const pipPath = '/usr/local/bin/yt-dlp';
    const systemPath = '/usr/bin/yt-dlp';
    const localBin = path.join(process.cwd(), 'bin', 'yt-dlp');

    if (fs.existsSync(pipPath)) return pipPath;
    if (fs.existsSync(systemPath)) return systemPath;
    if (fs.existsSync(localBin)) return localBin;

    return 'yt-dlp';
};

const COOKIES_FILE_PATH = path.resolve(process.cwd(), 'cookies.txt');

// Casting constructor through unknown to avoid any
type YtDlpConstructor = new (options: { binaryPath: string }) => IYtDlpInstance;
const YtDlpEngine = (YtDlp as unknown) as YtDlpConstructor;

const ytdlp = new YtDlpEngine({
    binaryPath: getBinaryPath()
});

export async function POST(req: NextRequest) {
    try {
        const { url, type } = await req.json();

        const hasCookies = fs.existsSync(COOKIES_FILE_PATH);

        /**
         * 1. GET METADATA
         */
        let infoBuilder = ytdlp.getInfo(url);
        if (hasCookies) {
            infoBuilder = infoBuilder.Auth.cookies(COOKIES_FILE_PATH);
        }
        const info = await infoBuilder.fetch();

        const realTitle = String(info.title || "Youplex_Download");
        const rawThumbnails = (info.thumbnails as Record<string, string>[]) || [];
        const thumbnail = rawThumbnails.length > 0
            ? String(rawThumbnails[rawThumbnails.length - 1].url)
            : "";

        // Logic to extract the correct filesize from the format list
        const rawFormats = (info.formats as Record<string, unknown>[]) || [];
        const formats = [...rawFormats].reverse();

        const selectedFormat = formats.find((f) =>
            type === 'audio' ? f.vcodec === 'none' : f.vcodec !== 'none'
        ) || (rawFormats.length > 0 ? rawFormats[0] : null);

        // Filesize calculation
        const fileSize = typeof selectedFormat?.filesize === 'number'
            ? selectedFormat.filesize
            : (typeof selectedFormat?.filesize_approx === 'number' ? selectedFormat.filesize_approx : 0);

        /**
         * 2. DOWNLOAD STREAM
         */
        let downloadBuilder = ytdlp.download(url);

        if (type === "audio") {
            downloadBuilder = downloadBuilder.format({
                filter: 'bestaudio',
                type: 'mp3'
            });
        } else {
            downloadBuilder = downloadBuilder.format({
                filter: 'mergevideo',
                quality: '1080p',
                type: 'mp4'
            });
        }

        if (hasCookies) {
            downloadBuilder = downloadBuilder.Auth.cookies(COOKIES_FILE_PATH);
        }

        const nodeStream = downloadBuilder.getStream();
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