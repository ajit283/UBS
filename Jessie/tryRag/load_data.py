import pandas as pd
from pymongo import MongoClient
from langchain.embeddings.openai import OpenAIEmbeddings
import key_param as key_param

# Load CSV data using pandas
csv_file = 'events_with_economic_data.csv'  # Replace with the actual path to your CSV file
df = pd.read_csv(csv_file)

# Print the first few rows of the DataFrame (for debugging)
print(df.head())

# Connect to MongoDB Atlas
client = MongoClient(key_param.MONGO_URI)
dbName = "events"
collectionName = "data_and_embeddings"
collection = client[dbName][collectionName]

# Initialize the OpenAI embeddings model
embeddings_model = OpenAIEmbeddings(openai_api_key=key_param.openai_api_key)

# Store full documents and embeddings together in MongoDB
for _, row in df.iterrows():
    # Convert each row to a dictionary
    document_dict = row.to_dict()

    # Extract the text to embed from the 'description' column
    text_to_embed = document_dict.get('description', '')  # Extract the 'description' field
    
    # Create embeddings for the text
    embedding_vector = embeddings_model.embed_query(text_to_embed)
    
    # Add the embedding vector to the document
    document_dict['embedding'] = embedding_vector

    # Insert the document (with embeddings) into MongoDB
    collection.insert_one(document_dict)

# Now, each document in MongoDB will contain both the full data and its corresponding embedding.
