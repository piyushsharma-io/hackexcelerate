import urllib.request
import json
import os

url = "https://reactbits.dev/r/MoltenMetal-JS-CSS.json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
dest_dir = "/home/user/aegis-app/src/components/react-bits"

with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    for f in data.get('files', []):
        path = os.path.join(dest_dir, f.get('path'))
        with open(path, 'w', encoding='utf-8') as out:
            out.write(f.get('content'))
        print(f"Saved {path}")
