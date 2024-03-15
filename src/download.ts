import https from 'https';
import fs from 'fs';
import AdmZip from 'adm-zip';
import tar from 'tar';
import path from 'path';
import { createDecompressor } from 'lzma-native';
import { once } from 'events';

import child_process from 'child_process';

const downloadDirectory = path.join(__dirname, '../downloads');
const artifactDirectory = path.join(__dirname, '../artifacts');

function replaceAll(str: string, find: string, replace: string): string {
    return str.replace(new RegExp(find, 'g'), replace);
}

async function unzipFfmpeg(zipPath: string, ffmpegZipPath = 'ffmpeg', platform: typeof process.platform, arch: typeof process.arch, version: string, suffix = '') {
    console.log('extracting', zipPath);
    const zip = new AdmZip(zipPath);
    const filename = `ffmpeg-${platform}-${arch}-${version}${suffix}`;
    const ffmpegPath = path.join(artifactDirectory, filename);
    zip.extractEntryTo(ffmpegZipPath, artifactDirectory, false, true, false, filename);
    return ffmpegPath;
}

async function untarFfmpeg(tarxzPath: string, platform: typeof process.platform, arch: typeof process.arch, version: string, suffix = '') {
    console.log('extracting', tarxzPath);
    const filename = `ffmpeg-${platform}-${arch}-${version}${suffix}`;
    const extractPath = path.join(downloadDirectory, filename + '.tmp');

    fs.promises.mkdir(extractPath, { recursive: true });
    const cp = child_process.spawn('tar', ['xvf', tarxzPath, '-C', extractPath, '--strip-components=1']);
    await once(cp, 'exit');
    const ffmpegPath = path.join(artifactDirectory, filename);
    await fs.promises.rename(path.join(extractPath, 'ffmpeg'), ffmpegPath);
    return ffmpegPath;
}

async function downloadFile(url: string, platform: string, arch: string, version: string, suffix = path.extname(url)) {
    const filename = `ffmpeg-${platform}-${arch}-${version}${suffix}`;
    const downloadPath = path.join(downloadDirectory, filename);
    if (fs.existsSync(downloadPath))
        return downloadPath;

    console.log('downloading', {
        url,
        downloadPath
    });
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
    return untarFfmpeg(ffmpegzip, 'linux', 'x64', packageVersion);
}

async function downloadLinuxArm64(version = 'release') {
    const ffmpegzip = await downloadFile(`https://johnvansickle.com/ffmpeg/releases/ffmpeg-${version}-arm64-static.tar.xz`, 'linux', 'arm64', version, '.tar.xz');
    return untarFfmpeg(ffmpegzip, 'linux', 'arm64', packageVersion);
}

async function downloadWindowsX64(version: string) {
    const ffmpegzip = await downloadFile(`https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-${version}-essentials_build.zip`, 'win32', 'x64', version);
    return unzipFfmpeg(ffmpegzip, `ffmpeg-${version}-essentials_build/bin/ffmpeg.exe`, 'win32', 'x64', packageVersion, '.exe');
}

async function main(platform: typeof process.platform, arch: typeof process.arch) {
    await fs.promises.mkdir(downloadDirectory, { recursive: true });
    await fs.promises.mkdir(artifactDirectory, { recursive: true });

    if (!platform || platform === 'darwin') {
        if (!arch || arch === 'x64')
            await downloadMacX64('6.1');
        if (!arch || arch === 'arm64')
            await downloadMacAppleArm64('6.1.1');
    }

    if (!platform || platform === 'linux') {
        if (!arch || arch === 'x64')
            await downloadLinuxX64();
        if (!arch || arch === 'arm64')
            await downloadLinuxArm64();
    }

    if (!platform || platform === 'win32') {
        if (!arch || arch === 'x64')
            await downloadWindowsX64('6.1.1');
    }
}

main(process.argv[2] as any, process.argv[3] as any);
