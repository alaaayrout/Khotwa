import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent / 'src'
pattern = re.compile(r"\b(?:export\s+default\s+function|export\s+function|function)\s+([A-Za-z0-9_]+)|\b(?:export\s+const|const)\s+([A-Za-z0-9_]+)\s*=\s*\(?[^=]*=>")

print('DEBUG root=', root)
files = sorted(list(root.rglob('*.js')) + list(root.rglob('*.jsx')))
print('DEBUG file counts=', len(files))
result = []
for f in files:
    if 'node_modules' in str(f):
        continue
    text = f.read_text(encoding='utf-8')
    names = []
    for m in pattern.finditer(text):
        name = next((g for g in m.groups() if g), None)
        if name and name not in names:
            names.append(name)
    if names:
        result.append((f.relative_to(root), names))

for path, names in result:
    print(path)
    for name in names:
        print('  -', name)
