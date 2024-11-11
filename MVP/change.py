import pandas as pd

# Load your dataset (replace 'economic_data.csv' with the path to your dataset)
data = pd.read_csv('data/economic_data.csv')
print("Columns in the dataset:", data.columns)
data = data.dropna()
# Parse 'DATE' column as datetime
data['date'] = pd.to_datetime(data['date'])

# Set 'DATE' as the index
data.set_index('date', inplace=True)

# Define the list of variables for which we want to calculate time-based changes
variables = ['unemployment_rate', 'gdp', 'cpi', 'oil_price']

# Calculate time-based changes (6m, 12m, 18m, and 24m) for each variable
for var in variables:
    data[f"{var}_6m"] = data[var].shift(-6) - data[var]
    data[f"{var}_12m"] = data[var].shift(-12) - data[var]
    data[f"{var}_18m"] = data[var].shift(-18) - data[var]
    data[f"{var}_24m"] = data[var].shift(-24) - data[var]


# Drop rows with NaN values that result from calculating differences
data = data.dropna()

# Save the extended dataset to a new CSV file
data.to_csv('data/extended_economic_data.csv')

print("Extended dataset with time-based change variables saved as 'extended_economic_data.csv'")
