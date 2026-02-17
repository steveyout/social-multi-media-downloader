import { NextRequest } from "next/server";
import * as YtDlpModule from 'ytdlp-nodejs';
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

/**
 * STRICT INTERFACES
 * Recursive builder pattern to satisfy ESLint without using 'any'.
 */
interface IBuilderAuth {
    cookies(path: string): IStreamBuilder;
    username(user: string): IStreamBuilder;
    password(pass: string): IStreamBuilder;
}

interface IStreamBuilder {
    filter(f: string): IStreamBuilder;
    quality(q: string | number): IStreamBuilder;
    type(t: string): IStreamBuilder;
    Auth: IBuilderAuth;
    getStream(): import("stream").Readable;
    on(event: string, fn: (data: unknown) => void): IStreamBuilder;
}

interface IYtDlpInstance {
    getInfoAsync(url: string, options?: { rawArgs?: string[] }): Promise<Record<string, unknown>>;
    stream(url: string): IStreamBuilder;
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

// Use path.resolve to ensure absolute pathing on VPS
const COOKIES_FILE_PATH = path.resolve(process.cwd(), 'cookies.txt');

// Resolve the Library Class
// @ts-expect-error - Handling module interop for ytdlp-nodejs
const YtDlpClass = YtDlpModule.YtDlp || YtDlpModule.default || YtDlpModule;

type YtDlpConstructor = new (options: { binaryPath: string }) => IYtDlpInstance;
const YtDlpEngine = YtDlpClass as unknown as YtDlpConstructor;

const ytdlp = new YtDlpEngine({
    binaryPath: getBinaryPath()
});

export async function POST(req: NextRequest) {
    try {
        const { url, type } = await req.json();

        const hasCookies = fs.existsSync(COOKIES_FILE_PATH);

        console.log(`[Youplex] Authenticating: ${url} | Cookies: ${hasCookies}`);

        /**
         * 1. GET METADATA
         * We pass cookies via rawArgs for the info fetch.
         */
        const info = await ytdlp.getInfoAsync(url, {
            rawArgs: hasCookies ? [`--cookies=${COOKIES_FILE_PATH}`] : []
        });

        const realTitle = String(info.title || "Youplex_Media");
        const rawThumbnails = (info.thumbnails as Record<string, unknown>[]) || [];
        const thumbnail = rawThumbnails.length > 0
            ? String(rawThumbnails[rawThumbnails.length - 1].url)
            : "";

        const rawFormats = (info.formats as Record<string, unknown>[]) || [];
        const formats = [...rawFormats].reverse();

        const selectedFormat = formats.find((f) =>
            type === 'audio' ? f.vcodec === 'none' : f.vcodec !== 'none'
        ) || (rawFormats.length > 0 ? rawFormats[0] : null);

        const fileSize = typeof selectedFormat?.filesize === 'number'
            ? selectedFormat.filesize
            : (typeof selectedFormat?.filesize_approx === 'number' ? selectedFormat.filesize_approx : 0);

        /**
         * 2. DOWNLOAD STREAM
         * Fluent API chain as per the ytdlp-nodejs documentation.
         */
        const streamBuilder = ytdlp.stream(url);

        if (type === "audio") {
            streamBuilder
                .filter('audioonly')
                .quality('highest')
                .type('mp3');
        } else {
            streamBuilder
                .filter('audioandvideo') //
                .quality('highest')
                .type('mp4');
        }

        // Apply cookies to the stream builder
        if (hasCookies) {
            streamBuilder.Auth.cookies(COOKIES_FILE_PATH);
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