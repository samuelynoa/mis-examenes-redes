let preguntas = [];
let respuestasUsuario = {};
let modoActual = '';
let examenSeleccionado = '';

function mostrarMenu() {
    document.getElementById('menu-principal').classList.remove('hidden');
    document.getElementById('config-examen').classList.add('hidden');
    document.getElementById('area-examen').classList.add('hidden');
    cargarHistorial();
}

async function prepararExamen(archivo, titulo) {
    examenSeleccionado = titulo;
    try {
        const resp = await fetch(`data/${archivo}.json`);
        if (!resp.ok) throw new Error("Archivo no encontrado");
        preguntas = await resp.json();
        document.getElementById('titulo-seleccionado').innerText = titulo;
        document.getElementById('menu-principal').classList.add('hidden');
        document.getElementById('config-examen').classList.remove('hidden');
    } catch (e) {
        alert("Error: No se pudo cargar el archivo data/" + archivo + ".json");
    }
}

function iniciarExamen(modo) {
    modoActual = modo;
    respuestasUsuario = {};
    document.getElementById('config-examen').classList.add('hidden');
    document.getElementById('area-examen').classList.remove('hidden');
    document.getElementById('btn-finalizar').classList.toggle('hidden', modo === 'practica');
    renderizarPreguntas();
}

function renderizarPreguntas() {
    const contenedor = document.getElementById('contenedor-preguntas');
    contenedor.innerHTML = preguntas.map((p, i) => {
        const esMultiple = Array.isArray(p.correcta);
        const tipoInput = esMultiple ? 'checkbox' : 'radio';
        const htmlImagen = p.imagen ? `<div class="text-center"><img src="${p.imagen}" class="img-fluid my-3 border rounded shadow-sm" style="max-height: 300px;"></div>` : '';

        return `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <h5>${i + 1}. ${p.pregunta} ${esMultiple ? '<small class="text-muted">(Elija varias)</small>' : ''}</h5>
                ${htmlImagen}
                <div class="mt-3">
                    ${p.opciones.map((opt, j) => `
                        <div class="form-check">
                            <input class="form-check-input" type="${tipoInput}" name="p${i}" id="p${i}o${j}" 
                                   onclick="registrarRespuesta(${i}, ${j}, ${esMultiple})">
                            <label class="form-check-label" for="p${i}o${j}">${opt}</label>
                        </div>
                    `).join('')}
                </div>
                <div id="feedback-${i}" class="feedback hidden"></div>
            </div>
        </div>`;
    }).join('');
}

function registrarRespuesta(pIdx, oIdx, esMultiple) {
    if (esMultiple) {
        if (!respuestasUsuario[pIdx]) respuestasUsuario[pIdx] = [];
        const pos = respuestasUsuario[pIdx].indexOf(oIdx);
        if (pos === -1) respuestasUsuario[pIdx].push(oIdx);
        else respuestasUsuario[pIdx].splice(pos, 1);
    } else {
        respuestasUsuario[pIdx] = oIdx;
    }
    if (modoActual === 'practica') mostrarFeedback(pIdx);
}

function mostrarFeedback(i) {
    const div = document.getElementById(`feedback-${i}`);
    const respuesta = respuestasUsuario[i];
    const correcta = preguntas[i].correcta;
    let esCorrecto = false;

    if (Array.isArray(correcta)) {
        esCorrecto = Array.isArray(respuesta) && 
                     respuesta.length === correcta.length && 
                     correcta.every(val => respuesta.includes(val));
    } else {
        esCorrecto = respuesta === correcta;
    }

    div.innerHTML = `<strong>${esCorrecto ? '✅ Correcto' : '❌ Incorrecto'}</strong>. ${preguntas[i].feedback}`;
    div.className = `feedback ${esCorrecto ? 'correct' : 'incorrect'}`;
    div.classList.remove('hidden');
}

function finalizarExamen() {
    let aciertos = 0;
    preguntas.forEach((_, i) => {
        const respuesta = respuestasUsuario[i];
        const correcta = preguntas[i].correcta;
        let esCorrecto = Array.isArray(correcta) ? 
            (Array.isArray(respuesta) && respuesta.length === correcta.length && correcta.every(v => respuesta.includes(v))) : 
            (respuesta === correcta);
        
        if (esCorrecto) aciertos++;
        mostrarFeedback(i);
    });

    const nota = Math.round((aciertos / preguntas.length) * 100);
    guardarPuntaje(nota);
    alert(`Examen finalizado. Nota: ${nota}/100`);
    window.scrollTo(0,0);
}

function guardarPuntaje(nota) {
    const historial = JSON.parse(localStorage.getItem('historial_ccna') || '[]');
    historial.push({ fecha: new Date().toLocaleString(), examen: examenSeleccionado, nota: nota });
    localStorage.setItem('historial_ccna', JSON.stringify(historial));
    cargarHistorial();
}

function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial_ccna') || '[]');
    const tabla = document.getElementById('tabla-historial');
    if(tabla) {
        tabla.innerHTML = historial.reverse().map(h => `
            <tr>
                <td>${h.fecha}</td>
                <td>${h.examen}</td>
                <td><span class="badge ${h.nota >= 70 ? 'bg-success' : 'bg-danger'}">${h.nota}/100</span></td>
            </tr>
        `).join('');
    }
}

window.onload = cargarHistorial;
