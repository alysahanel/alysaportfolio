const http = require('http');

function check(url) {
    console.log(`Checking ${url}...`);
    http.get(url, (res) => {
        console.log(`[${url}] Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log(`[${url}] Success. Content preview:`, data.substring(0, 100).replace(/\n/g, ' '));
            } else {
                console.log(`[${url}] Failed.`);
            }
        });
    }).on('error', (e) => {
        console.error(`Error: ${e.message}`);
    });
}

check('http://localhost:3000/legal/assets/global-sidebar.js');
check('http://localhost:3000/legal/assets/sidebar.html');
