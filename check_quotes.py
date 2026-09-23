import re

def check_quotes(file):
    with open(file, 'r') as f:
        content = f.read()
    
    # Strip comments to avoid false positives
    content = re.sub(r'//.*', '', content)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    s_quote = content.count("'")
    d_quote = content.count('"')
    b_quote = content.count('`')
    print(f"{file}: '={s_quote}, \"={d_quote}, `={b_quote}")

check_quotes('src/components/authView.js')
check_quotes('src/main.js')
check_quotes('src/components/modals.js')
check_quotes('src/components/locketFeed.js')
