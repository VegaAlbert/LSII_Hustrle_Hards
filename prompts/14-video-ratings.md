# Video ratings

**Approved on:** PENDING — proposed in the PR of branch `feature/video-ratings`
**Approved by:** PENDING team review
**Used for:** implementing the "Rating videos" extra feature of `README.md` end to end: rating entity with one rating
per user and video, rating endpoints, star picker and average rating on the video page

## Prompt

The prompt was written in Spanish and is kept verbatim below (NFR-07 asks to preserve the exact prompt). Summary in
English: act as a senior full-stack developer and implement video ratings in the existing project; first analyse the
architecture, authentication, how videos are stored and whether likes, comments or ratings already exist; logged-in
users rate videos from 1 to 5 stars with a visual picker, one active rating per user and video (rating again updates
it), anonymous users cannot rate; every video shows its real average with stars and the number of ratings, or "No
ratings yet"; a database constraint must prevent duplicate ratings; the user comes from the session, scores are
validated in the backend; hover feedback, success and error messages, responsive, no new libraries; tests for rating,
updating, anonymous users, no ratings, several users and invalid scores; finally report what was built, the files,
how ratings, the average and the duplicate protection work, the endpoints, the tests and any manual step. The work
was done on the branch `feature/video-ratings`, created from an up-to-date `develop`, following `AGENTS.md`,
`backend/AGENTS.md`, `frontend/AGENTS.md` and the `create-rest-endpoint` skill.

```text
Actúa como un desarrollador Full Stack Senior experto. Necesito que implementes la funcionalidad **Product: Video Ratings** en mi proyecto existente.

# PRODUCT: VIDEO RATINGS

## Descripción

Let authenticated users rate videos and show the average rating.

## Objetivo

Permitir que los usuarios autenticados puedan valorar los vídeos de la plataforma y que se muestre la valoración media de cada vídeo.

# INSTRUCCIONES DE IMPLEMENTACIÓN

## 1. Analiza primero el proyecto

Antes de modificar cualquier archivo:

- Analiza la arquitectura y estructura del proyecto.
- Identifica las tecnologías utilizadas en frontend y backend.
- Revisa cómo funciona actualmente la autenticación.
- Identifica cómo están implementados los vídeos y cómo se almacenan en la base de datos.
- Comprueba si ya existe alguna funcionalidad de likes, comentarios o valoraciones.
- Revisa los componentes visuales existentes para mantener el mismo diseño.

Reutiliza todo lo que sea posible y evita duplicar funcionalidades.

## 2. Sistema de valoraciones

Implementa un sistema que permita a los usuarios autenticados valorar los vídeos.

Requisitos:

- Los usuarios autenticados pueden valorar cualquier vídeo al que tengan acceso.
- Utiliza un sistema de puntuación de 1 a 5 estrellas.
- El usuario debe poder seleccionar visualmente la puntuación.
- La valoración debe guardarse en la base de datos.
- Cada usuario solo puede tener una valoración activa por vídeo.
- Si un usuario vuelve a valorar el mismo vídeo, debe actualizarse su valoración anterior en lugar de crear una nueva.
- Los usuarios no autenticados no pueden enviar valoraciones.

## 3. Mostrar la valoración media

Cada vídeo debe mostrar su valoración media.

Debe incluir:

- La puntuación media del vídeo.
- La representación visual mediante estrellas.
- El número total de valoraciones recibidas.

Ejemplo visual:

★★★★★ 4.5/5 (25 ratings)

La puntuación media debe calcularse utilizando las valoraciones reales almacenadas en la base de datos.

Si un vídeo todavía no tiene valoraciones, debe mostrarse un mensaje apropiado, como:

"No ratings yet".

No muestres puntuaciones ficticias.

## 4. Backend y base de datos

Analiza los modelos y relaciones existentes antes de implementar cambios.

Si es necesario:

- Crea un modelo o entidad para almacenar las valoraciones.
- Relaciona cada valoración con un vídeo y con el usuario que la ha realizado.
- Guarda la puntuación y los datos necesarios.
- Implementa los endpoints necesarios para crear, actualizar y consultar valoraciones.
- Calcula la media de las puntuaciones.
- Calcula el número total de valoraciones.

IMPORTANTE:

Implementa una restricción que impida que un mismo usuario tenga más de una valoración para el mismo vídeo.

Utiliza las relaciones y convenciones existentes en el proyecto. No modifiques innecesariamente la estructura de la base de datos.

## 5. Frontend e interfaz de usuario

Implementa una interfaz intuitiva y coherente con el diseño actual de la aplicación.

Debe incluir:

- Un selector de 1 a 5 estrellas para valorar los vídeos.
- Una indicación visual de la puntuación seleccionada.
- La posibilidad de modificar una valoración existente.
- La visualización de la media de valoraciones de cada vídeo.
- El número total de usuarios que han valorado el vídeo.

Comportamiento esperado:

- Al pasar el ratón por encima de las estrellas, deben proporcionar feedback visual si el diseño actual lo permite.
- Al seleccionar una estrella, debe enviarse la valoración.
- Debe mostrarse un feedback cuando la valoración se guarde correctamente.
- Si se produce un error, debe mostrarse un mensaje comprensible.
- La interfaz debe ser responsive.

Reutiliza los componentes y estilos existentes. No introduzcas librerías adicionales si no son necesarias.

## 6. Seguridad

Es fundamental garantizar que:

- Solo los usuarios autenticados pueden crear valoraciones.
- El usuario se obtiene de la sesión o del sistema de autenticación existente.
- No se puede enviar una valoración en nombre de otro usuario.
- Un usuario no puede crear múltiples valoraciones para el mismo vídeo.
- Los datos de las valoraciones se validan en el backend.
- Se respetan las reglas de autorización existentes.

No confíes únicamente en las validaciones del frontend.

## 7. Testing

Implementa o actualiza los tests necesarios para comprobar estos escenarios:

**Caso 1: Usuario autenticado valora un vídeo**
- Selecciona una puntuación entre 1 y 5.
- La valoración se guarda correctamente.
- Se actualizan la media y el número de valoraciones.

**Caso 2: Usuario modifica su valoración**
- Vuelve a valorar el mismo vídeo.
- Se actualiza la valoración anterior.
- No se crea una valoración duplicada.

**Caso 3: Usuario no autenticado**
- No puede enviar una valoración.
- El backend devuelve el error de autorización correspondiente.

**Caso 4: Vídeo sin valoraciones**
- Se muestra un estado vacío.
- No se producen errores.
- No se muestra una media ficticia.

**Caso 5: Varios usuarios valoran el mismo vídeo**
- Se guardan correctamente las valoraciones de distintos usuarios.
- La media se calcula correctamente.
- El número total de valoraciones es correcto.

**Caso 6: Valoraciones no válidas**
- No se permiten puntuaciones inferiores a 1 ni superiores a 5.
- Se rechazan valores incorrectos o manipulados.

Ejecuta los tests existentes y añade los necesarios.

# REGLAS IMPORTANTES

1. No rompas ninguna funcionalidad existente.
2. No elimines código que no esté relacionado con esta funcionalidad.
3. No cambies la arquitectura del proyecto sin justificación.
4. No utilices datos mock o hardcodeados.
5. No inventes endpoints ni relaciones sin analizar primero el proyecto.
6. Sigue las convenciones de código existentes.
7. Implementa tanto frontend como backend cuando sea necesario.
8. Asegúrate de que las valoraciones persisten en la base de datos.
9. Comprueba que la media se actualiza correctamente cuando se crea o modifica una valoración.

# RESULTADO FINAL

Cuando termines:

1. Resume qué has implementado.
2. Indica todos los archivos creados y modificados.
3. Explica cómo funciona el sistema de valoraciones.
4. Explica cómo calculas la media.
5. Explica cómo evitas las valoraciones duplicadas.
6. Indica los endpoints implementados.
7. Indica qué tests has ejecutado y sus resultados.
8. Explica si hay algún paso manual pendiente.

**IMPORTANTE: No quiero únicamente una explicación ni una propuesta. Quiero que analices mi proyecto e implementes directamente la funcionalidad completa de Video Ratings en el código existente.**
```

## Notes

* There was no rating, like or score of videos in the project; comments have a `likeCount` (US-10 is comment likes).
  Ratings need one new table, `video_ratings`, with a unique `(user_id, video_id)` pair, following the pattern of
  `favourites` in `feature/favourite-videos`.
* The average and the picker are on the video detail page. The video cards of the home grid do not show it yet: that
  would add the average to `VideoSummaryResponse` with one grouped query per page.
* The score is read as a decimal so 4.5 is rejected (Jackson would silently truncate it to 4 into an `int`).
* There is no "remove my rating" action: it was not asked for.
* `ClockConfig` is the same file as in `task/11-video-analytics`, so both branches merge without conflicts there.
* Number 14 because 12 is used by `task/11-video-analytics` and 13 by `feature/favourite-videos`.
