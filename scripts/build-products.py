import json, re, html as html_lib

with open('C:/Users/MANID/Downloads/westside_dataset/Garments_dataset/products_men.json') as f:
    men = json.load(f)
with open('C:/Users/MANID/Downloads/westside_dataset/Garments_dataset/products_women.json') as f:
    women = json.load(f)

VTON_MAP = {
    'T-Shirts': 'upper', 'Polo Shirts': 'upper', 'Casual Shirts': 'upper',
    'Formal Shirts': 'upper', 'Jackets': 'upper', 'Ethnic Tops': 'upper',
    'Formal Tops': 'upper', 'Tops': 'upper', 'Kurtas': 'upper',
    'Tunics': 'upper', 'Ethnic Suits': 'upper',
    'Jeans': 'lower', 'Casual Trousers | Chinos': 'lower',
    'Formal Trousers': 'lower', 'Joggers | Shorts': 'lower',
    'Ethnic Pants': 'lower', 'Shorts': 'lower', 'Trousers': 'lower',
    'Skirts': 'lower',
    'Dresses': 'one-pieces', 'Ethnic Dresses': 'one-pieces',
    'Loungewear': 'one-pieces', 'Night Suit': 'one-pieces',
}

CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
WAIST_SIZES = ['26','28','30','32','34','36','38','40','42','44']

def clean_html(s):
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html_lib.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

def get_sizes(tags):
    clothing = [t for t in tags if t in CLOTHING_SIZES]
    waist = [t for t in tags if t in WAIST_SIZES]
    if clothing:
        order = {s: i for i, s in enumerate(CLOTHING_SIZES)}
        return sorted(set(clothing), key=lambda x: order.get(x, 99))
    if waist:
        return sorted(set(waist), key=int)
    return ['S', 'M', 'L', 'XL']

def quote_list(lst):
    return '[' + ', '.join(json.dumps(x) for x in lst) + ']'

def to_ts(p, idx, gender):
    pid = f"{'m' if gender == 'male' else 'w'}{idx+1}"
    title = p['title']
    handle = p['handle']
    desc = clean_html(p['description'])[:200]
    ptype = p['product_type']
    vendor = p['vendor']
    price = int(float(p['price']))
    vcat = VTON_MAP.get(p['product_type'], 'upper')
    images = quote_list(p['image_urls'][:2])
    skip_words = ['DISC', 'FL_', 'New Flag', 'New In', 'Rs.', '- Rs.', 'online', 'westside', 'Gents']
    tags_clean = [t for t in p['tags'] if not any(x in t for x in skip_words)][:12]
    sizes = get_sizes(p['tags'])

    block = f"""  {{
    id: {json.dumps(pid)},
    title: {json.dumps(title)},
    handle: {json.dumps(handle)},
    description: {json.dumps(desc)},
    product_type: {json.dumps(ptype)},
    vendor: {json.dumps(vendor)},
    gender: {json.dumps(gender)},
    price: {price},
    available: true,
    image_urls: {images},
    tags: {quote_list(tags_clean)},
    sizes: {quote_list(sizes)},
    vton_category: {json.dumps(vcat)},
  }}"""
    return block

lines = ['import { Product } from "@/types";\n\nexport const DEMO_PRODUCTS: Product[] = [']

lines.append('\n  // ── WOMEN ──────────────────────────────────────────────────────────────────')
for i, p in enumerate(women):
    comma = ',' if True else ''  # always comma except last
    lines.append(to_ts(p, i, 'female') + ',')

lines.append('\n  // ── MEN ────────────────────────────────────────────────────────────────────')
for i, p in enumerate(men):
    comma = ',' if i < len(men) - 1 else ''
    lines.append(to_ts(p, i, 'male') + comma)

lines.append('];\n')

output = '\n'.join(lines)
with open('C:/Users/MANID/Downloads/westside-storefront/data/products.ts', 'w', encoding='utf-8') as f:
    f.write(output)

print(f"Written {len(women)} women + {len(men)} men = {len(women)+len(men)} total products")
