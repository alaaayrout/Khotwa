import json
from pathlib import Path

p = Path(__file__).resolve().parent.parent / 'postman' / 'Full_Backend_Foldered.postman_collection.json'
out = Path(__file__).resolve().parent.parent / 'postman' / 'Full_Backend_Foldered.fixed.postman_collection.json'

def normalize_item(it):
    if isinstance(it, dict):
        if 'request' in it and isinstance(it['request'], dict):
            req = it['request']
            if 'url' in req and isinstance(req['url'], dict):
                raw = req['url'].get('raw')
                if raw:
                    req['url'] = raw
        for k,v in it.items():
            if isinstance(v, (list, dict)):
                normalize_item(v)
    elif isinstance(it, list):
        for elem in it:
            normalize_item(elem)

try:
    data = json.loads(p.read_text(encoding='utf-8'))
except Exception as e:
    print('ERROR loading JSON:', e)
    raise

normalize_item(data)
out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
print('WROTE', out)
