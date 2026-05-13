import json
import argparse

def filter_businesses(input_file, output_file):
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: file '{input_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: '{input_file}' is not valid JSON.")
        return

    # keep only businesses that do NOT have their own website
    filtered_results = [b for b in data if b.get("webPresence") != "own_website"]

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(filtered_results, f, indent=2, ensure_ascii=False)

    print(f"\n--- Done ---")
    print(f"Input: {input_file} | Output: {output_file}")
    print(f"Original: {len(data)} | Filtered: {len(filtered_results)}")
    print(f"Removed:  {len(data) - len(filtered_results)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Filters out businesses that already have their own website.')
    parser.add_argument('input_file',  help='Path to the original JSON file')
    parser.add_argument('output_file', help='Path where the filtered JSON will be saved')
    args = parser.parse_args()
    filter_businesses(args.input_file, args.output_file)
