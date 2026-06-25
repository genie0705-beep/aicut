const https = require('https');
const http = require('http');

const BASE_URL = 'https://editmon.com/work';
const LIST_URL = BASE_URL + '/employ_list.html';
const MAX_PAGES = 10;
const MAX_CONCURRENT = 5;

const allResults = [];
const failedPosts = [];
const seenNos = new Set();

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { timeout: 15000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ data, status: res.statusCode }));
        }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
    });
}

function extractPostLinks(html, pageSource) {
    const links = [];
    // Match: href="/work/employ_detail.html?no=XXXX" or href="employ_detail.html?no=XXXX"
    const regex = /href=["']([^"']*employ_detail\.html\?no=(\d+))["']/g;
    const seen = new Set();
    let match;
    while ((match = regex.exec(html)) !== null) {
        const no = match[2];
        let href = match[1];
        if (!seen.has(no)) {
            seen.add(no);
            const url = href.startsWith('http') ? href : (href.startsWith('/') ? 'https://editmon.com' + href : BASE_URL + '/' + href);
            links.push({ no, url, pageSource });
        }
    }
    return links;
}

function extractTitleAndCompany(html, no) {
    let company = '';
    let title = '';
    
    // Extract company from <h4>
    const h4Match = html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
    if (h4Match) company = h4Match[1].replace(/<[^>]+>/g, '').trim();
    
    // Extract title from <strong> or <b> or after "모집제목"
    const titleMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (titleMatch) title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    
    // Try table - 제목 row
    const titleRowRegex = /<th[^>]*>[\s]*제목[\s]*<\/th>[\s]*<td[^>]*>([\s\S]*?)<\/td>/i;
    const titleRow = html.match(titleRowRegex);
    if (!title && titleRow) title = titleRow[1].replace(/<[^>]+>/g, '').trim();
    
    if (!title) {
        // Try strong tag right after h4
        const strongMatch = html.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
        if (strongMatch) title = strongMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    
    // If no company found from h4, try from table
    if (!company) {
        const compRowRegex = /<th[^>]*>[\s]*(?:업체명|회사명)[\s]*<\/th>[\s]*<td[^>]*>([\s\S]*?)<\/td>/i;
        const compRow = html.match(compRowRegex);
        if (compRow) company = compRow[1].replace(/<[^>]+>/g, '').trim();
    }
    
    return { company, title };
}

function extractEmail(html) {
    // First check mailto links
    const mailtoRegex = /<a[^>]*href=["']mailto:([^"']+)["'][^>]*>/i;
    const mailtoMatch = html.match(mailtoRegex);
    if (mailtoMatch) {
        let email = mailtoMatch[1].split('?')[0].trim();
        // URL decode
        email = decodeURIComponent(email);
        if (email.includes('@') && email.includes('.')) return email;
    }
    
    // Check for all mailto links  
    const allMailtoRegex = /href=["']mailto:([^"']+)["']/gi;
    const emails = [];
    let m;
    while ((m = allMailtoRegex.exec(html)) !== null) {
        let email = m[1].split('?')[0].trim();
        email = decodeURIComponent(email);
        if (email.includes('@') && email.includes('.') && !emails.includes(email)) {
            emails.push(email);
        }
    }
    if (emails.length > 0) return emails[0];
    
    // Try text-based email pattern in the page
    const textEmailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const textEmails = [];
    let tm;
    while ((tm = textEmailRegex.exec(html)) !== null) {
        const e = tm[0].trim().replace(/[<>()"]/g, '');
        if (!textEmails.includes(e)) textEmails.push(e);
    }
    
    // Filter out common false positives
    const valid = textEmails.filter(e => {
        const parts = e.split('@');
        return parts[1] && parts[1].includes('.') && !e.includes('example.com') && !e.includes('.png') && !e.includes('.jpg');
    });
    
    if (valid.length > 0) return valid[0];
    
    // Check for obfuscated emails
    const atEncoded = html.match(/[a-zA-Z0-9._%+-]+\s*&#64;\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (atEncoded) return atEncoded[0].replace(/&#64;/g, '@').replace(/\s+/g, '');
    
    return null;
}

async function processPost(post) {
    if (seenNos.has(post.no)) return;
    seenNos.add(post.no);
    
    try {
        const { data, status } = await fetchUrl(post.url);
        if (status !== 200) {
            failedPosts.push({ ...post, reason: `HTTP ${status}` });
            return;
        }
        
        const email = extractEmail(data);
        const { company, title } = extractTitleAndCompany(data, post.no);
        
        if (email) {
            allResults.push({
                no: post.no,
                company: company || 'N/A',
                title: title || 'N/A',
                email,
                url: post.url
            });
            console.log(`  ✅ #${post.no}: ${email} (${company || 'N/A'})`);
        } else {
            failedPosts.push({ ...post, company, title, reason: '이메일 찾을 수 없음' });
            console.log(`  ❌ #${post.no}: 이메일 없음`);
        }
    } catch (err) {
        failedPosts.push({ ...post, reason: `오류: ${err.message}` });
        console.log(`  ❌ #${post.no}: ${err.message}`);
    }
}

async function main() {
    console.log('편집몬 이메일 수집 시작...\n');
    
    for (let pn = 1; pn <= MAX_PAGES; pn++) {
        const url = pn === 1 ? LIST_URL : `${LIST_URL}?page=${pn}`;
        console.log(`\n=== 페이지 ${pn}: ${url} ===`);
        
        try {
            const { data } = await fetchUrl(url);
            const posts = extractPostLinks(data, pn);
            console.log(`  ${posts.length}개 게시물 발견`);
            
            // Process posts concurrently but in batches
            for (let i = 0; i < posts.length; i += MAX_CONCURRENT) {
                const batch = posts.slice(i, i + MAX_CONCURRENT);
                await Promise.all(batch.map(processPost));
            }
        } catch (err) {
            console.log(`  오류: ${err.message}`);
        }
    }
    
    // Remove duplicates (by URL)
    const seenUrls = new Set();
    const uniqueResults = allResults.filter(r => {
        if (seenUrls.has(r.url)) return false;
        seenUrls.add(r.url);
        return true;
    });
    allResults.length = 0;
    allResults.push(...uniqueResults);
    
    // Output
    console.log('\n\n========================================');
    console.log('=== 편집몬 이메일 수집 결과 ===');
    console.log(`총 ${allResults.length}개 게시물 수집 (1~${MAX_PAGES}페이지)`);
    console.log('========================================\n');
    
    allResults.forEach((r, idx) => {
        console.log(`${idx + 1}. ${r.company} - ${r.title}`);
        console.log(`   이메일: ${r.email}`);
        console.log(`   링크: ${r.url}`);
        console.log('');
    });
    
    if (failedPosts.length > 0) {
        console.log('\n수집 실패한 게시물:');
        failedPosts.forEach((r, idx) => {
            console.log(`  ${idx + 1}. #${r.no} (${r.company || 'N/A'} - ${r.title || 'N/A'})`);
            console.log(`     링크: ${r.url}`);
            console.log(`     사유: ${r.reason}`);
        });
    }
    
    const jsonResult = JSON.stringify({ success: allResults, failed: failedPosts });
    console.log('\n===JSON_START===');
    console.log(jsonResult);
    console.log('===JSON_END===');
    
    // Also save to file
    try {
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(__dirname, 'editmon_new_data.json'), jsonResult, 'utf-8');
    } catch(e) {
        console.error('파일저장실패:', e.message);
    }
}

main().catch(console.error);
