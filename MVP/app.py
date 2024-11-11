import pandas as pd
import numpy as np
from scipy.stats import multivariate_normal, gmean
from flask import Flask, render_template, request, jsonify
from pathlib import Path
import json

data = pd.read_csv('data/extended_economic_data.csv', usecols=[i for i in range(5, 21)])

print("Columns in the dataset:", data.columns)
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
        "unemployment_rate_6m": {"min": data['unemployment_rate_6m'].min(), "max": data['unemployment_rate_6m'].max()},
        "unemployment_rate_12m": {"min": data['unemployment_rate_12m'].min(), "max": data['unemployment_rate_12m'].max()},
        "unemployment_rate_18m": {"min": data['unemployment_rate_18m'].min(), "max": data['unemployment_rate_18m'].max()},
        "unemployment_rate_24m": {"min": data['unemployment_rate_24m'].min(), "max": data['unemployment_rate_24m'].max()},
        "gdp_6m": {"min": data['gdp_6m'].min(), "max": data['gdp_6m'].max()},
        "gdp_12m": {"min": data['gdp_12m'].min(), "max": data['gdp_12m'].max()},
        "gdp_18m": {"min": data['gdp_18m'].min(), "max": data['gdp_18m'].max()},
        "gdp_24m": {"min": data['gdp_24m'].min(), "max": data['gdp_24m'].max()},
        "cpi_6m": {"min": data['cpi_6m'].min(), "max": data['cpi_6m'].max()},
        "cpi_12m": {"min": data['cpi_12m'].min(), "max": data['cpi_12m'].max()},
        "cpi_18m": {"min": data['cpi_18m'].min(), "max": data['cpi_18m'].max()},
        "cpi_24m": {"min": data['cpi_24m'].min(), "max": data['cpi_24m'].max()},
        "oil_price_6m": {"min": data['oil_price_6m'].min(), "max": data['oil_price_6m'].max()},
        "oil_price_12m": {"min": data['oil_price_12m'].min(), "max": data['oil_price_12m'].max()},
        "oil_price_18m": {"min": data['oil_price_18m'].min(), "max": data['oil_price_18m'].max()},
        "oil_price_24m": {"min": data['oil_price_24m'].min(), "max": data['oil_price_24m'].max()}
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


