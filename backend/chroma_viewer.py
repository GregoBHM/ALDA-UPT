import chromadb
import json
import warnings
warnings.filterwarnings("ignore") # Para evitar warnings molestos en la presentación

import os
from dotenv import load_dotenv

load_dotenv()
host = os.getenv("CHROMA_HOST", "localhost")
port = int(os.getenv("CHROMA_PORT", "8100"))

# Conectar al servidor de ChromaDB usando las variables del .env
client = chromadb.HttpClient(host=host, port=port)

try:
    collection = client.get_collection(name="alda_knowledge")
    
    print("\n" + "="*60)
    print(" 🧠 EXPLORADOR DE BASE VECTORIAL DE ALDA (ChromaDB) 🧠")
    print("="*60)
    
    total_docs = collection.count()
    print(f"🔹 Total de fragmentos de conocimiento vectorizados: {total_docs}\n")
    
    if total_docs > 0:
        print("👉 Muestra de los primeros 2 fragmentos guardados:")
        print("-" * 60)
        
        # 'peek' nos permite asomarnos a los datos en bruto
        datos = collection.peek(limit=2)
        
        for i in range(len(datos['ids'])):
            print(f"🆔 ID del Vector: {datos['ids'][i]}")
            
            metadatos = datos['metadatas'][i] if datos['metadatas'] else {}
            print(f"📄 Metadatos: {json.dumps(metadatos, indent=2, ensure_ascii=False)}")
            
            documento = datos['documents'][i]
            # Mostramos solo los primeros 100 caracteres para no llenar la pantalla
            print(f"📝 Texto puro extraído del PDF: {documento[:100]}... [recortado]")
            
            embedding = datos['embeddings'][i]
            print(f"🔢 Vector Matemático (Google Embedding): {embedding[:5]}... ({len(embedding)} dimensiones en total)")
            print("-" * 60)
            
except Exception as e:
    print(f"Error al conectar con ChromaDB: {e}")
    print("¿Ya subiste algún PDF desde la página web de ALDA?")
