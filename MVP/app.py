import pandas as pd
import numpy as np
from scipy.stats import multivariate_normal, gmean
from flask import Flask, render_template, request, jsonify, make_response
from flask_cors import CORS, cross_origin
from pathlib import Path
import json
from load_data import load_data

# Load and prepare data
data = pd.read_csv("data/extended_economic_data.csv", usecols=[i for i in range(5, 21)])
print("Columns in the dataset:", data.columns)
mean = data.mean().values
cov = data.cov().values
gaussian = multivariate_normal(mean, cov, allow_singular=True)
mean_pdf = gaussian.pdf(mean)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)

# Load MongoDB client and collection
client, collection = load_data()


def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response


# the bigger this magnitude number the more unlikely it is
def get_likelihood(pdf_ratio):
    # Handle edge cases
    if np.isinf(pdf_ratio) or pdf_ratio > 1e308:  # Close to max float value
        return "Extremely Unlikely"
    if pdf_ratio <= 0:
        return "Extremely Unlikely"

    try:
        magnitude = -int(np.floor(np.log10(pdf_ratio)))
    except (OverflowError, ValueError):
        return "Extremely Unlikely"

    # Define categories based on magnitude
    if magnitude >= 200:
        return "Extremely Unlikely"
    elif magnitude >= 50:
        return "Very Unlikely"
    elif magnitude >= 20:
        return "Unlikely"
    elif magnitude >= 10:
        return "Neutral"
    else:
        return "Likely"


@app.route("/calculate_pdf", methods=["POST", "OPTIONS"])
def calculate_pdf():
    if request.method == "OPTIONS":
        return "", 204

    # Extract economic parameters from the request
    economic_params = request.json["economic_params"]
    vector = np.array(list(economic_params.values()), dtype=float)
    print("Received economic parameters:\n", vector)

    pdf_value = gaussian.pdf(vector)
    pdf_ratio = pdf_value / mean_pdf if mean_pdf != 0 else 0

    print("Calculated PDF value:", pdf_value)
    print("PDF Ratio to Mean:", pdf_ratio)

    likelihood = get_likelihood(pdf_ratio)
    return jsonify(
        {"pdf_ratio": pdf_ratio, "pdf_value": pdf_value, "likelihood": likelihood}
    )


@app.route("/process_query", methods=["POST", "OPTIONS"])
def process_query():
    if request.method == "OPTIONS":
        return "", 204

    # try:
    data = request.json
    query = data.get("query")

    # Call the extract_information script
    from extract_information import get_weighted_means

    weighted_means, events = get_weighted_means(query, collection)
    result_list = []

    for key, value in weighted_means.items():
        result_list.append(value)
    vector = np.array(result_list, dtype=float)

    pdf_value = gaussian.pdf(vector)
    pdf_ratio = pdf_value / mean_pdf if mean_pdf != 0 else 0
    likelihood = get_likelihood(pdf_ratio)

    return jsonify(
        {
            "pdf_ratio": pdf_ratio,
            "pdf_value": pdf_value,
            "likelihood": likelihood,
            "events": events,  # Include the events in the response
            **weighted_means,
        }
    )


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})


# @app.errorhandler(Exception)
# def handle_error(error):
#     status_code = 500
#     if hasattr(error, "code"):
#         status_code = error.code
#     response = make_response(jsonify({"error": str(error)}), status_code)
#     return add_cors_headers(response)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
