import json
import os

# Path to the JSON file
json_file_path = 'urls.json'

# Load the JSON data
with open(json_file_path, 'r') as file:
    urls = json.load(file)["Items"]

# Directory to save the HTML files
output_dir = '../m'
os.makedirs(output_dir, exist_ok=True)

# Create an text file for each key containing the full options string.
for item in urls:
    key = item["shortKey"]['S']
    opts = item["originalURL"]['S']
    
    # Main
    file_path = os.path.join(output_dir, f'{key}.txt')
    with open(file_path, 'w') as txt_file:
        txt_file.write(opts)

print("TXT files created successfully.")