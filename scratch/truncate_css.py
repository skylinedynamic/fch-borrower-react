
import os

file_path = r'c:\laragon\www\borrower-fch\assets\css\custom.min.css'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Truncate to the part before the corruption
# We know the clean part was added and then corruption followed.
# Let's find the first occurrence of corrupted pattern or just use the index we found.
# Actually, we know the clean CSS starts with "/* Resource Hub Styles */"
# and the corrupted one looks like " / *   R e s o u r c e ..."

clean_limit = 6264 # Based on previous view_file
new_lines = lines[:clean_limit]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"Truncated file to {clean_limit} lines.")
