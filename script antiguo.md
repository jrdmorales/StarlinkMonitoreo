Authentication
None
Request Method
POST
URL
https://api.newrelic.com/graphql

Ignore SSL Issues (Insecure)
Response Format
JSON

JSON/RAW Parameters
Options
Body Parameters

Parameter 1
Name
query
Value
{   actor {     account(id: 7041272) {       nrql(query: "FROM consumoStarlink SELECT latest(ConsumoGigas) AS 'Consumo Gigas', latest(UsageLimitGB) AS 'Limite uso GB', 100 * latest(ConsumoGigas) / latest(UsageLimitGB) AS '% Uso', latest(EndDate) AS 'Fecha Termino' FACET Nickname AS 'Dispositivo', ProductId, StartDate AS 'Fecha de inicio' SINCE 5 days ago LIMIT MAX") {         results       }     }   } }


Headers

Header 1
Name
API-Key
Value
NRAK-REDACTED

Header 2
Name
Content-Type
Value
application/json



// 1. Función auxiliar para extraer el código numérico de un nombre de servicio.
// Busca una o más cifras (\d+) al final de la cadena ($).
function extractCode(serviceName) {
    const match = serviceName.match(/(\d+)$/);
    // Devuelve el grupo capturado (el código) o null si no se encuentra.
    return match ? match[1] : null;
}

// 2. Obtiene el resultado plano de New Relic.
const results = $json.data.actor.account.nrql.results || [];
const grouped = {}; // Agrupador: Key = Código, Value = Item con la fecha más reciente

// 3. Agrupa: por cada servicio, guarda su registro con la fecha más reciente, usando el CÓDIGO.
for (const item of results) {
    const servicioNombre = item.facet?.[0];
    const fecha = item.facet?.[2];

    // Extraer el código. Si no hay código, saltar este item.
    const codigo = extractCode(servicioNombre);
    if (!servicioNombre || !fecha || !codigo) continue;

    // Usar el código como clave de agrupación.
    // Comprueba si ya existe en el grupo o si la fecha actual es más reciente.
    if (!grouped[codigo] || fecha > grouped[codigo].facet[2]) {
        grouped[codigo] = item;
    }
}

// 4. Encuentra la fecha de ciclo más reciente en TODO el dataset, comparando por código.
let ultimaFecha = '';
for (const k in grouped) {
    if (grouped[k].facet[2] > ultimaFecha) {
        ultimaFecha = grouped[k].facet[2];
    }
}

// 5. Devuelve solo servicios cuyo ciclo coincide con la fecha más reciente.
return Object.values(grouped)
    .filter(x => x.facet[2] === ultimaFecha)
    .map(x => ({ json: x }));// 1. Función auxiliar para extraer el código numérico de un nombre de servicio.
// Busca una o más cifras (\d+) al final de la cadena ($).
function extractCode(serviceName) {
    const match = serviceName.match(/(\d+)$/);
    // Devuelve el grupo capturado (el código) o null si no se encuentra.
    return match ? match[1] : null;
}

// 2. Obtiene el resultado plano de New Relic.
const results = $json.data.actor.account.nrql.results || [];
const grouped = {}; // Agrupador: Key = Código, Value = Item con la fecha más reciente

// 3. Agrupa: por cada servicio, guarda su registro con la fecha más reciente, usando el CÓDIGO.
for (const item of results) {
    const servicioNombre = item.facet?.[0];
    const fecha = item.facet?.[2];

    // Extraer el código. Si no hay código, saltar este item.
    const codigo = extractCode(servicioNombre);
    if (!servicioNombre || !fecha || !codigo) continue;

    // Usar el código como clave de agrupación.
    // Comprueba si ya existe en el grupo o si la fecha actual es más reciente.
    if (!grouped[codigo] || fecha > grouped[codigo].facet[2]) {
        grouped[codigo] = item;
    }
}

// 4. Encuentra la fecha de ciclo más reciente en TODO el dataset, comparando por código.
let ultimaFecha = '';
for (const k in grouped) {
    if (grouped[k].facet[2] > ultimaFecha) {
        ultimaFecha = grouped[k].facet[2];
    }
}

// 5. Devuelve solo servicios cuyo ciclo coincide con la fecha más reciente.
return Object.values(grouped)
    .filter(x => x.facet[2] === ultimaFecha)
    .map(x => ({ json: x }));


    // =========================================================================
// 1. CONFIGURACIÓN DE GRUPOS Y DESTINATARIOS (INPUT MANUAL)
//    Cada clave principal es el NOMBRE AMIGABLE del grupo (para el reporte).
//    El valor debe ser un objeto con el email y la lista de códigos de servicio.
// =========================================================================
const groupMapping = {
    "SALAR-CLIENTES": {
        email: "jmorales@excon.cl",
        codes: ["10000697951", "10000697963", "10000698005", "10000698006", "10000698012", "10000698009"]
    },
    "LOPINTO-CLIENTES": {
        email: "jmorales@excon.cl",
        codes: ["10000698019", "10000698003", "10000698018"]
    },
    "QB-CLIENTES": {
        email: "jmorales@excon.cl",
        codes: ["10000697942"]
    },
    "ZALD-CLIENTES": {
        email: "jmorales@excon.cl",
        codes: ["10000697998", "10000697999", "10000697944"]
    },
    "NEGR-CLIENTES": {
        email: "jmorales@excon.cl",
        codes: ["10000697973"]
    },
    "ALB-CLIENTES": {
        email: "jmorales@excon.cl",
        codes: ["10000698022"]
    },
    "OTROS-CLIENTES": {
        // Este es el email por defecto si el código no coincide con ningún grupo.
        email: "jmorales@excon.cl",
        codes: [] 
    }
};

// =========================================================================
// 2. LÓGICA DE NEGOCIO Y ANÁLISIS DE CICLO
// =========================================================================
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();

let ciclo_inicio, ciclo_fin;
// Determina si el ciclo incluye el día 14 de este mes o se reporta el mes anterior
if (now.getDate() >= 14) {
  ciclo_inicio = new Date(year, month, 14, 0, 0, 0, 0);
  ciclo_fin = new Date(year, month + 1, 13, 23, 59, 59, 999);
} else {
  ciclo_inicio = new Date(year, month - 1, 14, 0, 0, 0, 0);
  ciclo_fin = new Date(year, month, 13, 23, 59, 59, 999);
}

const hoy = now;
const dias_corridos = Math.ceil((hoy - ciclo_inicio) / (1000 * 60 * 60 * 24)) + 1;
const dias_restantes = Math.max(0, Math.ceil((ciclo_fin - hoy) / (1000 * 60 * 60 * 24)));


// Frases de cierre aleatorias (las mismas que antes)
const frases = [

];


// =========================================================================
// 3. AGRUPACIÓN DE DATOS POR CÓDIGO DE SERVICIO
// =========================================================================

const grupos = {};
const resultadosConGrupo = []; // Array temporal para manejar el post-procesamiento

// Función para extraer el código numérico del nombre del servicio
function extractCode(serviceName) {
    const match = serviceName.match(/(\d+)$/);
    return match ? match[1] : null;
}

for (const {json: item} of $input.all()) {
    const servicioNombre = item.facet?.[0];
    const codigo = extractCode(servicioNombre);
    
    if (!servicioNombre || !codigo) continue;

    let groupName = "OTROS-CLIENTES"; // Por defecto, si no encuentra grupo
    let groupDetails = groupMapping["OTROS-CLIENTES"];

    // 3a. Identificar a qué grupo pertenece este código
    for (const [gName, details] of Object.entries(groupMapping)) {
        if (details.codes.includes(codigo)) {
            groupName = gName;
            groupDetails = details;
            break; 
        }
    }
    
    // 3b. Obtener datos y calcular sugerencia (Lógica de Negocio)
    const consumo = parseFloat(item["Consumo Gigas"]) || 0;
    const limite = parseFloat(item["Limite uso GB"]) || 1;
    const uso_pct = parseFloat(item["% Uso"]) || 0;
    const promedio_diario = consumo / Math.max(dias_corridos, 1);
    const proyeccion_total = promedio_diario * (dias_corridos + dias_restantes);
    const deficit = Math.max(0, proyeccion_total - limite);
    const bolsas_50 = Math.ceil(deficit / 50);

    let sugerencia = "";
    if (deficit > 15) {
        sugerencia = `No alcanzarás a fin de ciclo con tu cuota actual. Agrega al menos <b>${bolsas_50}</b> bolsa${bolsas_50 === 1 ? '' : 's'} de 50GB.`;
    } else if (uso_pct > 80) {
        sugerencia = "Precaución: ya superaste el 80% de la cuota. Revisa tu consumo diario.";
    } else if (deficit > 0) {
        sugerencia = `Podrías necesitar <b>${bolsas_50}</b> bolsa${bolsas_50 === 1 ? '' : 's'} extra (50GB c/u) si el ritmo sigue igual.`;
    } else {
        sugerencia = "Vas dentro del consumo esperado, tu cuota actual debería ser suficiente.";
    }

    // 3c. Almacenar en la estructura de grupos
    if (!grupos[groupName]) {
        grupos[groupName] = [];
    }
    
    grupos[groupName].push({
        nombre: item.facet[0], // Usamos el nombre completo como subservicio
        consumo: consumo.toFixed(2),
        limite: limite.toFixed(0),
        uso_pct: uso_pct.toFixed(2),
        promedio_diario: promedio_diario.toFixed(2),
        dias_restantes: dias_restantes,
        sugerencia: sugerencia
    });
}

// =========================================================================
// 4. GENERACIÓN DE REPORTES FINALES PARA MAILING
// =========================================================================
const results = [];
for (const [grupo, servicios] of Object.entries(grupos)) {
    const groupDetails = groupMapping[grupo] || groupMapping["OTROS-CLIENTES"];
    const destino = groupDetails.email;
    const firma_kor = frases[Math.floor(Math.random() * frases.length)];

    let tabla = `<table style="width:100%; border-collapse:collapse; font-size: 15px; background: #23272a; border-radius:8px;">
        <tr style="color:#8ec8ff;">
            <th style="padding:8px; text-align:left;">Subservicio</th>
            <th style="padding:8px; text-align:right;">Consumo</th>
            <th style="padding:8px; text-align:right;">Plan</th>
            <th style="padding:8px; text-align:right;">% Uso</th>
            <th style="padding:8px; text-align:right;">Promedio</th>
            <th style="padding:8px; text-align:right;">Días Rest.</th>
            <th style="padding:8px; text-align:left;">Sugerencia</th>
        </tr>`;
    
    for (const s of servicios) {
        tabla += `<tr>
            <td style="padding:6px;">${s.nombre}</td>
            <td style="padding:6px; text-align:right;">${s.consumo} GB</td>
            <td style="padding:6px; text-align:right;">${s.limite} GB</td>
            <td style="padding:6px; text-align:right;">${s.uso_pct}%</td>
            <td style="padding:6px; text-align:right;">${s.promedio_diario} GB/día</td>
            <td style="padding:6px; text-align:right;">${s.dias_restantes}</td>
            <td style="padding:6px;">${s.sugerencia}</td>
        </tr>`;
    }
    tabla += `</table>`;

    results.push({
        json: {
            grupo,
            mail_to: destino,
            tabla_resumen: tabla,
            mes_inicio: ciclo_inicio.toLocaleString('es-CL', {month: 'long', day: 'numeric'}),
            mes_fin: ciclo_fin.toLocaleString('es-CL', {month: 'long', day: 'numeric'}),
            fecha_reporte: now.toISOString().split('T')[0],
            firma_kor
        }
    });
}
return results;