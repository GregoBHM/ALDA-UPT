/*
 CP-35 - Medición de la duración de respuesta completa HTTP del Tutor ALDA.
 USO: Abrir ALDA local, iniciar sesión en una cuenta QA; consola DevTools.
 Copiar este script y reemplazar LAB_ID por UUID del laboratorio de prueba.
 No imprime cookies ni tokens. No usar en producción con datos reales.
 NOTA: mide el streaming HTTP, NO la última pintura del texto en la pantalla.
 El criterio completo de interfaz requiere observación complementaria manual.
*/
(async () => {
  const LAB_ID = 'REEMPLAZAR_POR_UUID_DE_LABORATORIO_QA';
  const URL = 'http://localhost:8000/api/student/assistant/stream';
  const N = 10;
  const LIMIT_SECONDS = 15;
  if (LAB_ID.startsWith('REEMPLAZAR_')) {
    console.error('Configura LAB_ID con un UUID de laboratorio QA antes de ejecutar.');
    return;
  }
  if (!location.origin.startsWith('http://localhost:5173')) {
    console.error('Ejecutar desde ALDA en http://localhost:5173 con sesión QA.');
    return;
  }
  const body = {
    messages: [{role:'user', text:'Dame una pista para resolver este error, sin dar código completo'}],
    code:'printsdsdsd("Hola Mundo")', language:'python',
    laboratory_id:LAB_ID,
    terminal_output:"NameError: name 'printsdsdsd' is not defined",
    is_pasted:false,
  };
  const results = [];
  for (let i = 1; i <= N; i++) {
    const start = performance.now();
    let http = null, bytes = 0, error = '';
    try {
      const res = await fetch(URL, {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      http = res.status;
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        bytes += value?.byteLength || 0;
      }
    } catch (e) { error = String(e.message || e); }
    const seconds = Number(((performance.now()-start)/1000).toFixed(3));
    const ok = !error && http === 200 && bytes > 0 && seconds < LIMIT_SECONDS;
    results.push({muestra:i, segundos:seconds, http, bytes, cumple:ok, error});
  }
  console.table(results);
  const successful = results.filter(x=>x.cumple);
  const sum = results.reduce((t,x)=>t+x.segundos,0);
  console.info('CP-35 / HTTP completo:', {
    total:N, conformes:successful.length,
    promedio_s: Number((sum/N).toFixed(3)),
    maximo_s: Math.max(...results.map(x=>x.segundos)),
    cumplen_todas: successful.length===N,
    nota:'Medición HTTP; pendiente verificar fin visual en la interfaz.'
  });
})();