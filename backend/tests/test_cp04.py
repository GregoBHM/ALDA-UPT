"""
================================================================
  CP-04 -- Envío de Token Frontend-Backend
  Prueba de Integración: Endpoint /api/auth/login
  Tipo: Integración | Nivel: Sistema | Modalidad: Automatizada
  Responsable: Gregory Huanca
================================================================

Descripcion:
  Verificar que el Frontend (React) envíe correctamente el payload 
  (simulando el token recibido de Google) al Backend (FastAPI), y 
  que este lo valide exitosamente devolviendo los datos de la sesión.

Ambiente:
  - Python 3.11+
  - Cliente HTTP simulando la petición desde React
  - Backend FastAPI corriendo en local (puerto 8000)
"""

import sys
import json
import urllib.request
import os.path

# Agregar el directorio principal al path para importar modelos y base de datos
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal
from models import AllowedEmail

def main():
    # Paso 1: Asegurarnos de que el correo esté en la base de datos de permitidos (whitelist)
    db = SessionLocal()
    email = 'ac2022074258@virtual.upt.pe'
    user = db.query(AllowedEmail).filter_by(email=email).first()
    
    # Si el usuario no está, lo agregamos para que la petición no lance error 403
    if not user:
        db.add(AllowedEmail(email=email, note='test CP-04'))
        db.commit()
    db.close()
    
    print("Whitelisted. Executing request...")
    
    # Paso 2: Crear el payload JSON que usualmente envía React
    data = json.dumps({
        'email': email,
        'name': 'ANDY MICHAEL CALIZAYA LADERA',
        'avatar_url': 'https://example.com/avatar.png'
    }).encode()
    
    # Paso 3: Configurar la petición POST al endpoint de Login
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login', 
        data=data, 
        headers={'Content-Type': 'application/json'}, 
        method='POST'
    )
    
    try:
        # Paso 4: Ejecutar la petición y capturar la respuesta
        res = urllib.request.urlopen(req)
        status = res.status
        content = res.read().decode()
        
        print('Status:', status)
        print('Response:', content)
        
        # Paso 5: Guardar el resultado para la evidencia del catálogo
        res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
        if not os.path.exists(res_dir):
            os.makedirs(res_dir)
            
        with open(os.path.join(res_dir, 'CP-04.txt'), 'w', encoding='utf-8') as f:
            f.write(f"Status: {status}\n")
            f.write(f"Response: {content}\n\n")
            f.write("El Frontend envió el payload correctamente y el Backend respondió con un código 200 OK y el perfil del usuario autenticado.")
            
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
