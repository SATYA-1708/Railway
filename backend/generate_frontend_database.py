import json
import os


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    backend_trains_path = os.path.join(here, 'all_real_trains.json')
    frontend_data_dir = os.path.join(os.path.dirname(here), 'frontend', 'src', 'data')

    os.makedirs(frontend_data_dir, exist_ok=True)

    with open(backend_trains_path, 'r', encoding='utf-8') as f:
        trains_map = json.load(f)

    out_path = os.path.join(frontend_data_dir, 'allRealTrains.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(trains_map, f, indent=1)

    print(f"Exported {len(trains_map)} real trains to {out_path}")


if __name__ == "__main__":
    main()