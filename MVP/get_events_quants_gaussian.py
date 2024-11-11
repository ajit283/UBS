import pandas as pd
from pathlib import Path
from scipy.stats import multivariate_normal, gmean


def get_data(file_name):
    return pd.read_csv(file_name, usecols=[i for i in range(4, 24)])


def get_quants_normal(data):
    mean = data.mean().values
    cov = data.cov().values

    return multivariate_normal(mean, cov,  allow_singular=True)


#TODO use pathlib or smth so it works on mac

data_folder = Path("./data")
data = get_data(data_folder / 'events_with_economic_data.csv')
print(data.columns)

events_gaussian = get_quants_normal(data)
print("mean", events_gaussian.mean)

example = pd.read_csv(data_folder/"example_jessie.csv").iloc[0].to_numpy()
print("example", example)

mean_pdf = events_gaussian.pdf(events_gaussian.mean)
print("example pdf", events_gaussian.pdf(example) / mean_pdf)

pdf_ratios = []
for i in range(len(data)):
    pdf_ratios.append(events_gaussian.pdf(data.iloc[i]) / mean_pdf)

print("gmean events pdf", gmean([x for x in pdf_ratios if x != 0]))
