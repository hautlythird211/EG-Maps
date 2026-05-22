#!/usr/bin/env python3
import json
import os
import time
import urllib.request
import urllib.parse
import urllib.error

SPECIES_JSON = "public/data/species.json"
IMAGES_DIR = "public/images/species"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

API_URL = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "EG-Maps/1.0 (data enrichment)"
BASE_SLEEP = 2.0
MAX_RETRIES = 5

def is_valid_jpeg(path):
    try:
        with open(path, "rb") as f:
            header = f.read(3)
        return header == b"\xff\xd8\xff"
    except Exception:
        return False

def api_request(params):
    params["format"] = "json"
    url = API_URL + "?" + urllib.parse.urlencode(params)
    for attempt in range(MAX_RETRIES):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = BASE_SLEEP * (2 ** attempt)
                print(f"    [RATE-LIMITED] API, retrying in {wait:.0f}s (attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(wait)
                continue
            else:
                print(f"    [ERROR] API HTTP {e.code}: {e}")
                return None
        except Exception as e:
            print(f"    [ERROR] API request failed: {e}")
            return None
    print(f"    [ERROR] API still rate-limited after {MAX_RETRIES} retries")
    return None

def search_commons_image(scientific_name):
    params = {
        "action": "query",
        "list": "search",
        "srsearch": scientific_name,
        "srnamespace": 6,
        "srlimit": 5,
    }
    data = api_request(params)
    if not data or "query" not in data or "search" not in data["query"]:
        return None
    results = data["query"]["search"]
    if not results:
        return None
    for result in results:
        title = result["title"]
        file_params = {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url",
        }
        file_data = api_request(file_params)
        if not file_data:
            continue
        pages = file_data.get("query", {}).get("pages", {})
        for page_id, page_info in pages.items():
            if page_id == "-1":
                continue
            imageinfo = page_info.get("imageinfo", [])
            if imageinfo:
                return imageinfo[0].get("url")
    return None

def download_image(url, filepath):
    for attempt in range(MAX_RETRIES):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
            if len(data) < 100:
                return False
            with open(filepath, "wb") as f:
                f.write(data)
            return True
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = BASE_SLEEP * (2 ** attempt)
                print(f"    [RATE-LIMITED] Download, retrying in {wait:.0f}s (attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(wait)
                continue
            else:
                print(f"    [ERROR] Download HTTP {e.code}: {e}")
                return False
        except Exception as e:
            print(f"    [ERROR] Download failed: {e}")
            return False
    print(f"    [ERROR] Download still rate-limited after {MAX_RETRIES} retries")
    return False

def needs_download(filepath):
    if not os.path.exists(filepath):
        return True
    return not is_valid_jpeg(filepath)

def main():
    json_path = os.path.join(BASE_DIR, SPECIES_JSON)
    with open(json_path, "r") as f:
        species_list = json.load(f)

    pending = [s for s in species_list if needs_download(os.path.join(BASE_DIR, IMAGES_DIR, os.path.basename(s["imageUrl"])))]
    already_ok = len(species_list) - len(pending)

    print(f"Loaded {len(species_list)} species. {already_ok} already valid, {len(pending)} need download.")
    print()

    stats = {"downloaded": 0, "not_found": 0, "failed": 0}

    for idx, species in enumerate(pending):
        sid = species["id"]
        name = species["scientificName"]
        filename = os.path.basename(species["imageUrl"])
        filepath = os.path.join(BASE_DIR, IMAGES_DIR, filename)

        print(f"[{idx+1}/{len(pending)}] [{sid}] {name}")

        print(f"    Searching Commons...")
        time.sleep(BASE_SLEEP)
        result_url = search_commons_image(name)

        if not result_url:
            print(f"    NOT FOUND on Wikimedia Commons")
            stats["not_found"] += 1
            continue

        print(f"    Found: {result_url}")
        time.sleep(BASE_SLEEP)
        success = download_image(result_url, filepath)

        if success and is_valid_jpeg(filepath):
            size = os.path.getsize(filepath)
            print(f"    DOWNLOADED ({size} bytes)")
            stats["downloaded"] += 1
        else:
            print(f"    FAILED")
            stats["failed"] += 1

        print()

    print("=" * 60)
    print("SUMMARY")
    print(f"  Already valid:     {already_ok}")
    print(f"  Downloaded:        {stats['downloaded']}")
    print(f"  Not found on Com:  {stats['not_found']}")
    print(f"  Failed:            {stats['failed']}")
    print(f"  Total processed:   {len(species_list)}")

if __name__ == "__main__":
    main()
