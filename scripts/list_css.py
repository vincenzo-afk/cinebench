import re
css = open('style.css').read()
sels = sorted({m.group(1) for m in re.finditer(r'\.([A-Za-z_][\w-]*)', css)})
print('\n'.join(sels))
