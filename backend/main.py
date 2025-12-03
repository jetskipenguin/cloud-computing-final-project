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

        if breed_query := args.getlist('breed'):
            breed_query = [breed.lower() for breed in breed_query]
            # Check if any part of the breed query is in the available dogs' breed column
            # This handles cases where breed might be "Labrador Retriever Mix" and query is "labrador"
            breed_matches = pd.Series([False] * len(available_dogs), index=available_dogs.index)
            for breed in breed_query:
                breed_matches = breed_matches | available_dogs['breed'].str.lower().str.contains(breed, na=False)
            available_dogs = available_dogs[breed_matches]


        if colors := args.getlist('color'):
            colors = [color.lower() for color in colors]
            available_dogs = available_dogs[
                available_dogs['color'].str.lower().isin(colors)
            ]

        if age_min := args.get('age_year_min'):
            try:
                age_min = float(age_min)
                available_dogs['age_years'] = available_dogs['age_upon_outcome'].apply(parse_age)
                available_dogs = available_dogs[
                    available_dogs['age_years'].notna() & (available_dogs['age_years'] >= age_min)
                ]
            except ValueError:
                print("Failed to filter by age_year_min")
                pass

        if age_max := args.get('age_year_max'):
            try:
                age_max = float(age_max)
                if 'age_years' not in available_dogs.columns:
                    available_dogs['age_years'] = available_dogs['age_upon_outcome'].apply(parse_age)
                available_dogs = available_dogs[
                    available_dogs['age_years'].notna() & (available_dogs['age_years'] <= age_max)
                ]
            except ValueError:
                print("Failed to filter by age_year_max")
                pass

        if sex := args.get('sex'):
            sex = sex.lower()
            if sex != "male" and sex != "female":
                error_resp = {"error": "Invalid sex parameter, must be 'male' or 'female'"}
                return (json.dumps(error_resp), 400, headers)
            
            sex_column_lower = available_dogs['sex_upon_outcome'].str.lower()
            filter_condition = sex_column_lower.str.contains(sex, na=False)

            if sex == "male":
                # For male, also ensure it does not contain 'female' to avoid ambiguous entries
                filter_condition = filter_condition & ~sex_column_lower.str.contains("female", na=False)
            
            available_dogs = available_dogs[filter_condition]

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

        # Return standard JSON response
        return (json.dumps(results), 200, headers)

    except Exception as e:
        raise e
        # Return strict JSON error even on crash
        error_resp = {"error": str(e)}
        return (json.dumps(error_resp), 500, headers)
    
def parse_age(age_str: str) -> float | None:
    if pd.isna(age_str):
        return None
    parts = age_str.split()
    if len(parts) != 2:
        return None
    num, unit = parts
    try:
        num = float(num)
    except ValueError:
        return None
    if 'year' in unit:
        return num
    elif 'month' in unit:
        return num / 12
    elif 'week' in unit:
        return num / 52
    elif 'day' in unit:
        return num / 365
    return None