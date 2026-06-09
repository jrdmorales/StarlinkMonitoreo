Necesitamos desarrollar una aplicación para monitorear el consumo de datos y generar alertas por correo electrónico hacia las áreas correspondientes.
Existen distintos tipos de obras, las cuales pueden contar con una o varias antenas. Para cada antena se requiere visualizar la siguiente información:

Porcentaje de uso
Uso versus límite
Consumo total
Días restantes para finalizar el ciclo
Historial de consumo
Estado actual

La aplicación debe permitir visualizar tanto el consumo diario como el mensual, además de almacenar un historial que permita analizar comportamientos. Esto es clave para identificar aquellas antenas que consumen su límite de GB antes de lo esperado y, en esos casos, evaluar la posibilidad de aumentar dicho límite.
También es necesario implementar un sistema de notificaciones por correo electrónico hacia las áreas responsables cuando el consumo de las antenas esté alcanzando niveles críticos. Se requieren tres tipos de alertas:

Al 50% de uso
Al 80% de uso
Al 100% de uso

Adicionalmente, considerando el consumo actual y los días restantes del ciclo, se deben generar proyecciones que permitan determinar si es necesario solicitar más bolsas de datos antes del cierre del período.
Toda la información debe almacenarse en una base de datos PostgreSQL para su posterior análisis. Las antenas deben estar registradas en la base de datos junto con sus respectivos consumos.
Se requiere un único perfil de administrador, quien tendrá la capacidad de:

Agregar o eliminar antenas
Modificar el nombre de la antena
Ajustar el límite de consumo

Los datos de consumo serán obtenidos desde una API con la siguiente estructura:


{
  "facet": [
    "EXC-QB-OF-1_STLK_PIC_10000698000",
    "cl-enterprise-local-priority-terminal-access-fee-clp",
    "2026-05-14T00:00:00"
  ],
  "% Uso": 60.0295,
  "Consumo Gigas": 1200.59,
  "Fecha Termino": "2026-06-14T00:00:00",
  "Limite uso GB": 2000
}


Además, las antenas están agrupadas por obra según la siguiente configuración:
const groupMapping = {
  "SALAR-CLIENTES": {
    codes: ["10000697951", "10000697963", "10000698005", "10000698006", "10000698012", "10000698009"]
    },
    "LOPINTO-CLIENTES": {
    codes: ["10000698019", "10000698003", "10000698018"]
    },
    "QB-CLIENTES": {
    codes: ["10000697942"]
    },
    "ZALD-CLIENTES": {
    codes: ["10000697998", "10000697999", "10000697944"]
    },
    "NEGR-CLIENTES": {
    codes: ["10000697973"]
    },
    "ALB-CLIENTES": {
    codes: ["10000698022"]
    }
};
