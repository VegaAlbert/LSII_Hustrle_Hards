import { defineMessages } from '../defineMessages';
import { MESSAGES } from '../messages';
import { translate } from '../translate';

describe('translate', () => {
  it('returns the text of a key in each language', () => {
    expect(translate('en', 'nav.login')).toBe('Log in');
    expect(translate('es', 'nav.login')).toBe('Iniciar sesión');
    expect(translate('ca', 'nav.login')).toBe('Inicia la sessió');
  });

  it('replaces placeholders with their values', () => {
    expect(translate('ca', 'nav.userMenu', { username: 'anna' })).toBe("Menú d'usuari de anna");
  });

  it('formats numbers in placeholders for the language', () => {
    expect(translate('en', 'nav.userMenu', { username: 1234 })).toBe('User menu for 1,234');
    expect(translate('es', 'nav.userMenu', { username: 12345 })).toBe('Menú de usuario de 12.345');
  });

  it('keeps a placeholder without value as it is', () => {
    expect(translate('en', 'nav.userMenu')).toBe('User menu for {username}');
  });

  it('defines every group in every language with the same keys', () => {
    for (const group of Object.values(MESSAGES)) {
      const english = Object.keys(group.en).sort();
      expect(Object.keys(group.es).sort()).toEqual(english);
      expect(Object.keys(group.ca).sort()).toEqual(english);
    }
  });

  it('fills every text in every language', () => {
    for (const group of Object.values(MESSAGES)) {
      for (const messages of [group.en, group.es, group.ca]) {
        for (const message of Object.values(messages)) {
          const forms = typeof message === 'string' ? [message] : [message.one, message.other];
          forms.forEach((form) => expect(form.trim()).not.toBe(''));
        }
      }
    }
  });
});

describe('defineMessages', () => {
  it('keeps English as given next to the translations', () => {
    const group = defineMessages({ hello: 'Hello' }, { es: { hello: 'Hola' }, ca: { hello: 'Hola' } });

    expect(group).toEqual({ en: { hello: 'Hello' }, es: { hello: 'Hola' }, ca: { hello: 'Hola' } });
  });
});
