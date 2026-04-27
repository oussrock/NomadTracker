import axios from 'axios';
import fs from 'fs';
import path from 'path';

const url = 'https://player.vimeo.com/external/370331493.sd.mp4?s=7b2315859067205e4664468202d64a2c51000673&profile_id=139&oauth2_token_id=57447761';
const outputPath = path.resolve('../client/public/waves.mp4');

async function download() {
    console.log('Downloading video...');
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

download().then(() => console.log('Done!')).catch(console.error);
