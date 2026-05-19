import chromadb
import os
from google import genai

_chroma_client = None
_collection = None
_embed_client = None

COLLECTION_NAME = "alda_knowledge"


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        host = os.getenv("CHROMA_HOST", "localhost")
        port = int(os.getenv("CHROMA_PORT", "8100"))
        _chroma_client = chromadb.HttpClient(host=host, port=port)
    return _chroma_client


def get_collection():
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def get_embed_client(api_key: str = None):
    if api_key and api_key.strip():
        return genai.Client(api_key=api_key)
    
    fallback_key = os.getenv("GOOGLE_AI_API_KEY", "")
    if fallback_key and fallback_key.strip():
        return genai.Client(api_key=fallback_key)
    return None


def generate_embeddings(texts: list[str], api_key: str = None) -> list[list[float]]:
    try:
        client = get_embed_client(api_key)
        if not client:
            print("CRITICAL: No hay API Key para embeddings en RAG.")
            return []

        all_embeddings = []
        for text in texts:
            result = client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
            all_embeddings.append(result.embeddings[0].values)
        return all_embeddings
    except Exception as e:
        print(f"Error generando embeddings: {e}")
        return []


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
        i += chunk_size - overlap
    return chunks if chunks else [text.strip()]


def add_document(doc_id: str, title: str, full_text: str, api_key: str = None):
    collection = get_collection()
    chunks = chunk_text(full_text)
    embeddings = generate_embeddings(chunks, api_key)

    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "title": title, "chunk_index": i} for i in range(len(chunks))]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def query_knowledge(query_text: str, n_results: int = 3, api_key: str = None) -> list[dict]:
    collection = get_collection()
    if collection.count() == 0:
        return []

    embeddings = generate_embeddings([query_text], api_key)
    if not embeddings:
        return []
    query_embedding = embeddings[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    items = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            items.append({
                "text": doc,
                "title": results["metadatas"][0][i].get("title", ""),
                "distance": results["distances"][0][i] if results["distances"] else None,
            })
    return items


def delete_document(doc_id: str):
    collection = get_collection()
    existing = collection.get(where={"doc_id": doc_id})
    if existing and existing["ids"]:
        collection.delete(ids=existing["ids"])
    return len(existing["ids"]) if existing and existing["ids"] else 0


def list_documents() -> list[dict]:
    collection = get_collection()
    all_data = collection.get(include=["metadatas"])

    seen = {}
    if all_data and all_data["metadatas"]:
        for meta in all_data["metadatas"]:
            doc_id = meta.get("doc_id", "")
            if doc_id and doc_id not in seen:
                seen[doc_id] = {
                    "doc_id": doc_id,
                    "title": meta.get("title", "Sin título"),
                }

    return list(seen.values())
