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
        preguntas = await resp.json();
        document.getElementById('titulo-seleccionado').innerText = titulo;
        document.getElementById('menu-principal').classList.add('hidden');
        document.getElementById('config-examen').classList.remove('hidden');
    } catch (e) {
        alert("Error al cargar las preguntas. Asegúrate de que el archivo JSON existe en la carpeta /data");
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
        // Determinamos si es de selección múltiple viendo si 'correcta' es un Array
        const esMultiple = Array.isArray(p.correcta);
        const tipoInput = esMultiple ? 'checkbox' : 'radio';

        return `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <h5>${i + 1}. ${p.pregunta} ${esMultiple ? '<small class="text-muted">(Elija varias)</small>' : ''}</h5>
                ${p.opciones.map((opt, j) => `
                    <div class="form-check">
                        <input class="form-check-input" type="${tipoInput}" name="p${i}" id="p${i}o${j}" 
                               onclick="registrarRespuesta(${i}, ${j}, ${esMultiple})">
                        <label class="form-check-label" for="p${i}o${j}">${opt}</label>
                    </div>
                `).join('')}
                <div id="feedback-${i}" class="feedback hidden"></div>
            </div>
        </div>`;
    }).join('');
}

function registrarRespuesta(pIdx, oIdx, esMultiple) {
    if (esMultiple) {
        if (!respuestasUsuario[pIdx]) respuestasUsuario[pIdx] = [];
        const pos = respuestasUsuario[pIdx].indexOf(oIdx);
        if (pos === -1) {
            respuestasUsuario[pIdx].push(oIdx);
        } else {
            respuestasUsuario[pIdx].splice(pos, 1);
        }
    } else {
        respuestasUsuario[pIdx] = oIdx;
    }

    if (modoActual === 'practica') {
        mostrarFeedback(pIdx);
    }
}

function mostrarFeedback(i) {
    const div = document.getElementById(`feedback-${i}`);
    const correcta = preguntas[i].correcta;
    const esCorrecto = respuestasUsuario[i] === correcta;
    
    div.innerHTML = `<strong>${esCorrecto ? '¡Correcto!' : 'Incorrecto'}</strong>. ${preguntas[i].feedback}`;
    div.className = `feedback ${esCorrecto ? 'correct' : 'incorrect'}`;
    div.classList.remove('hidden');
}

function finalizarExamen() {
    let aciertos = 0;
    preguntas.forEach((p, i) => {
        const respuesta = respuestasUsuario[i];
        const correcta = p.correcta;
        
        let esCorrecto = false;
        if (Array.isArray(correcta)) {
            // Verifica que tengan el mismo largo y mismos elementos
            esCorrecto = Array.isArray(respuesta) && 
                         respuesta.length === correcta.length && 
                         correcta.every(val => respuesta.includes(val));
        } else {
            esCorrecto = respuesta === correcta;
        }

        if (esCorrecto) aciertos++;
        mostrarFeedback(i);
    });

    const nota = Math.round((aciertos / preguntas.length) * 100);
    guardarPuntaje(nota);
    alert(`Examen finalizado. Tu nota es: ${nota}/100`);
    window.scrollTo(0,0);
}

function guardarPuntaje(nota) {
    const historial = JSON.parse(localStorage.getItem('historial_ccna') || '[]');
    historial.push({
        fecha: new Date().toLocaleString(),
        examen: examenSeleccionado,
        nota: nota
    });
    localStorage.setItem('historial_ccna', JSON.stringify(historial));
    cargarHistorial();
}

function cargarHistorial() {
    const historial = JSON.parse(localStorage.getItem('historial_ccna') || '[]');
    const tabla = document.getElementById('tabla-historial');
    tabla.innerHTML = historial.reverse().map(h => `
        <tr>
            <td>${h.fecha}</td>
            <td>${h.examen}</td>
            <td><span class="badge ${h.nota >= 70 ? 'bg-success' : 'bg-danger'}">${h.nota}/100</span></td>
        </tr>
    `).join('');
}

window.onload = cargarHistorial;
