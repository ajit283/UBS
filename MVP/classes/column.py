import pandas as pd
from utils import data_folder
from pathlib import Path

date_col = "DATE"
# no need to store each one in a variable
date_col_name = "DATE"
unemp_col_name = "UNRATE"
gdp_col_name = "GDPC1"
cpi_col_name = "CORESTICKM159SFRBATL"
oil_col_name = "WTISPLC"

data_col_names = [unemp_col_name, gdp_col_name, cpi_col_name, oil_col_name]



class Column:
    def __init__(self, name) -> None:
        self.name = name
        self.df = pd.read_csv(data_folder / Path(f"{name}.csv"), parse_dates=[date_col], index_col=date_col)

    def get_data(self, date):
        timestamp = pd.Timestamp(date)
        return self.df[self.name].asof(timestamp)

default_columns = [Column(name) for name in data_col_names]