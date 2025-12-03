# Cloud Computing Final Project

We developed a simple serverless application that displays dog adoption data and enables quick searching.

## Backend Development

We used GCP Run Functions. 

Steps for local development:
- Prerequisites: Install python3.13
- `cd backend`
- `pip install -r requirements.txt`
- Setup gcloud CLI locally. Refer to this doc: https://docs.cloud.google.com/sdk/docs/install#deb
- Go to `https://storage.googleapis.com/lambda-leash/aac_shelter_outcomes.csv`, make a new directory `archive/` at project root and move the CSV file into it
- `functions-framework --target search_dogs` will start the application locally.
- From there use curl or postman (https://www.postman.com/downloads/) for sending API calls.

Additional resources can be found here:
- https://docs.cloud.google.com/run/docs/local-dev-functions#curl_1