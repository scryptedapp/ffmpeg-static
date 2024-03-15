import path from 'path';
import fs from 'fs';
import https from 'https';

export const artifactDirectory = path.join(__dirname, '../artifacts');
export const downloadDirectory = path.join(__dirname, '../downloads');

export function getFfmpegPaths(platform = process.platform, arch = process.arch, suffix = platform === 'win32' ? '.exe' : '') {
    const filename = `ffmpeg-${platform}-${arch}${suffix}`;
    const ffmpegPath = path.join(artifactDirectory, filename);

    return {
        filename,
        ffmpegPath,
    }
}

export async function downloadFileCommon(url: string, downloadPath: string) {
    const file = fs.createWriteStream(downloadPath);
    await new Promise((resolve, reject) => {
        https.get(url, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', error => {
            fs.unlink(downloadPath, () => { });
            reject(error.message);
        });
    });

    return downloadPath;
}
