import pandas as pd
import numpy as np
from scipy.stats import multivariate_normal
from dash import Dash, dcc, html, Output, Input

# Load data and fit Gaussian
data = pd.read_csv('data/events_with_economic_data.csv', usecols=[i for i in range(4, 24)])
mean = data.mean().values
cov = data.cov().values
gaussian = multivariate_normal(mean, cov, allow_singular=True)

# Initialize Dash app
app = Dash(__name__)

# Create a list of slider components
slider_components = [
    html.Div([
        html.Label(f"{col}:"),
        dcc.Slider(
            id=f'slider-{col}',
            min=mean[i] - 3 * np.sqrt(cov[i][i]),
            max=mean[i] + 3 * np.sqrt(cov[i][i]),
            value=mean[i],
            step=0.1,
            tooltip={"placement": "bottom", "always_visible": True}
        )
    ]) for i, col in enumerate(data.columns)
]

# Define the layout and include the sliders
app.layout = html.Div([
    html.H1("Gaussian PDF Calculator"),
    *slider_components,
    html.H2(id='pdf-output')
])

# Update PDF output based on slider values
@app.callback(
    Output('pdf-output', 'children'),
    [Input(f'slider-{col}', 'value') for col in data.columns]
)
def update_pdf(*slider_values):
    vector = np.array(slider_values)
    pdf_value = gaussian.pdf(vector)
    return f"PDF Value: {pdf_value}"

# Run the app
if __name__ == '__main__':
    app.run_server(debug=True)
