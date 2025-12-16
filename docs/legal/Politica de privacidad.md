# Política de Privacidad de Gastify

**Última actualización:** [FECHA]  
**Versión:** 1.0

---

## 1. Introducción

Bienvenido a Gastify. Nos tomamos muy en serio la privacidad de tus datos. Esta política explica de forma clara y sencilla qué información recopilamos, cómo la usamos y cuáles son tus derechos.

**En resumen:** Gastify escanea tus boletas para ayudarte a entender en qué se va tu plata. No vendemos tus datos. No compartimos tu información personal con terceros para fines publicitarios. Punto.

---

## 2. Información que Recopilamos

### 2.1 Datos de tu Cuenta

Cuando inicias sesión con Google, recibimos:

| Dato | Para qué lo usamos | Lo almacenamos |
|------|-------------------|----------------|
| Identificador único de Google | Identificar tu cuenta | Sí (encriptado) |
| Correo electrónico | Comunicaciones importantes | Sí |
| Nombre de perfil | Personalizar la app | No* |
| Foto de perfil | Mostrar en la app | No* |

*Estos datos se obtienen de Google en cada sesión pero no los almacenamos en nuestros servidores.

### 2.2 Datos de tus Transacciones

Cuando escaneas una boleta, almacenamos:

- **Comercio:** Nombre de la tienda o local
- **Fecha:** Fecha de la compra
- **Monto total:** Valor total de la boleta
- **Ítems:** Detalle de productos comprados (nombre y precio)
- **Categoría:** Clasificación del gasto (Supermercado, Restaurant, etc.)

### 2.3 Datos de Configuración

Para personalizar tu experiencia:

- País
- Ciudad (opcional)
- Moneda preferida
- Idioma

### 2.4 Datos que NO Recopilamos

Gastify **nunca** solicita ni almacena:

- ❌ RUT o número de identificación
- ❌ Dirección de domicilio
- ❌ Números de tarjetas de crédito o débito
- ❌ Información bancaria
- ❌ Contraseñas (usamos Google OAuth)

---

## 3. Cómo Procesamos tus Boletas

### 3.1 Tecnología de Escaneo

Utilizamos inteligencia artificial de Google (Gemini API) para extraer información de las imágenes de tus boletas.

**El proceso funciona así:**

1. Tomas una foto o subes una imagen de tu boleta
2. La imagen se envía de forma segura a Google Gemini API
3. La IA extrae el texto y datos relevantes
4. Los datos extraídos se guardan en tu cuenta
5. La imagen original puede ser descartada o almacenada según tu preferencia

### 3.2 Procesamiento por Terceros

| Servicio | Proveedor | Datos procesados | Propósito |
|----------|-----------|------------------|-----------|
| Autenticación | Google (Firebase Auth) | Credenciales de Google | Inicio de sesión seguro |
| Escaneo de boletas | Google (Gemini API) | Imágenes de boletas | Extracción de datos |
| Base de datos | Google (Cloud Firestore) | Transacciones | Almacenamiento seguro |
| Hosting | Google (Firebase Hosting) | Contenido de la app | Entrega de la aplicación |

Todos estos servicios cumplen con estándares internacionales de seguridad y privacidad (SOC 2, ISO 27001).

---

## 4. Cómo Protegemos tus Datos

### 4.1 Medidas de Seguridad

- **Encriptación en tránsito:** Toda comunicación usa HTTPS/TLS
- **Encriptación en reposo:** Tus datos se almacenan encriptados (AES-256)
- **Aislamiento de datos:** Solo tú puedes acceder a tus transacciones
- **Autenticación segura:** Usamos Google OAuth 2.0, sin contraseñas almacenadas

### 4.2 Acceso a tus Datos

Solo tú tienes acceso a tus transacciones individuales. Ni siquiera el equipo de Gastify puede ver tus boletas específicas sin tu autorización expresa.

---

## 5. Uso de Datos Agregados y Estadísticas

### 5.1 Qué son los Datos Agregados

Podemos generar estadísticas generales combinando datos de muchos usuarios de forma **completamente anónima**. Por ejemplo:

- "El gasto promedio en supermercados en Santiago es de $XX.XXX"
- "Los chilenos gastan 20% más los fines de semana"

### 5.2 Garantías de Anonimización

Antes de generar cualquier estadística pública, garantizamos:

- **Mínimo de usuarios:** Solo publicamos datos que representen al menos 30 usuarios
- **Sin identificación posible:** Ninguna combinación de datos puede identificar a un usuario específico
- **Sin datos individuales:** Nunca publicamos transacciones, montos o patrones de un usuario específico

### 5.3 Para qué Usamos Estadísticas Agregadas

- Mejorar la precisión de categorización automática
- Publicar reportes sobre tendencias de consumo en Chile
- Desarrollar nuevas funcionalidades basadas en patrones generales

**Importante:** Estas estadísticas nunca contienen información que pueda identificarte a ti o a tus gastos específicos.

---

## 6. Retención de Datos

### 6.1 Cuánto Tiempo Guardamos tus Datos

| Tipo de cuenta | Retención de transacciones |
|----------------|---------------------------|
| Plan Gratuito | 3 meses |
| Plan Pro | 12 meses |
| Plan Familia | 24 meses |

### 6.2 Eliminación de Datos

Puedes eliminar tus datos en cualquier momento:

- **Transacciones individuales:** Desde la app, desliza para eliminar
- **Todas las transacciones:** Configuración → Eliminar todos mis datos
- **Tu cuenta completa:** Configuración → Eliminar mi cuenta

Cuando eliminas tus datos, estos se borran permanentemente de nuestros servidores en un plazo máximo de 30 días.

---

## 7. Tus Derechos

De acuerdo con la legislación chilena (Ley 19.628 y Ley 21.719), tienes derecho a:

### 7.1 Acceso
Puedes solicitar una copia de todos los datos que tenemos sobre ti.

### 7.2 Rectificación
Puedes corregir cualquier dato incorrecto directamente en la app o solicitándonos que lo hagamos.

### 7.3 Eliminación
Puedes solicitar que eliminemos todos tus datos personales en cualquier momento.

### 7.4 Portabilidad
Puedes exportar tus transacciones en formato CSV para usar en otras aplicaciones.

### 7.5 Oposición
Puedes oponerte al uso de tus datos para estadísticas agregadas contactándonos.

**Para ejercer estos derechos:** Escríbenos a privacidad@gastify.com

---

## 8. Uso por Menores de Edad

Gastify está diseñado para mayores de 18 años. No recopilamos intencionalmente datos de menores de edad. Si eres padre/madre y crees que tu hijo ha usado Gastify, contáctanos para eliminar esa información.

---

## 9. Cambios a Esta Política

Podemos actualizar esta política ocasionalmente. Cuando hagamos cambios importantes:

- Te notificaremos dentro de la app
- Publicaremos la nueva versión con fecha de actualización
- Los cambios entrarán en vigencia 30 días después de la notificación

Si continúas usando Gastify después de los cambios, entendemos que aceptas la nueva política.

---

## 10. Contacto

Si tienes preguntas sobre esta política o sobre cómo manejamos tus datos:

- **Email:** privacidad@gastify.com
- **Responsable:** [NOMBRE DE LA EMPRESA O PERSONA NATURAL]
- **Dirección:** [DIRECCIÓN EN CHILE]

---

## 11. Legislación Aplicable

Esta política se rige por las leyes de la República de Chile, incluyendo:

- Ley 19.628 sobre Protección de la Vida Privada
- Ley 21.719 sobre Protección de Datos Personales
- Ley 19.496 sobre Protección de los Derechos de los Consumidores

Para cualquier controversia, serán competentes los tribunales ordinarios de justicia de Santiago de Chile.

---

## Resumen en Simple

| Pregunta | Respuesta |
|----------|-----------|
| ¿Qué guardan de mí? | Tus boletas escaneadas y configuración básica |
| ¿Guardan mi RUT o tarjetas? | No, nunca |
| ¿Venden mis datos? | No |
| ¿Quién puede ver mis boletas? | Solo tú |
| ¿Puedo borrar todo? | Sí, cuando quieras |
| ¿Usan mis datos para estadísticas? | Solo de forma anónima y agregada |

---

*Esta política fue redactada pensando en ser clara y honesta. Si algo no te queda claro, escríbenos. Queremos que confíes en Gastify.*