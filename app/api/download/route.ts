import { NextRequest } from "next/server";
import * as YtDlpModule from 'ytdlp-nodejs';
import { PassThrough } from "stream";
import path from "path";
import fs from "fs";

/**
 * STRICT INTERFACES
 */
interface IThumbnail {
    url: string;
    width?: number;
    height?: number;
}

interface IFormat {
    vcodec?: string;
    acodec?: string;
    filesize?: number;
    filesize_approx?: number;
    ext?: string;
    format_id?: string;
}

interface IYoutubeMetadata {
    title?: string;
    thumbnails?: IThumbnail[];
    formats?: IFormat[];
}

interface IStreamBuilder {
    filter(f: string): IStreamBuilder;
    quality(q: string | number): IStreamBuilder;
    type(t: string): IStreamBuilder;
    getStream(): import("stream").Readable;
    on(event: string, fn: (data: unknown) => void): IStreamBuilder;
    options(args: Record<string, string | boolean | number>): IStreamBuilder;
}

interface IYtDlpInstance {
    getInfoAsync(url: string, options?: { rawArgs?: string[] }): Promise<IYoutubeMetadata>;
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

const COOKIES_FILE_PATH = path.resolve(process.cwd(), 'cookies.txt');

// @ts-expect-error - Handling module interop for ytdlp-nodejs
const YtDlpClass = YtDlpModule.YtDlp || YtDlpModule.default || YtDlpModule;
type YtDlpConstructor = new (options: { binaryPath: string }) => IYtDlpInstance;
const YtDlpEngine = YtDlpClass as unknown as YtDlpConstructor;

const ytdlp = new YtDlpEngine({
    binaryPath: getBinaryPath()
});

export async function POST(req: NextRequest) {
    try {
        const { url, type } = (await req.json()) as { url: string; type: 'audio' | 'video' };
        const hasCookies = fs.existsSync(COOKIES_FILE_PATH);
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

        /**
         * 1. GET METADATA
         */
        let info: IYoutubeMetadata;
        try {
            info = await ytdlp.getInfoAsync(url, {
                rawArgs: [
                    ...(hasCookies ? [`--cookies=${COOKIES_FILE_PATH}`] : []),
                    `--user-agent=${userAgent}`,
                    "--no-check-certificate",
                    "--js-runtimes", "deno",
                    "--remote-components", "ejs:github"
                ]
            });
        } catch (err) {
            const error = err as Error;
            console.error("[Youplex] Metadata Error:", error.message);
            return new Response(JSON.stringify({ error: "Failed to fetch video info", details: error.message }), { status: 500 });
        }

        const realTitle = info.title || "Youplex_Media";
        const rawThumbnails = info.thumbnails || [];
        const thumbnail = rawThumbnails.length > 0
            ? rawThumbnails[rawThumbnails.length - 1].url
            : "";

        const rawFormats = info.formats || [];
        const selectedFormat = [...rawFormats].reverse().find((f) =>
            type === 'audio' ? f.vcodec === 'none' : f.vcodec !== 'none'
        ) || (rawFormats.length > 0 ? rawFormats[0] : null);

        const fileSize = selectedFormat?.filesize ?? selectedFormat?.filesize_approx ?? 0;

        /**
         * 2. DOWNLOAD STREAM
         */
        const streamBuilder = ytdlp.stream(url);

        const baseOptions: Record<string, string | boolean | number> = {
            jsRuntimes: 'deno',
            remoteComponents: 'ejs:github',
            userAgent: userAgent,
            noCheckCertificate: true,
            ...(hasCookies && { cookies: COOKIES_FILE_PATH })
        };

        if (type === "audio") {
            streamBuilder
                .options({ ...baseOptions, format: 'bestaudio/best' })
                .type('mp3');
        } else {
            streamBuilder
                .options({
                    ...baseOptions,
                    format: 'bestvideo+bestaudio/best',
                    mergeOutputFormat: 'mp4'
                });
        }

        const nodeStream = streamBuilder.getStream();
        const passThrough = new PassThrough();
        nodeStream.pipe(passThrough);

        nodeStream.on('error', (err) => {
            const error = err as Error;
            console.error("[Youplex] Stream Error:", error.message);
        });

        const webStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of passThrough) {
                        controller.enqueue(new Uint8Array(chunk as Buffer));
                    }
                    controller.close();
                } catch (e) {
                    const error = e as Error;
                    console.error("[Youplex] Pipeline Error:", error.message);
                    controller.error(error);
                    nodeStream.destroy();
                }
            },
            cancel() {
                nodeStream.destroy();
                passThrough.destroy();
            }
        });

        return new Response(webStream, {
            headers: {
                "Content-Disposition": `attachment; filename="${realTitle.replace(/[^\x00-\x7F]/g, "_")}.${type === "audio" ? "mp3" : "mp4"}"`,
                "Content-Type": type === "audio" ? "audio/mpeg" : "video/mp4",
                "Content-Length": fileSize.toString(),
                "X-Video-Title": encodeURIComponent(realTitle),
                "X-Video-Thumbnail": encodeURIComponent(thumbnail),
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        const err = error as Error;
        console.error("CRITICAL API Error:", err.message);
        return new Response(JSON.stringify({ error: "Failed to process stream", details: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}