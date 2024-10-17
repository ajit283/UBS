from classes.event import Event
from classes.multigauss import MultiGauss
from datetime import date
from utils import data_folder
import numpy as np
import json

event = Event(date(2001, 6, 1))

curr_date = date(1980, 1, 1)
max_date = date(2022, 1, 1)


events = []
while curr_date <= max_date:
    events.append(Event(curr_date))
    # + 6 months
    curr_date = date(curr_date.year + (1 if curr_date.month == 6 else 0), (curr_date.month + 6) % 12 + 1, 1)

events_flat_data = np.array([Event.flat_data(event.data) for event in events])
distribution = MultiGauss(events_flat_data)

the_911_flat_data = Event.flat_data(Event(date(2001, 6, 1)))
print(distribution.pdf_vs_mean(the_911_flat_data))

the_jessie_data = Event.flat_data(json.load(open(data_folder / "example_jessie.json")))
print(distribution.pdf_vs_mean(the_jessie_data))
