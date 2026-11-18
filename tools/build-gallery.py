from pathlib import Path
from PIL import Image
import re

root = Path('projects/foto/концерты и фестивали')
files = sorted(root.rglob('*.jpg'))
entries = []
for path in files:
    event = path.parent.name
    width, height = Image.open(path).size
    event_lower = event.lower()
    meta = 'Концерт' if ('концерт' in event_lower or 'электропартизаны' in event_lower or 'карбаш' in event_lower) else 'Фестиваль'
    rel = path.as_posix()
    entries.append(
        f"    {{ src: '{rel}', w: {width}, h: {height},\n"
        f"      title: '{event}', event: '{event}', meta: '{meta}', year: 2024,\n"
        f"      tags: ['reportage'], alt: '{meta}: {event}' }}"
    )

block = '  photos: [\n' + ',\n'.join(entries) + '\n  ],'
content_path = Path('assets/js/content.js')
text = content_path.read_text(encoding='utf-8')
text = re.sub(r'  photos: \[.*?\n  \],\n\n  films:', block + '\n\n  films:', text, count=1, flags=re.S)
content_path.write_text(text, encoding='utf-8')
print(f'Added {len(entries)} gallery photos')
