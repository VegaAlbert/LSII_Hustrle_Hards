# Analytics of my videos (US-11)

**Approved on:** PENDING — proposed in the PR of branch `task/11-video-analytics`
**Approved by:** PENDING team review
**Used for:** implementing US-11 (view analytics for my videos) end to end: view tracking, analytics endpoint,
analytics page with totals, audience breakdown, views over time, per-video table and empty state

## Prompt

The prompt was written in Spanish and is kept verbatim below (NFR-07 asks to preserve the exact prompt). Summary in
English: act as a senior full-stack developer and implement US-11 in the existing project; first analyse the
architecture, how videos and their metrics are stored and how the logged-in user is identified, and reuse what
exists; show total views, likes, comments and videos plus per-video stats, computed from the database (no mock
data); only for authenticated users, always filtered by the user of the session so nobody can read someone else's
stats; a friendly empty state with a link to upload when the user has no videos; follow the design system without
new libraries; change the database schema only if strictly necessary; add backend and frontend tests for the four
scenarios (user with videos, user without videos, anonymous visitor, data isolation between users); finally report
the features, files, how each metric is calculated, how isolation is guaranteed, the tests run and any manual step.
The work was done on the branch `task/11-video-analytics`, created from an up-to-date `develop`, following
`AGENTS.md`, `backend/AGENTS.md`, `frontend/AGENTS.md` and the `create-rest-endpoint` skill.

```text
Actúa como un desarrollador Full Stack Senior experto. Necesito que implementes la siguiente historia de usuario en mi proyecto existente.

# US-11: View analytics for my videos

## Descripción
As an authenticated user, I want to see analytics for my videos, so that I can understand how my content is performing.

## Acceptance Criteria

1. Given an authenticated user with uploaded videos, when they open the analytics page, then they see metrics (e.g. views, comments, likes) relevant to their own content.

2. Given a user with no uploaded videos, when they open the analytics page, then an empty state is shown instead of an error.

Priority: Must Have
Estimate: 5 Story Points.

# INSTRUCCIONES DE IMPLEMENTACIÓN

Antes de empezar a programar, analiza todo el proyecto para comprender su arquitectura y cómo está construido.

## 1. Analiza el proyecto
- Identifica las tecnologías utilizadas (frontend, backend, base de datos, autenticación, etc.).
- Revisa la estructura de carpetas y los componentes existentes.
- Identifica cómo se gestionan actualmente los vídeos y sus métricas.
- Comprueba cómo se identifica al usuario autenticado.
- Revisa si ya existen endpoints, servicios, modelos o componentes relacionados con estadísticas o analytics.
- Identifica el sistema de diseño y los estilos que utiliza el proyecto.

No crees funcionalidades duplicadas si ya existe algo que puedas reutilizar.

## 2. Implementa la funcionalidad de Analytics

Crea o adapta la página de Analytics para que el usuario autenticado pueda consultar las estadísticas de sus propios vídeos.

La página debe mostrar, siempre que los datos estén disponibles:

- Total de visualizaciones de sus vídeos.
- Total de likes.
- Total de comentarios.
- Número total de vídeos subidos.

También sería interesante mostrar estadísticas individuales de cada vídeo, por ejemplo:
- Título del vídeo.
- Número de visualizaciones.
- Número de likes.
- Número de comentarios.

Los datos deben proceder de la base de datos y de las relaciones existentes en el proyecto. No utilices datos ficticios ni valores hardcodeados.

## 3. Seguridad y autenticación

- La funcionalidad debe estar disponible únicamente para usuarios autenticados.
- Cada usuario solo puede consultar las estadísticas de sus propios vídeos.
- Utiliza el usuario obtenido de la sesión o del mecanismo de autenticación existente.
- No permitas que un usuario pueda consultar las estadísticas de otro modificando parámetros o identificadores.
- Respeta las medidas de seguridad y autorización que ya tenga implementadas el proyecto.

## 4. Estado vacío (Empty State)

Cuando un usuario autenticado todavía no haya subido ningún vídeo:

- La página debe mostrarse correctamente.
- Debe aparecer un mensaje indicando que todavía no hay estadísticas disponibles.
- Incluye un diseño visual agradable y coherente con el resto de la aplicación.
- Si existe una sección para subir vídeos, puedes incluir un botón que lleve a ella.
- No debe aparecer ningún error ni una pantalla en blanco.

## 5. Diseño e interfaz

- Respeta el diseño actual de la aplicación.
- Reutiliza los componentes existentes siempre que sea posible.
- Utiliza tarjetas o widgets para presentar las métricas principales.
- Organiza la información de forma clara, moderna y responsive.
- Mantén la coherencia con los colores, tipografías, espaciados y estilos existentes.
- Evita introducir librerías nuevas si no son necesarias.

## 6. Backend y base de datos

Si la arquitectura del proyecto lo requiere:

- Implementa los endpoints necesarios para obtener las estadísticas.
- Reutiliza los modelos y relaciones existentes.
- Realiza correctamente los cálculos de visualizaciones, likes y comentarios.
- Filtra siempre los resultados por el usuario autenticado.
- Gestiona correctamente los casos en los que no existan datos.
- Evita consultas innecesarias o ineficientes.

No modifiques el esquema de la base de datos salvo que sea estrictamente necesario.

## 7. Testing

Comprueba los siguientes escenarios:

**Caso 1: Usuario autenticado con vídeos**
- Accede a Analytics.
- Visualiza el número total de vídeos.
- Visualiza el total de views, likes y comments.
- Los datos corresponden exclusivamente a sus propios vídeos.

**Caso 2: Usuario autenticado sin vídeos**
- Accede a Analytics.
- Aparece el estado vacío.
- No se producen errores.

**Caso 3: Usuario no autenticado**
- No puede acceder a las estadísticas.
- Se aplica el mecanismo de protección de rutas existente.

**Caso 4: Separación de datos entre usuarios**
- Un usuario no puede consultar las estadísticas de otro usuario.

Ejecuta los tests existentes y añade los necesarios para cubrir esta funcionalidad.

# REGLAS IMPORTANTES

1. No rompas ninguna funcionalidad existente.
2. No elimines código que no esté relacionado con esta historia de usuario.
3. No cambies tecnologías ni arquitectura sin una razón justificada.
4. No inventes endpoints, modelos o relaciones sin comprobar primero cómo funciona el proyecto.
5. No utilices datos mock o hardcodeados para simular las estadísticas.
6. Sigue las convenciones de código existentes.
7. Implementa tanto frontend como backend si ambos son necesarios.
8. Asegúrate de que la funcionalidad funciona realmente y no es solamente una interfaz visual.

# RESULTADO FINAL

Cuando termines:

1. Resume qué funcionalidades has implementado.
2. Indica todos los archivos que has creado o modificado.
3. Explica cómo obtienes y calculas cada métrica.
4. Explica cómo garantizas que cada usuario solo ve sus estadísticas.
5. Indica qué tests has ejecutado y sus resultados.
6. Indica si hay algún paso manual pendiente para que la funcionalidad funcione.

**IMPORTANTE:** Primero analiza el proyecto y después implementa la solución directamente en el código existente. No te limites a explicarme qué tendría que hacer: quiero que realices la implementación completa de US-11.
```

## Notes

* The project stored no views and no video likes, only comments with a `likeCount`. Views needed one new table,
  `video_views` (video, optional viewer, date), the only schema change: it also gives the authenticated/anonymous
  split and the views over time of the example in `resources/analytics.png`.
* "Likes" are the likes of the comments of my videos (labelled "Comment likes"): liking a video has no user story.
  If one is added, add its count to `VideoStatistics`.
* A view is counted each time the detail page is opened (`POST /api/videos/{id}/views`, public); `GET
  /api/videos/{id}` does not count because the edit page also uses it. There is no deduplication of repeated visits.
* `GET /api/analytics` takes no user id: the user always comes from the JWT.
