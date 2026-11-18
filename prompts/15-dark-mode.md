# Dark mode

**Approved on:** PENDING — proposed in the PR of branch `feature/dark-mode`
**Approved by:** PENDING team review
**Used for:** implementing the "Dark mode" extra feature of `README.md`: Light / Dark / System theme preference,
applied to the whole app, saved on the device, following the operating system and without a flash on load

## Prompt

The prompt was written in Spanish and is kept verbatim below (NFR-07 asks to preserve the exact prompt). Summary in
English: act as a senior full-stack developer and implement dark mode in the existing project; first analyse the
styling system and any existing theme or preference system and extend it instead of creating a new one; a real theme
(no colour-inverting filter) covering backgrounds, text, cards, forms, buttons, navigation, menus, modals, borders,
shadows and hover/focus/active/disabled states with enough contrast; an accessible Light / Dark / System selector;
persist the choice (localStorage is fine, no backend needed), System as the default, follow system changes live; no
flash of the wrong theme on load, smooth transitions that respect `prefers-reduced-motion`, keyboard accessible,
recognisable sun/moon icons, responsive; tests for the six scenarios (dark, light, system, first visit, navigation,
responsive); finally report the work, files, how the theme system, persistence and system detection work, the pages
adapted, the tests and any manual step. The work was done on the branch `feature/dark-mode`, created from an
up-to-date `develop`, following `AGENTS.md` and `frontend/AGENTS.md`.

```text
Actúa como un desarrollador Full Stack Senior experto. Necesito que implementes la funcionalidad **Product: Dark Mode** en mi proyecto existente.

# PRODUCT: DARK MODE

## Descripción

Add a dark theme the user can switch to (and/or follow the system preference).

## Objetivo

Implementar un tema oscuro (Dark Mode) para toda la aplicación, permitiendo que los usuarios puedan cambiar entre modo claro y oscuro manualmente o configurar la aplicación para que siga automáticamente la preferencia de apariencia de su sistema operativo.

# INSTRUCCIONES DE IMPLEMENTACIÓN

## 1. Analiza primero el proyecto

Antes de empezar a modificar archivos:

- Analiza la arquitectura y estructura del proyecto.
- Identifica las tecnologías utilizadas en frontend y backend.
- Revisa el sistema de estilos actual (CSS, SCSS, Tailwind, Material UI, etc.).
- Identifica si ya existe algún sistema de temas o variables de colores.
- Comprueba cómo se gestionan las preferencias del usuario.
- Revisa los componentes principales y las páginas existentes.

No crees un sistema nuevo si ya existe una solución que puedas ampliar.

## 2. Implementar Dark Mode

Añade un tema oscuro que afecte a toda la aplicación.

Debe incluir:

- Fondo general oscuro.
- Colores adecuados para textos principales y secundarios.
- Tarjetas y contenedores adaptados al tema oscuro.
- Formularios e inputs adaptados.
- Botones y elementos interactivos adaptados.
- Menús de navegación y barras laterales adaptados.
- Modales, dropdowns y ventanas emergentes adaptados.
- Bordes, separadores y sombras adaptados.
- Estados hover, focus, active y disabled adaptados.

El contraste debe ser suficiente para garantizar una buena legibilidad y accesibilidad.

No utilices simplemente un filtro que invierta los colores de toda la página. Implementa un sistema de temas real.

## 3. Selector de tema

Añade un selector accesible para que el usuario pueda elegir su preferencia.

Debe ofrecer tres opciones:

- Light: siempre utilizar el tema claro.
- Dark: siempre utilizar el tema oscuro.
- System: utilizar automáticamente la preferencia del sistema operativo.

Puedes utilizar un menú desplegable, un selector en Settings o un botón con iconos de sol y luna, según el diseño actual de la aplicación.

El usuario debe poder cambiar de tema fácilmente.

## 4. Preferencias y persistencia

La selección del usuario debe mantenerse cuando navegue por la aplicación o vuelva a abrirla.

Comportamiento esperado:

**Light**
- La aplicación siempre utiliza el tema claro, independientemente del sistema operativo.

**Dark**
- La aplicación siempre utiliza el tema oscuro, independientemente del sistema operativo.

**System**
- La aplicación detecta automáticamente la preferencia del sistema operativo.
- Si el sistema cambia de claro a oscuro, la aplicación debe actualizarse automáticamente cuando sea posible.

Utiliza el mecanismo de persistencia más apropiado para la arquitectura existente, por ejemplo localStorage si es una aplicación web.

Si el proyecto ya dispone de un sistema de preferencias de usuario, reutilízalo.

No es necesario modificar el backend si la persistencia local existente es suficiente y coherente con el proyecto.

## 5. Integración en toda la aplicación

Comprueba que el tema funciona correctamente en todas las secciones existentes.

Revisa especialmente:

- Página principal.
- Login y registro.
- Perfil de usuario.
- Páginas de vídeos.
- Reproductor de vídeos.
- Comentarios.
- Likes y valoraciones.
- Analytics.
- Formularios.
- Navegación.
- Configuración.
- Modales y notificaciones.

Todas las páginas deben mantener una apariencia coherente.

Si alguna sección utiliza componentes de terceros, comprueba que también se adapten al tema seleccionado.

## 6. Experiencia de usuario

- El cambio de tema debe ser inmediato.
- Evita parpadeos innecesarios al cargar la aplicación.
- Evita que la página aparezca brevemente en modo claro cuando el usuario tiene seleccionado Dark.
- Si implementas transiciones, deben ser suaves y no molestas.
- Respeta la preferencia de accesibilidad `prefers-reduced-motion`.
- El selector debe ser accesible mediante teclado.
- Utiliza iconos reconocibles para Light y Dark.
- Mantén el diseño responsive.

## 7. Testing

Comprueba los siguientes escenarios:

**Caso 1: Seleccionar modo oscuro**
- El usuario selecciona Dark.
- Toda la aplicación cambia al tema oscuro.
- La preferencia se mantiene al navegar entre páginas.
- La preferencia se mantiene al recargar la página.

**Caso 2: Seleccionar modo claro**
- El usuario selecciona Light.
- Toda la aplicación cambia al tema claro.
- La preferencia se mantiene aunque el sistema operativo tenga activado el modo oscuro.

**Caso 3: Seleccionar System**
- La aplicación detecta la preferencia del sistema operativo.
- Si el sistema utiliza Dark, la aplicación muestra Dark.
- Si el sistema utiliza Light, la aplicación muestra Light.
- Si cambia la preferencia del sistema, la aplicación se actualiza automáticamente.

**Caso 4: Primera visita**
- Si no existe una preferencia guardada, se utiliza System como valor predeterminado.
- La aplicación carga el tema correspondiente sin errores.

**Caso 5: Navegación**
- El tema seleccionado se mantiene en todas las páginas.
- No aparecen componentes con colores incompatibles.

**Caso 6: Responsive**
- El selector funciona correctamente en dispositivos móviles y escritorio.

Ejecuta los tests existentes y añade los necesarios.

# REGLAS IMPORTANTES

1. No rompas ninguna funcionalidad existente.
2. No elimines código que no esté relacionado con esta funcionalidad.
3. No cambies la arquitectura sin una razón justificada.
4. No dupliques sistemas de estilos o temas.
5. Reutiliza los componentes existentes.
6. No utilices filtros CSS para invertir todos los colores.
7. Evita introducir dependencias innecesarias.
8. Mantén la coherencia visual de toda la aplicación.
9. Implementa la funcionalidad directamente en el código existente.

# RESULTADO FINAL

Cuando termines:

1. Resume qué has implementado.
2. Indica todos los archivos creados y modificados.
3. Explica cómo funciona el sistema de temas.
4. Explica cómo se guarda la preferencia del usuario.
5. Indica cómo funciona la detección automática del tema del sistema.
6. Indica qué páginas y componentes has adaptado.
7. Indica qué tests has ejecutado y sus resultados.
8. Explica si hay algún paso manual pendiente.

**IMPORTANTE: No quiero únicamente una explicación o una propuesta. Quiero que analices mi proyecto e implementes directamente Dark Mode en toda la aplicación, respetando la arquitectura y el diseño existentes.**
```

## Notes

* The project already had the theme system: `--pt-*` tokens in `theme.css` (dark on `:root`, light under
  `[data-bs-theme='light']`, wired to Bootstrap's variables) and a Light / Dark / System control in Settings that was
  not applied. The work wires it up instead of creating anything new: `ThemeProvider` + `useTheme()` (same pattern as
  `AuthProvider`), a sun/moon menu in the navbar and an inline script in `index.html` against the flash on load.
* Components already used the tokens, so no page stylesheet needed changes. The light variant now also darkens
  `--pt-success` and `--pt-info` (used as text, e.g. hashtags) to reach 4.5:1 on white.
* `--pt-primary` (#E63946) on white is about 4.2:1, slightly under 4.5:1 for small link text; changing the brand red
  is a design-system decision left to the team.
* The preference is per device (localStorage `protube.theme`), not per account; the other Settings are still not
  applied.
* Number 15 because 12–14 are used by the open analytics, favourites and ratings branches.
