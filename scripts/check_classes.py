"""Analyze JS-emitted class names vs CSS selectors to find style mismatches."""
import re, sys

JS, CSS = 'app.js', 'style.css'

js = open(JS).read()
css = open(CSS).read()

# JS-emitted classes: className assignments and template-literal class= attributes
js_classes = set()
for m in re.finditer(r"className\s*=\s*`([^`]*)`", js):
    for tok in m.group(1).split():
        # strip ${...} interpolation
        clean = re.sub(r'\$\{[^}]*\}', '', tok)
        if clean and re.fullmatch(r'[\w-]+', clean):
            js_classes.add(clean)
for m in re.finditer(r'class="([^"]+)"', js):
    for tok in m.group(1).split():
        clean = re.sub(r'\$\{[^}]*\}', '', tok)
        if clean and re.fullmatch(r'[\w-]+', clean):
            js_classes.add(clean)

css_selectors = set(re.findall(r'\.([A-Za-z_][\w-]*)', css))
# also attribute-class selectors like [class*="badge-green"]
for m in re.finditer(r'\[class[\^$|*]?="([^"]+)"', css):
    css_selectors.add(m.group(1).strip('.^$*'))

badges = {c for c in css_selectors if c.startswith('badge-')} | \
         {c.split(' ')[0] for c in css_selectors if c.startswith('badge-')}

clean_js = sorted({c for c in js_classes if re.fullmatch(r'[\w-]+', c) and c != 's'})
missing = [c for c in clean_js if c not in css_selectors]

print('JS emitted classes:', len(clean_js))
print('CSS selectors:', len(css_selectors))
print()
print('JS classes with NO CSS rule:')
for c in missing:
    print('  ', c)
