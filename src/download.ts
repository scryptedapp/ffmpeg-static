import https from 'https';
import fs from 'fs';
import AdmZip from 'adm-zip';
import tar from 'tar';
import path from 'path';
import { createDecompressor } from 'lzma-native';
import { once } from 'events';

import child_process from 'child_process';

const downloadDirectory = path.join(__dirname, '../downloads');

function replaceAll(str: string, find: string, replace: string): string {
    return str.replace(new RegExp(find, 'g'), replace);
}

function removeExtension(filename: string): string {
    return path.parse(filename).name;
}

async function unzipFfmpeg(zipPath: string, ffmpegZipPath = 'ffmpeg', platform: string, arch: string, version: string, suffix = '') {
    const zip = new AdmZip(zipPath);
    const filename = `ffmpeg-${platform}-${arch}-${version}${suffix}`;
    const ffmpegPath = path.join(path.dirname(zipPath), filename);
    zip.extractEntryTo(ffmpegZipPath, path.dirname(zipPath), false, true, false, filename);
    return path.join(path.dirname(zipPath), ffmpegPath);
}

async function untarFfmpeg(tarxzPath: string, ffmpegTarPath = 'ffmpeg', platform: string, arch: string, version: string,  suffix = '') {
    const ffmpegPath = path.join(path.dirname(tarxzPath), `ffmpeg-${platform}-${arch}-${version}${suffix}`);

    const extractDir = ffmpegPath + '.tmp';
    fs.promises.mkdir(extractDir, { recursive: true });
    const cp = child_process.spawn('tar', ['xzvf', tarxzPath, '-C', extractDir, '--strip-components=1'], {
        stdio: 'inherit',
    });
    await once (cp,'exit');
    await fs.promises.rename(path.join(extractDir, 'ffmpeg'), ffmpegPath);
    return ffmpegPath;
}

async function downloadFile(url: string, platform: string, arch: string, version: string, suffix = path.extname(url)) {
    const u = new URL(url);
    const filename = `ffmpeg-${platform}-${arch}-${version}${suffix}`;
    const downloadPath = path.join(downloadDirectory, filename);
    if (fs.existsSync(downloadPath))
        return downloadPath;

    await fs.promises.mkdir(downloadDirectory, { recursive: true });
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

const packageVersion = '6.1';

async function downloadMacX64(version: string) {
    const ffmpegzip = await downloadFile(`https://www.osxexperts.net/ffmpeg${replaceAll(version, '\\.', '')}intel.zip`, 'darwin', 'x64', version);
    return unzipFfmpeg(ffmpegzip, 'ffmpeg', 'darwin', 'x64', packageVersion);
}

async function downloadMacAppleArm64(version: string) {
    const ffmpegzip = await downloadFile(`https://www.osxexperts.net/ffmpeg${replaceAll(version, '\\.', '')}arm.zip`, 'darwin', 'arm64', version);
    return unzipFfmpeg(ffmpegzip, 'ffmpeg', 'darwin', 'arm64', packageVersion);
}

async function downloadLinuxX64(version = 'release') {
    const ffmpegzip = await downloadFile(`https://johnvansickle.com/ffmpeg/releases/ffmpeg-${version}-amd64-static.tar.xz`, 'linux', 'x64', version, '.tar.xz');
    return untarFfmpeg(ffmpegzip, 'ffmpeg', 'linux', 'x64', packageVersion);
}

async function downloadLinuxArm64(version = 'release') {
    const ffmpegzip = await downloadFile(`https://johnvansickle.com/ffmpeg/releases/ffmpeg-${version}-arm64-static.tar.xz`, 'linux', 'x64', version, '.tar.xz');
    return untarFfmpeg(ffmpegzip, 'ffmpeg', 'linux', 'arm64', packageVersion);
}


async function main() {
    await downloadMacX64('6.1');
    await downloadMacAppleArm64('6.1.1');

    await downloadLinuxX64();
    await downloadLinuxArm64();
}

main();
