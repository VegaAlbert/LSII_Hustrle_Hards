import { defineMessages } from '../defineMessages';

// Texts shared by several pages and generic API errors
export const common = defineMessages(
  {
    loading: 'Loading…',
    retry: 'Try again',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    justNow: 'just now',
    connectionError: 'Could not connect to the server. Please try again later.',
    unexpectedError: 'Unexpected error. Please try again.',
  },
  {
    es: {
      loading: 'Cargando…',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      save: 'Guardar',
      close: 'Cerrar',
      justNow: 'justo ahora',
      connectionError: 'No se ha podido conectar con el servidor. Inténtalo de nuevo más tarde.',
      unexpectedError: 'Error inesperado. Inténtalo de nuevo.',
    },
    ca: {
      loading: 'Carregant…',
      retry: 'Torna-ho a provar',
      cancel: 'Cancel·la',
      save: 'Desa',
      close: 'Tanca',
      justNow: 'ara mateix',
      connectionError: "No s'ha pogut connectar amb el servidor. Torna-ho a provar més tard.",
      unexpectedError: 'Error inesperat. Torna-ho a provar.',
    },
  }
);
