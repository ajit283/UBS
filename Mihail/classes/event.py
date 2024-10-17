from datetime import timedelta
import numpy as np
from classes.column import Column, date_col, default_columns


datedeltas = [timedelta(days=day_cnt)
              for day_cnt in [0, 180, 365, 545, 730]]


class Event:
    def __init__(self, date, description="", quant_columns: list[Column] = default_columns) -> None:
        self.date = date
        self.description = description
        self.columns = quant_columns
        self.data = {date_col: date}
        for column in quant_columns:
            self.data[column.name] = [column.get_data(
                date + datedelta) for datedelta in datedeltas]

    def get_flat_data(self):
        # TODO you don't need the columns now, just output for everything except date
        # DONE in next TODO organize
        flat_data = []
        for column in self.columns:
            flat_data = flat_data + [self.data[column.name][i + 1] / self.data[column.name][i] for i in range(len(self.data[column.name]) - 1)]
        return np.array(flat_data)

    @staticmethod
    def flat_data(data):
        if isinstance(data, Event):
            data = data.data
        flat_data = []
        # since a gdp of 10000 in 1980 is epic, while a gdp of 10000 in 2020 is meh, we want to only account
        # for growth/decrease when putting the quant in a distribution or working with it
        for column_name in data:
            if column_name != date_col:
                flat_data = flat_data + [data[column_name][i + 1] / data[column_name][i] for i in range(len(data[column_name]) - 1)]
        return np.array(flat_data)
