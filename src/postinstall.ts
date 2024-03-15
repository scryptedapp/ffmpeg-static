import fs from 'fs';
import { artifactDirectory, downloadFileCommon, getFfmpegPaths } from "./common";


const packageJson = require('../package.json');

const version = packageJson.version.split('-')[0];
console.log(version);

let url = `${packageJson.repository.url.replace('.git', '')}/releases/download/v${version}/ffmpeg-${process.platform}-${process.arch}${process.platform === 'win32' ? '.exe' : ''}`;

url = url.substring(url.indexOf('https://'));
console.log(url);

const { ffmpegPath } = getFfmpegPaths();

console.log(ffmpegPath);
async function install() {
    await fs.promises.mkdir(artifactDirectory, { recursive: true });
    await downloadFileCommon(url, ffmpegPath);
}

install();
