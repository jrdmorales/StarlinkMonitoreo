# PROCEDIMIENTO DE COMPRA Y CONTRATACIÓN DEL SERVICIO STARLINK MEDIANTE ENTEL

---

## Control de Documentos

| SGC - Sistema Gestión de Calidad | Código: PG-SGC-RH-011 | Versión: 3 | Ejemplar: 01 |
|--------------------------------|-----------------------|------------|--------------|

| Revisado por | Aprobado por | Destinatario |
|-------------|-------------|-------------|
| Daniel Salinas  <br> Jefe de TIC | Cristian Roa <br> Subgerente de Administración | |
| Fecha: 03-06-2026 | Fecha: 03-06-2026 | Fecha: |

---

## 1. COMPRA DE EQUIPOS – VÍA PM

La compra del equipamiento se realiza a través del sistema **ReqLogic**, mediante la emisión de un **Pedido de Material (PM)**.  

Cada kit incluye los componentes necesarios para habilitar el servicio de conectividad en obra, excepto el AP WiFi, que debe solicitarse por separado.

### Elementos del Kit

| Elemento del Kit | Descripción |
|-----------------|------------|
| Antena Starlink | Equipo de recepción satelital principal |
| Firewall Fortinet FG40F | Control de tráfico y políticas de seguridad |

### Consideraciones

- Código para solicitud en ReqLogic: **ESTAR00000**
- Plazo de entrega: **20 días hábiles** desde la recepción de la OC
- Los equipos serán configurados por el área de TI antes del despacho a obra
- Los despachos deben ser realizados por el proveedor a Bodega Central
- El comprador debe informar al proveedor en formato **DMS** las coordenadas geográficas
- El comprador y/o encargado debe informar a TI vía ticket la compra de antena y contratación de servicios (OC, FCN y PM)

---

## 2. COMPRA DE AP WIFI (FORTIAP) – VÍA PM

El Access Point FortiAP WiFi debe solicitarse de manera independiente al kit Starlink.  

Cada obra debe gestionar un **PM específico** según necesidad de cobertura.

### Códigos ReqLogic

- **XIC1174** → AP WIFI  
- **XIC0322** → Inyector POE (transformador)  
- **XIC1200** → Trébol triple (cable de poder)

### Recomendaciones

- Se recomienda **1 AP WiFi cada 30–40 dispositivos**
- Cobertura aproximada: **100 metros**
- La cobertura puede reducirse por:
  - Tabiquería  
  - Vidrio  
  - Muros  
- Se recomienda:
  - 1 AP por oficina  
  - 2 AP en oficinas con alta densidad de obstáculos  

---

## 3. CONTRATO DE SERVICIO – VÍA FCN

El contrato corresponde al **plan de datos mensual**, gestionado mediante una **Ficha de Cierre de Negocio (FCN)** con ENTEL.  

El proveedor factura los avances mensuales asociados a la HES correspondiente.

### Planes de Datos

| Plan | Renta Mensual (UF) | Uso Recomendado | Usuarios |
|------|-------------------|----------------|----------|
| 500 GB | 5,67 | Obras medianas con uso controlado | 10–15 |
| 1 TB | 9,10 | Obras medianas-grandes (Teams / M365) | 15–20 |
| 2 TB | 15,96 | Obras grandes con alta demanda | 30–40 |
| 6 TB | 43,38 | Proyectos principales con múltiples frentes | 100+ |

---

## 4. BOLSAS ADICIONALES DE DATOS – VÍA PM

En caso de consumo total del plan, se pueden solicitar **bolsas adicionales de 50 GB**.

- Activación: hasta **96 horas hábiles** desde la recepción de la OC

### Códigos

- Compra de bolsa: **XSE1287** → 1,78 UF c/u  
- Activación: **XSE1390** → 1 UF por antena  

### Ejemplos

- 8 bolsas = 14,24 UF + 1 UF = **15,24 UF total**
- 6 bolsas en 3 antenas = 10,68 UF + 3 UF = **13,68 UF total**

---

## Monitoreo y Alertas de Consumo

- TI monitorea continuamente el consumo de cada antena  
- Reporte semanal: **todos los viernes**  
- Alertas automáticas en:
  - 60%
  - 80%
  - 100%

Se notificará vía correo electrónico para gestionar bolsas adicionales.

---

## Responsabilidades

| Área / Rol | Responsabilidad |
|------------|----------------|
| Obra | Gestionar PM y FCN, mantener equipos operativos, coordinar con TI |
| TI Corporativo | Monitorear consumo, generar alertas, configurar y administrar equipos |
| Proveedor ENTEL | Proveer conectividad, ejecutar recargas, cumplir plazos |

---

## Diagrama de Flujo

Proceso de compra y contratación del servicio.
Inicio
  ↓
Solicitud de PM (KIT STARLINK)
  ↓
Recepción de Equipos (15 días)
  ↓
Configuración por TI
  ↓
Envío a Obra
  ↓
Generación de FCN (Plan de Datos)
  ↓
Monitoreo de Consumo
  ↓
Solicitud de Bolsas (PM)
  ↓
Activación (48h)
  ↓
Fin del proceso
