import functions_framework
import pandas as pd
import json
import os
import io
from google.cloud import storage

# Load CSV once on start
try:
    client = storage.Client()
    bucket = client.bucket("lambda-leash")
    blob = bucket.blob("aac_shelter_outcomes.csv")
    data_bytes = blob.download_as_bytes()
    df = pd.read_csv(io.BytesIO(data_bytes), dtype=str)
except Exception as e:
    print(f"Failed to load CSV: {e}")
    df = pd.read_csv("../archive/aac_shelter_outcomes.csv", dtype=str) # Attempt to read locally

@functions_framework.http
def search_dogs(request):
    # Handle CORS (Preflight)
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    }

    try:
        available_dogs = df[(df['animal_type'] == 'Dog')]

        args = request.args

        if breed_query := args.get('breed'):
            available_dogs = available_dogs[
                available_dogs['breed'].str.lower().str.contains(breed_query.lower(), na=False)
            ]

        if colors := args.getlist('color'):
            colors = [color.lower() for color in colors]
            print(colors)
            available_dogs = available_dogs[
                available_dogs['color'].str.lower().isin(colors)
            ]

        # limit results to avoid timeout/payload limits
        available_dogs = available_dogs.head(100)

        print(f"Found {len(available_dogs)} available dogs after filtering.")

        # serialization (Using native Dictionary comprehension)
        results = [
            {
                "id": row.animal_id,
                "name": row.name if pd.notna(row.name) else "Unnamed",
                "breed": row.breed,
                "color": row.color,
                "sex": row.sex_upon_outcome,
                "age": row.age_upon_outcome,
                "image": "https://place.dog/300/200"
            }
            # itertuples is significantly faster than iterrows for iteration
            for row in available_dogs.itertuples(index=False)
        ]

        # 6. Return standard JSON response
        return (json.dumps(results), 200, headers)

    except Exception as e:
        raise e
        # Return strict JSON error even on crash
        error_resp = {"error": str(e)}
        return (json.dumps(error_resp), 500, headers)