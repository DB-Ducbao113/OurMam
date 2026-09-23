import os
import re

def check_imports(file):
    with open(file, 'r') as f:
        content = f.read()
    
    imports = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', content)
    for imp in imports:
        clean_imp = imp.split("?")[0]
        dir_name = os.path.dirname(file)
        full_path = os.path.normpath(os.path.join(dir_name, clean_imp))
        if not os.path.exists(full_path) and not full_path.endswith(".js"):
            full_path += ".js"
        if not os.path.exists(full_path):
            print(f"MISSING IMPORT: {clean_imp} in {file}")

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.js'):
            check_imports(os.path.join(root, f))
