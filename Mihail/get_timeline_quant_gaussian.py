# from utils import add_economic_data, flatten_event_data, data_folder
# from datetime import date
# import numpy as np
# from scipy.stats import multivariate_normal
# import json


# curr_date = date(1980, 1, 1)
# max_date = date(2022, 1, 1)

# vector_events = []
# while curr_date <= max_date:
#     vector_events.append(flatten_event_data(add_economic_data(curr_date)))
#     curr_date = date(curr_date.year + (1 if curr_date.month == 6 else 0), (curr_date.month + 6) % 12 + 1, 1)


# curr_date = date(1980, 1, 1)
# vector_events = []
# while curr_date <= date(2022, 1, 1):
#     vector_events.append(flatten_event_data(add_economic_data(curr_date)))
#     curr_date = date(curr_date.year + (1 if curr_date.month ==
#                      6 else 0), (curr_date.month + 6) % 12 + 1, 1)

# vector_events = np.array(vector_events)
# # print(vector_events, vector_events.mean(axis=0))
# events_gaussian = multivariate_normal(vector_events.mean(axis=0),
#                                       vector_events.var(axis=0),  allow_singular=True)


# example = json.load(open(data_folder / "example_jessie.json"))

# example = flatten_event_data(example)
# the_911 = flatten_event_data(add_economic_data(date(2001, 6, 1)))
# # print("example", example)

# mean_pdf = events_gaussian.pdf(events_gaussian.mean)

# print("9/11 pdf", events_gaussian.pdf(the_911) / mean_pdf)
# print("example pdf", events_gaussian.pdf(example) / mean_pdf)
