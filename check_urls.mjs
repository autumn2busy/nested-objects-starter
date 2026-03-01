import fs from 'fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const urlsList = fs.readFileSync('urls_to_check.txt', 'utf-8')
    .split('\n')
    .map(u => u.trim())
    .filter(u => u);

const cleaned_urls = urlsList.map(u => u.startsWith('http') ? u : 'https://' + u);

const results = [];

async function checkUrl(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            },
            signal: controller.signal,
            redirect: 'follow'
        });
        clearTimeout(timeoutId);

        const status = response.status;

        if (status === 200) {
            const text = await response.text();
            let title = '(No Title)';
            const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1].trim().replace(/\r?\n|\r/g, ' ');
            }

            const lowerText = text.toLowerCase();
            if (lowerText.includes('hugedomains') || lowerText.includes('domain parked') || lowerText.includes('buy this domain') || lowerText.includes('this domain is for sale')) {
                return { url, status: 'Parked/For Sale', title };
            } else if (lowerText.includes('404 not found') && text.length < 10000) {
                return { url, status: '404 Content', title };
            } else if (text.length < 200) {
                return { url, status: `Empty/Very Short (len: ${text.length})`, title };
            } else {
                return { url, status: 'Valid', title };
            }
        } else {
            return { url, status: `HTTP ${status}`, title: '-' };
        }
    } catch (e) {
        let errStr = e.toString();
        if (errStr.includes('AbortError')) {
            return { url, status: 'Timeout', title: '-' };
        } else if (errStr.includes('fetch failed') || errStr.includes('ENOTFOUND') || errStr.includes('ECONNREFUSED')) {
            return { url, status: 'Connection Error (DNS/Offline)', title: '-' };
        } else {
            return { url, status: 'Error: ' + errStr, title: '-' };
        }
    }
}

async function main() {
    console.log(`Checking ${cleaned_urls.length} URLs...`);

    const concurrency = 20;
    for (let i = 0; i < cleaned_urls.length; i += concurrency) {
        const batch = cleaned_urls.slice(i, i + concurrency);
        const batchResults = await Promise.all(batch.map(checkUrl));
        results.push(...batchResults);
        console.log(`Checked ${Math.min(i + concurrency, cleaned_urls.length)}/${cleaned_urls.length}`);
    }

    results.sort((a, b) => {
        if (a.status === 'Valid' && b.status !== 'Valid') return -1;
        if (a.status !== 'Valid' && b.status === 'Valid') return 1;
        if (a.status < b.status) return -1;
        if (a.status > b.status) return 1;
        return a.url.localeCompare(b.url);
    });

    let csvContent = 'URL,Status,Title\n';
    for (const r of results) {
        const safeTitle = r.title ? r.title.replace(/"/g, '""') : '';
        csvContent += `"${r.url}","${r.status}","${safeTitle}"\n`;
    }
    fs.writeFileSync('url_check_results.csv', csvContent);

    const validCount = results.filter(r => r.status === 'Valid').length;
    const failedCount = results.length - validCount;

    console.log(`Total: ${results.length}`);
    console.log(`Valid (200 OK + Content): ${validCount}`);
    console.log(`Failed or Suspicious: ${failedCount}`);

    let brokenContent = '';
    for (const r of results) {
        if (r.status !== 'Valid') {
            brokenContent += `${r.url} | ${r.status} | ${r.title}\n`;
        }
    }
    fs.writeFileSync('broken_urls.txt', brokenContent);
}

main();
