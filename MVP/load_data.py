import pandas as pd
from weaviate.classes.config import Configure, Property, DataType
import chromadb
import embedding


def load_data():

    client = chromadb.PersistentClient()

    # client.delete_collection("events")

    collection = client.get_or_create_collection(
        "events", embedding_function=embedding.openai_ef
    )

    # Load CSV data using pandas
    csv_file = "data/events_with_economic_data.csv"  # Replace with the actual path to your CSV file
    df = pd.read_csv(csv_file)

    # Print the first few rows of the DataFrame (for debugging)
    print(df.head())

    if collection.count() == 0:

        collection.add(
            documents=[row.description for _, row in df.iterrows()],
            # embeddings=embedding.openai_ef.embed_with_retries(
            #     [row.description for _, row in df.iterrows()]
            # ),
            metadatas=[
                row.to_dict() for _, row in df.iterrows()
            ],  # filter on arbitrary metadata!
            ids=[str(id) for id in range(len(df))],  # must be unique for each doc
        )

    return client, collection
