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
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
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


@app.route("/calculate_pdf", methods=["POST", "OPTIONS"])
def calculate_pdf():
    if request.method == "OPTIONS":
        response = make_response()
        return add_cors_headers(response)

    slider_values = request.json["slider_values"]
    vector = np.array(slider_values, dtype=float)
    print("Received vector from sliders:\n", vector)

    pdf_value = gaussian.pdf(vector)
    pdf_ratio = pdf_value / mean_pdf if mean_pdf != 0 else 0

    print("Calculated PDF value:", pdf_value)
    print("PDF Ratio to Mean:", pdf_ratio)

    response = make_response(jsonify({"pdf_ratio": pdf_ratio, "pdf_value": pdf_value}))
    return add_cors_headers(response)


@app.route("/process_query", methods=["POST", "OPTIONS"])
def process_query():
    if request.method == "OPTIONS":
        response = make_response()
        return add_cors_headers(response)

    # try:
    data = request.json
    query = data.get("query")

    # Call the extract_information script
    from extract_information import get_weighted_means

    weighted_means = get_weighted_means(query, collection)
    result_list = []

    for key, value in weighted_means.items():
        result_list.append(value)
    vector = np.array(result_list, dtype=float)

    pdf_value = gaussian.pdf(vector)
    pdf_ratio = pdf_value / mean_pdf if mean_pdf != 0 else 0

    # Create a dictionary of weighted means
    weighted_means_dict = {
        f"weighted_mean_{i}": value for i, value in enumerate(weighted_means)
    }

    print("Calculated PDF value:", pdf_value)
    print("PDF Ratio to Mean:", pdf_ratio)

    response = make_response(
        jsonify(
            {
                "pdf_ratio": pdf_ratio,
                "pdf_value": pdf_value,
                **weighted_means,
            }
        )
    )
    return add_cors_headers(response)

    # except Exception as e:
    #     error_response = make_response(jsonify({"error": str(e)}), 500)
    #     return add_cors_headers(error_response)


@app.route("/health", methods=["GET"])
def health_check():
    response = make_response(jsonify({"status": "healthy"}))
    return add_cors_headers(response)


# @app.errorhandler(Exception)
# def handle_error(error):
#     status_code = 500
#     if hasattr(error, "code"):
#         status_code = error.code
#     response = make_response(jsonify({"error": str(error)}), status_code)
#     return add_cors_headers(response)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
