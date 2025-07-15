import os
import yaml
import json
import re
from tqdm import tqdm
from concurrent.futures import ThreadPoolExecutor

# 📁 Paths
SDE_ROOT = "sde"
UNIVERSE_PATHS = [
    os.path.join(SDE_ROOT, "universe", "eve"),
    os.path.join(SDE_ROOT, "universe", "hidden")
]
MARKET_GROUPS_PATH = os.path.join(SDE_ROOT, "fsd", "marketGroups.yaml")
TYPES_PATH = os.path.join(SDE_ROOT, "fsd", "types.yaml")
STATIONS_PATH = os.path.join(SDE_ROOT, "bsd", "staStations.yaml")


# 🧾 YAML Loader
def load_yaml(path):
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


# ✨ Region Name Formatter
def format_region_name(name):
    if name.lower() == "globalplexmarket":
        return "Global Plex Market"
    spaced = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', name)
    return spaced.strip().title()


# 🏭 Stations Extractor
def extract_stations():
    stations_raw = load_yaml(STATIONS_PATH) or []
    stations = {}
    for s in tqdm(stations_raw, desc="🏭 Stations"):
        sid = str(s.get("stationID"))
        if not sid:
            continue
        stations[sid] = {
            "stationID": sid,
            "stationName": s.get("stationName"),
            "solarSystemID": s.get("solarSystemID"),
            "regionID": s.get("regionID"),
            "constellationID": s.get("constellationID"),
            "stationTypeID": s.get("stationTypeID")
        }
    return stations


# 🌌 Locations Extractor
def extract_locations():
    locations = {}
    solar_futures = []
    metadata = []
    max_threads = min(8, os.cpu_count() or 4)
    constellation_count = 0
    system_count = 0

    region_map = {}
    for universe_root in UNIVERSE_PATHS:
        if not os.path.exists(universe_root):
            continue
        for region_name in os.listdir(universe_root):
            region_folder = os.path.join(universe_root, region_name)
            if os.path.isdir(region_folder):
                region_map[region_name] = region_folder

    print("🌌 Locations:")
    with ThreadPoolExecutor(max_workers=max_threads) as executor:
        for region_name, region_folder in tqdm(region_map.items(), desc="📁 Regions", leave=False):
            region_yaml = os.path.join(region_folder, "region.yaml")
            region_data = load_yaml(region_yaml)
            if not region_data:
                continue
            regionID = region_data.get("regionID")
            region_entry = {"regionID": regionID}

            constellations = [c for c in os.listdir(
                region_folder) if os.path.isdir(os.path.join(region_folder, c))]
            constellation_count += len(constellations)

            for constellation_name in tqdm(constellations, desc=f"🔸 Constellations ({region_name})", leave=False):
                const_folder = os.path.join(region_folder, constellation_name)
                const_yaml = os.path.join(const_folder, "constellation.yaml")
                const_data = load_yaml(const_yaml)
                if not const_data:
                    continue
                constellationID = const_data.get("constellationID")
                const_entry = {"constellationID": constellationID}

                systems = [s for s in os.listdir(const_folder) if os.path.isdir(
                    os.path.join(const_folder, s))]
                system_count += len(systems)

                for system_name in systems:
                    sys_yaml = os.path.join(
                        const_folder, system_name, "solarsystem.yaml")
                    metadata.append(
                        (region_name, constellation_name, system_name, const_entry))
                    solar_futures.append(executor.submit(load_yaml, sys_yaml))

                region_entry[constellation_name] = const_entry

            raw_name = region_data.get("regionName", region_name)
            region_key = format_region_name(raw_name)
            locations[region_key] = region_entry

        for i, future in enumerate(tqdm(solar_futures, desc="🛰️ Solar Systems", leave=True)):
            sys_data = future.result()
            if not sys_data:
                continue
            region_name, constellation_name, system_name, const_entry = metadata[i]
            const_entry[system_name] = {
                "security": sys_data.get("security"),
                "solarSystemID": sys_data.get("solarSystemID"),
                "solarSystemNameID": sys_data.get("solarSystemNameID")
            }

    print(f"✅ Merged {len(region_map)} regions, {constellation_count} constellations, and {system_count} systems into locations.json")
    return locations


# 🛍️ Market Menu Extractor
def extract_market_menu():
    print("🛍️ Loading market group definitions...")
    market_groups = load_yaml(MARKET_GROUPS_PATH) or {}
    print("📄 Loading item type definitions...")
    types = load_yaml(TYPES_PATH) or {}

    group_data = {}
    children_map = {}

    for gid, group in tqdm(market_groups.items(), desc="📦 Indexing Market Groups", leave=False):
        name = group.get("nameID", {}).get("en")
        if not name:
            continue
        group_data[gid] = {
            "name": name,
            "_info": {
                "marketGroupID": str(gid),
                "iconID": str(group.get("iconID", "")),
                "hasTypes": str(group.get("hasTypes", 0))
            },
            "items": [],
            "children": []
        }
        parent = group.get("parentGroupID")
        if parent is not None:
            children_map.setdefault(parent, []).append(gid)

    for tid, t in tqdm(types.items(), desc="🎯 Linking Item Types", leave=True):
        if not t.get("published") or "marketGroupID" not in t:
            continue
        gid = t.get("marketGroupID")
        if gid not in group_data:
            continue
        group_data[gid]["items"].append({
            "typeID": str(tid),
            "typeName": t["name"].get("en", ""),
            "iconID": str(t.get("iconID", "")),
            "volume": t.get("volume", 0),
            "mass": t.get("mass", 0),
            "published": True
        })

    def build_group(gid):
        g = group_data[gid]
        group_name = g["name"]
        node = {group_name: {"_info": g["_info"]}}
        if g.get("items"):
            node[group_name]["items"] = sorted(
                g["items"], key=lambda x: x["typeName"].lower())
        for child_id in sorted(children_map.get(gid, []), key=lambda cid: group_data[cid]["name"].lower()):
            node[group_name].update(build_group(child_id))
        return node

    market_menu = {}
    for gid in sorted([g for g in group_data if market_groups.get(g, {}).get("parentGroupID") is None],
                      key=lambda g: group_data[g]["name"].lower()):
        market_menu.update(build_group(gid))

    print(f"✅ Built marketMenu.json with {len(market_menu)} root categories")
    return market_menu


# 💾 File Writer
def write_json(filename, data):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"  • {filename}")


# 🧠 Interactive CLI
def prompt_selection():
    print("\n🧭 What would you like to generate?")
    print("  1. All files")
    print("  2. Only stations.json")
    print("  3. Only locations.json")
    print("  4. Only marketMenu.json")
    while True:
        choice = input("Enter your choice (1–4): ").strip()
        if choice in {"1", "2", "3", "4"}:
            return choice
        print("❌ Invalid input — please enter 1, 2, 3, or 4.")


# 🚀 Main Execution
def main():
    print("🔧 Generating modular SDE data...\n")
    choice = prompt_selection()

    if choice == "1":
        write_json("stations.json", extract_stations())
        write_json("locations.json", extract_locations())
        write_json("marketMenu.json", extract_market_menu())
    elif choice == "2":
        write_json("stations.json", extract_stations())
    elif choice == "3":
        write_json("locations.json", extract_locations())
    elif choice == "4":
        write_json("marketMenu.json", extract_market_menu())


if __name__ == "__main__":
    main()
