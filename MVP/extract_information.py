from pymongo import MongoClient
from langchain.embeddings.openai import OpenAIEmbeddings
import key_param as key_param
import numpy as np

# Function to calculate weighted means using similarity scores as percentages
def calculate_weighted_means(results):
    # Initialize dictionaries to collect the values for each time-specific field
    unemployment_rate = []
    unemployment_rate_6m = []
    unemployment_rate_12m = []
    unemployment_rate_18m = []
    unemployment_rate_24m = []
    
    gdp = []
    gdp_6m = []
    gdp_12m = []
    gdp_18m = []
    gdp_24m = []
    
    oil_price = []
    oil_price_6m = []
    oil_price_12m = []
    oil_price_18m = []
    oil_price_24m = []
    
    cpi = []
    cpi_6m = []
    cpi_12m = []
    cpi_18m = []
    cpi_24m = []
    
    similarity_scores = []

    # Loop through each result and extract the values for each time-specific field
    for result in results:
        similarity_scores.append(result.get('score', 0))  # Collect similarity scores
        unemployment_rate.append(result.get('unemployment_rate', np.nan))
        unemployment_rate_6m.append(result.get('unemployment_rate_6m', np.nan) - result.get('unemployment_rate', np.nan))
        unemployment_rate_12m.append(result.get('unemployment_rate_12m', np.nan) - result.get('unemployment_rate', np.nan))
        unemployment_rate_18m.append(result.get('unemployment_rate_18m', np.nan) - result.get('unemployment_rate', np.nan))
        unemployment_rate_24m.append(result.get('unemployment_rate_24m', np.nan) - result.get('unemployment_rate', np.nan))
        
        gdp.append(result.get('gdp', np.nan))
        gdp_6m.append(result.get('gdp_6m', np.nan) - result.get('gdp', np.nan))
        gdp_12m.append(result.get('gdp_12m', np.nan) - result.get('gdp', np.nan))
        gdp_18m.append(result.get('gdp_18m', np.nan) - result.get('gdp', np.nan))
        gdp_24m.append(result.get('gdp_24m', np.nan) - result.get('gdp', np.nan))
        
        oil_price.append(result.get('oil_price', np.nan))
        oil_price_6m.append(result.get('oil_price_6m', np.nan) - result.get('oil_price', np.nan))
        oil_price_12m.append(result.get('oil_price_12m', np.nan) - result.get('oil_price', np.nan))
        oil_price_18m.append(result.get('oil_price_18m', np.nan) - result.get('oil_price', np.nan))
        oil_price_24m.append(result.get('oil_price_24m', np.nan) - result.get('oil_price', np.nan))
        
        cpi.append(result.get('cpi', np.nan))
        cpi_6m.append(result.get('cpi_6m', np.nan) - result.get('cpi', np.nan))
        cpi_12m.append(result.get('cpi_12m', np.nan) - result.get('cpi', np.nan))
        cpi_18m.append(result.get('cpi_18m', np.nan) - result.get('cpi', np.nan))
        cpi_24m.append(result.get('cpi_24m', np.nan) - result.get('cpi', np.nan))

    # Normalize similarity scores as percentages by dividing by the sum of all scores
    total_score = np.sum(similarity_scores)
    weights = [score / total_score for score in similarity_scores]

    # Function to compute weighted mean for each field
    def weighted_mean(values, weights):
        values = np.array(values, dtype=np.float64)
        weights = np.array(weights, dtype=np.float64)
        # Use np.nansum to ignore NaN values while calculating the weighted mean
        return np.nansum(values * weights) / np.nansum(weights)
     

    # Calculate weighted means for each field using the normalized similarity scores as weights
    weighted_means = {
        #"weighted_mean_unemployment_rate": weighted_mean(unemployment_rate, weights),
        "weighted_mean_unemployment_rate_6m": weighted_mean(unemployment_rate_6m, weights),
        "weighted_mean_unemployment_rate_12m": weighted_mean(unemployment_rate_12m, weights),
        "weighted_mean_unemployment_rate_18m": weighted_mean(unemployment_rate_18m, weights),
        "weighted_mean_unemployment_rate_24m": weighted_mean(unemployment_rate_24m, weights),
        
        #"weighted_mean_gdp": weighted_mean(gdp, weights),
        "weighted_mean_gdp_6m": weighted_mean(gdp_6m, weights),
        "weighted_mean_gdp_12m": weighted_mean(gdp_12m, weights),
        "weighted_mean_gdp_18m": weighted_mean(gdp_18m, weights),
        "weighted_mean_gdp_24m": weighted_mean(gdp_24m, weights),
        
        #"weighted_mean_oil_price": weighted_mean(oil_price, weights),
        "weighted_mean_oil_price_6m": weighted_mean(oil_price_6m, weights),
        "weighted_mean_oil_price_12m": weighted_mean(oil_price_12m, weights),
        "weighted_mean_oil_price_18m": weighted_mean(oil_price_18m, weights),
        "weighted_mean_oil_price_24m": weighted_mean(oil_price_24m, weights),
        
        #"weighted_mean_cpi": weighted_mean(cpi, weights),
        "weighted_mean_cpi_6m": weighted_mean(cpi_6m, weights),
        "weighted_mean_cpi_12m": weighted_mean(cpi_12m, weights),
        "weighted_mean_cpi_18m": weighted_mean(cpi_18m, weights),
        "weighted_mean_cpi_24m": weighted_mean(cpi_24m, weights)
    }
    
    return weighted_means

# Initialize MongoDB connection and vector store
client = MongoClient(key_param.MONGO_URI)
dbName = "events"
collectionName = "data_and_embeddings"
collection = client[dbName][collectionName]

# Initialize OpenAI embeddings
embeddings = OpenAIEmbeddings(openai_api_key=key_param.openai_api_key)

# Function that takes in a query and returns the vector search results with similarity scores
def query_data(query):
    # Generate embedding for the query using OpenAI
    query_embedding = embeddings.embed_query(query)
    
    # Perform the vector search using MongoDB's $vectorSearch aggregation
    vector_search_result = collection.aggregate([
        {
            "$vectorSearch": {
                "index": "vector2",  # Ensure this matches the index name you created in MongoDB
                "path": "embedding",  # Path to the embedding field
                "queryVector": query_embedding,  # The query embedding generated from OpenAI
                "numCandidates": 10,  # Number of candidates to consider in the search
                "limit": 5,  # Limit the number of results returned
            }
        },
        {
            # Project the fields you want, including the similarity score, and exclude embedding
            "$project": {
                "embedding": 0,  # Exclude the embedding field from the output
                "score": {"$meta": "vectorSearchScore"},  # Include the vector search score
                
            }
        }
    ])

    # Process and return the results, including similarity scores
    results = list(vector_search_result)
    if not results:
        print("No similar documents found.")
    else:
        for result in results:
            # Remove the 'embedding' field from the result before printing
            result_without_embedding = {key: value for key, value in result.items() if key != "embedding"}
            # Add the similarity score to the printed result
            similarity_score = result.get("score", "No score available")
            print(f"Found document: {result_without_embedding}, Similarity score: {similarity_score}")
    
    return results

# Example usage
query = 'An intense standoff between the United States and China over the control of key microchip production facilities in Taiwan, escalating global tensions and threatening to disrupt the global supply chain for advanced electronics. The standoff sparks a technological arms race, severely impacting international trade, causing stock markets to plunge, and prompting nations to reevaluate their dependency on globalized tech infrastructure. Countries scramble to develop domestic semiconductor industries, while sanctions and trade restrictions between world powers push the global economy into a recession. This crisis forces a reevaluation of energy, technological independence, and global alliances, reshaping the balance of power for decades to come.'
query_result = query_data(query)
for result in query_result:
    result_without_embedding = {key: value for key, value in result.items() if key != "embedding"}
    similarity_score = result.get("score", "No score available")
    print(f"Found document: {result_without_embedding}, Similarity score: {similarity_score}")
    
weighted_means = calculate_weighted_means(query_result)
for key, value in weighted_means.items():
    print(f"{key}: {value}")

def get_weighted_means(query):
    query_result = query_data(query)
    weighted_means = calculate_weighted_means(query_result)
    result_list = []
    
    for key, value in weighted_means.items():
        result_list.append(value)
    return result_list



#TODO: Visualizing Trends Over Time: If you’re analyzing multiple query results over time, consider visualizing the results to identify trends more clearly (e.g., plot weighted_mean_unemployment_rate_6m over several queries).