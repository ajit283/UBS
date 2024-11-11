import pandas as pd
import numpy as np
from scipy.stats import multivariate_normal, gmean
from flask import Flask, render_template, request, jsonify
from pathlib import Path
import json

data = pd.read_csv('data/events_with_economic_data.csv', usecols=[i for i in range(4, 24)])
mean = data.mean().values
cov = data.cov().values
gaussian = multivariate_normal(mean, cov, allow_singular=True)
mean_pdf = gaussian.pdf(mean)  


app = Flask(__name__)

@app.route('/')
def index():
    
    slider_data = {
    "columns": data.columns.tolist(),
    "mean": mean.tolist(),
    "ranges": {
        "unemployment_rate": {"min": 3.6, "max": 10.2},
        "unemployment_rate_6m": {"min": 3.6, "max": 11.0},
        "unemployment_rate_12m": {"min": 3.6, "max": 10.0},
        "unemployment_rate_18m": {"min": 3.6, "max": 9.9},
        "unemployment_rate_24m": {"min": 3.4, "max": 13.2},
        "gdp": {"min": 3517.181, "max": 21903.85},
        "gdp_6m": {"min": 3498.246, "max": 22066.784},
        "gdp_12m": {"min": 3470.278, "max": 22403.435},
        "gdp_18m": {"min": 3553.021, "max": 22780.933},
        "gdp_24m": {"min": 3692.289, "max": 23053.545},
        "cpi": {"min": 1.171, "max": 9.071},
        "cpi_6m": {"min": 0.778, "max": 10.269},
        "cpi_12m": {"min": 0.869, "max": 13.47},
        "cpi_18m": {"min": 0.664, "max": 15.774},
        "cpi_24m": {"min": 0.664, "max": 12.685},
        "oil_price": {"min": 2.97, "max": 106.19},
        "oil_price_6m": {"min": 2.97, "max": 125.39},
        "oil_price_12m": {"min": 2.97, "max": 106.19},
        "oil_price_18m": {"min": 2.97, "max": 133.93},
        "oil_price_24m": {"min": 2.92, "max": 110.04}
    }
}


    print("Slider Data:", slider_data)  
    return render_template('index.html', slider_data=slider_data)

@app.route('/calculate_pdf', methods=['POST'])
def calculate_pdf():
   
    slider_values = request.json['slider_values']
    vector = np.array(slider_values, dtype=float)

  
    print("Received vector from sliders:\n", vector)
    
    
    pdf_value = gaussian.pdf(vector)
    pdf_ratio = pdf_value / mean_pdf if mean_pdf != 0 else 0
    
    
    print("Calculated PDF value:", pdf_value)
    print("PDF Ratio to Mean:", pdf_ratio)
    
   
    return jsonify({'pdf_ratio': pdf_ratio, 'pdf_value': pdf_value})

@app.route('/process_query', methods=['POST'])
def process_query():
    data = request.json
    query = data.get('query')

    # Call the extract_information script
    from extract_information import get_weighted_means  # Import your function
    weighted_means = get_weighted_means(query)

    # Return the weighted means as a JSON response
    return jsonify({'weighted_means': weighted_means})

if __name__ == '__main__':
    app.run(debug=True)


