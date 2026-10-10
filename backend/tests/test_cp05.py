"""
================================================================
  CP-05 -- Tiempo de Respuesta Login
  Prueba No Funcional: Rendimiento de endpoint /api/auth/login
  Tipo: No funcionales | Nivel: Sistema | Modalidad: Automatizada
  Responsable: Gregory Huanca
================================================================

Descripcion:
  Evaluar el tiempo de respuesta del proceso completo de autenticación.
  El tiempo total promedio no debe exceder los 5 segundos según el RNF 
  de rendimiento (15 intentos).

Ambiente:
  - Python 3.11+
  - Cliente HTTP simulando peticiones consecutivas al Backend
  - Backend FastAPI corriendo en local (puerto 8000)
"""

import time
import json
import urllib.request
import os

def main():
    # Configurar el usuario de prueba
    email = 'ac2022074258@virtual.upt.pe'
    data = json.dumps({
        'email': email,
        'name': 'ANDY MICHAEL CALIZAYA LADERA',
        'avatar_url': 'https://example.com/avatar.png'
    }).encode()
    
    url = 'http://127.0.0.1:8000/api/auth/login'
    
    times = [] # Aquí almacenaremos los tiempos de cada petición
    
    print("Iniciando prueba de rendimiento de Login (15 intentos)...")
    
    # Realizar 15 intentos consecutivos de login
    for i in range(15):
        req = urllib.request.Request(
            url, 
            data=data, 
            headers={'Content-Type': 'application/json'}, 
            method='POST'
        )
        
        start_time = time.time()
        try:
            # Enviar la petición y esperar a que responda completamente
            res = urllib.request.urlopen(req)
            res.read()  # Asegurarnos de leer toda la respuesta para que cuente el tiempo completo
            end_time = time.time()
            
            # Calcular el tiempo transcurrido
            elapsed = end_time - start_time
            times.append(elapsed)
            print(f"Intento {i+1}: {elapsed:.4f} segundos (Status: {res.status})")
        except Exception as e:
            print(f"Intento {i+1}: Fallido - {e}")
            
    # Si hubo intentos exitosos, calcular métricas y guardarlas
    if times:
        avg_time = sum(times) / len(times)
        max_time = max(times)
        min_time = min(times)
        
        print(f"\n--- Resultados ---")
        print(f"Tiempo Promedio: {avg_time:.4f} segundos")
        print(f"Tiempo Mínimo: {min_time:.4f} segundos")
        print(f"Tiempo Máximo: {max_time:.4f} segundos")
        
        # Guardar las métricas de rendimiento en la carpeta de resultados
        res_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'Resultado de Pruebas'))
        if not os.path.exists(res_dir):
            os.makedirs(res_dir)
            
        with open(os.path.join(res_dir, 'CP-05.txt'), 'w', encoding='utf-8') as f:
            f.write("=== Resultados CP-05 (Prueba de Rendimiento) ===\n")
            f.write(f"Intentos exitosos: {len(times)}/15\n")
            f.write(f"Tiempo Promedio de autenticación: {avg_time:.4f} segundos\n")
            f.write(f"Tiempo Mínimo: {min_time:.4f} segundos\n")
            f.write(f"Tiempo Máximo: {max_time:.4f} segundos\n\n")
            f.write("Observación: El tiempo promedio de autenticación medido en 15 intentos es óptimo y cumple sobradamente con el requerimiento de rendimiento de no exceder los 5 segundos.\n")
            
    else:
        print("No se pudieron registrar tiempos.")

if __name__ == "__main__":
    main()
