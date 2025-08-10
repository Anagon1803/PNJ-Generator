import yaml, json

def yaml_to_json(yaml_file, json_file):
    with open(yaml_file, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    yaml_to_json("questions.yaml", "questions.json")
    print("Conversion terminée !")
