import urllib.request
import json
import os

components = [
    ("TargetCursor-JS-CSS", "TargetCursor"),
    ("DitherVeil-JS-CSS", "DitherVeil"),
    ("MagicBento-JS-CSS", "MagicBento"),
    ("Lanyard-JS-CSS", "Lanyard"),
    ("FlowingMenu-JS-CSS", "FlowingMenu"),
    ("Lightfall-JS-CSS", "Lightfall")
]

base_dir = "/home/user/aegis-app/src/components/react-bits"
os.makedirs(base_dir, exist_ok=True)

for slug, name in components:
    url = f"https://reactbits.dev/r/{slug}.json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Downloaded {name}: {len(data.get('files', []))} files")
            for f in data.get('files', []):
                fname = f.get('path')
                content = f.get('content')
                out_path = os.path.join(base_dir, fname)
                with open(out_path, 'w', encoding='utf-8') as out:
                    out.write(content)
                print(f"  Wrote {out_path}")
    except Exception as e:
        print(f"Error for {name}: {e}")

