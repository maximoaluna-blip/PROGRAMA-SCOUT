// Base común de las pruebas: salta la bienvenida y silencia el sonido
// guardando el progreso en localStorage antes de cargar cada página.
const base = require('@playwright/test');

const test = base.test.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        // Solo si no existe: así una recarga no borra el avance de la prueba.
        if (localStorage.getItem('ps-progreso-v1') === null) {
          localStorage.setItem('ps-progreso-v1', JSON.stringify({ bienvenida: true, sonido: false }));
        }
      } catch (e) { /* sin almacenamiento */ }
    });
    await use(page);
  },
});

module.exports = { test, expect: base.expect };
