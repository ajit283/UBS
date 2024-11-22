from dotenv import load_dotenv, find_dotenv
import os

load_dotenv()

import chromadb.utils.embedding_functions.openai_embedding_function as embedding_functions

openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key=os.getenv("OPENAI_API_KEY"),
    # api_base="YOUR_API_BASE_PATH",
    # api_type="azure",
    # api_version="YOUR_API_VERSION",
    # model_name="text-embedding-3-small",
)
