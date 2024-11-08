if (process.env.SKIP_INSTALL) {
    console.log('skipping binary installation. SKIP_INSTALL is set.');
    process.exit(0);
}

const fs = require('fs');
if (process.env.SCRYPTED_FFMPEG_PATH && fs.existsSync(process.env.SCRYPTED_FFMPEG_PATH)) {
    console.log('skipping binary installation. SCRYPTED_FFMPEG_PATH is set.');
    process.exit(0);
}

require('../dist/postinstall');
