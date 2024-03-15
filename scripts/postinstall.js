if (process.env.SKIP_INSTALL) {
    console.log('skipping binary installation.');
    process.exit(0);
}

require('../dist/postinstall');
