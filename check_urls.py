import concurrent.futures
import requests
import re
import csv
import urllib3
import logging
import sys

# Suppress insecure request warnings for unverified HTTPS requests
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def main():
    with open('urls_to_check.txt', 'r', encoding='utf-8') as f:
        url_list = [u.strip() for u in f.read().split('\n') if u.strip()]

    cleaned_urls = []
    for u in url_list:
        if not u.startswith('http'):
            cleaned_urls.append('https://' + u)
        else:
            cleaned_urls.append(u)

    print(f"Checking {len(cleaned_urls)} URLs...")
    results = []
    
    def check_url(url):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
        try:
            req = requests.get(url, headers=headers, timeout=15, verify=False, allow_redirects=True)
            status = req.status_code
            
            if status == 200:
                text = req.text
                title_match = re.search(r'<title>(.*?)</title>', text, re.IGNORECASE | re.DOTALL)
                title = title_match.group(1).strip() if title_match else "(No Title)"
                title = title.replace('\n', ' ').replace('\r', ' ')
                
                lower_text = text.lower()
                if 'hugedomains' in lower_text or 'domain parked' in lower_text or 'buy this domain' in lower_text or 'this domain is for sale' in lower_text:
                    return url, 'Parked/For Sale', title
                elif '404 not found' in lower_text and len(text) < 10000:
                     return url, '404 Content', title
                elif len(text) < 200:
                    return url, f'Empty/Very Short (len: {len(text)})', title
                else:
                    return url, 'Valid', title
            else:
                return url, f'HTTP {status}', '-'
                
        except requests.exceptions.Timeout:
            return url, 'Timeout', '-'
        except requests.exceptions.ConnectionError:
            return url, 'Connection Error (DNS/Offline)', '-'
        except Exception as e:
            err = str(e)
            if "TooManyRedirects" in err:
                return url, 'Too Many Redirects', '-'
            return url, f'Error', '-'

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(check_url, u): u for u in cleaned_urls}
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            url = futures[future]
            try:
                res = future.result()
                results.append(res)
                if (i+1) % 20 == 0:
                    print(f"Checked {i+1}/{len(cleaned_urls)}")
            except Exception as e:
                results.append((url, 'Error Exception', '-'))
                pass
                
    # Sort results
    results.sort(key=lambda x: (x[1] == 'Valid', x[1], x[0]))

    with open('url_check_results.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['URL', 'Status', 'Title'])
        for r in results:
            writer.writerow(r)
            
    # Print summary
    failed = [r for r in results if r[1] != 'Valid']
    valid_count = len([r for r in results if r[1] == 'Valid'])
    broken_count = len(failed)
    print(f"Total: {len(results)}")
    print(f"Valid (200 OK + Content): {valid_count}")
    print(f"Failed or Suspicious: {broken_count}")
    
    # Save the invalid ones to a separate text file
    with open('broken_urls.txt', 'w', encoding='utf-8') as f:
        for r in failed:
            f.write(f"{r[0]} | {r[1]} | {r[2]}\n")

if __name__ == '__main__':
    main()
