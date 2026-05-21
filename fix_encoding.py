import codecs

file_path = 'public/data/species.json'

print('Reading file...')
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

print(f'File size: {len(raw_bytes)} bytes')

# The issue: UTF-8 text was incorrectly decoded as Latin-1, then re-encoded as UTF-8
# To fix: interpret the current UTF-8 bytes as if they were Latin-1, then encode as proper UTF-8

# Step 1: Read the current UTF-8 bytes as if they were Latin-1 characters
latin1_text = raw_bytes.decode('latin-1')

# Step 2: Re-encode those characters as proper UTF-8
fixed_bytes = latin1_text.encode('utf-8')

# Step 3: Write back as UTF-8
with open(file_path, 'wb') as f:
    f.write(fixed_bytes)

print('File encoding fixed and saved!')

# Verify by parsing
import json
with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(f'JSON valid! Total species: {len(data)}')