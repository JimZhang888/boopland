/* Shared language settings for the welcome page, lobby, and every game.
   Plain script, relative URLs, and no fetch: also works when opened with file://. */
(() => {
  'use strict';
  if (window.BooplandI18n) return;
  const key = 'boopland-language';
  const fallback = 'en';
  const languages = Object.freeze([
    { code: 'zh-CN', name: '简体中文' }, { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' },
    { code: 'fr', name: 'Français' }, { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' }, { code: 'pt-BR', name: 'Português' }
  ].map(Object.freeze));
  const valid = value => languages.some(item => item.code === value);
  function systemLanguage() {
    const preferred = typeof navigator === 'undefined' ? '' : navigator.language || navigator.languages?.[0] || '';
    const base = preferred.toLowerCase().split(/[-_]/)[0];
    return languages.find(item => item.code.toLowerCase().split('-')[0] === base)?.code || fallback;
  }
  const read = () => { try { return localStorage.getItem(key); } catch { return null; } };
  const save = value => { try { localStorage.setItem(key, value); } catch { /* URL propagation remains available. */ } };
  const siteRoot = new URL('./', document.currentScript.src);
  const catalogues = Object.create(null);
  const requested = new URL(location.href).searchParams.get('lang');
  const saved = read();
  let language = valid(requested) ? requested : valid(saved) ? saved : systemLanguage();

  catalogues.common = {
    'zh-CN': { language: '选择语言', back: '返回大厅', home: '回到首页 ↗' },
    en: { language: 'Choose language', back: 'Back to the lobby', home: 'Back home ↗' },
    ja: { language: '言語を選択', back: 'ロビーに戻る', home: 'ホームへ ↗' },
    ko: { language: '언어 선택', back: '로비로 돌아가기', home: '홈으로 ↗' },
    fr: { language: 'Choisir la langue', back: 'Retour aux jeux', home: 'Accueil ↗' },
    de: { language: 'Sprache auswählen', back: 'Zurück zur Spielewelt', home: 'Zur Startseite ↗' },
    es: { language: 'Elegir idioma', back: 'Volver a los juegos', home: 'Inicio ↗' },
    'pt-BR': { language: 'Escolher idioma', back: 'Voltar aos jogos', home: 'Início ↗' }
  };

  function t(messageKey, values = {}) {
    const dot = messageKey.indexOf('.');
    const scope = dot < 0 ? document.documentElement.dataset.i18nScope : messageKey.slice(0, dot);
    const name = dot < 0 ? messageKey : messageKey.slice(dot + 1);
    const catalogue = catalogues[scope];
    const message = catalogue?.[language]?.[name] ?? catalogue?.[fallback]?.[name] ?? catalogue?.['zh-CN']?.[name];
    if (typeof message !== 'string') return messageKey;
    return message.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
  }

  function withLanguage(value) {
    try {
      const url = new URL(value, location.href);
      if (!['http:', 'https:', 'file:'].includes(url.protocol) || url.protocol !== siteRoot.protocol || url.host !== siteRoot.host || !url.pathname.startsWith(siteRoot.pathname)) return value;
      if (!/\.html?$/i.test(url.pathname) && !url.pathname.endsWith('/')) return value;
      url.searchParams.set('lang', language);
      return url.href;
    } catch { return value; }
  }

  function localizeLink(link) {
    const raw = link.getAttribute('href');
    if (!raw || raw.startsWith('#') || link.hasAttribute('download') || link.hasAttribute('data-no-lang')) return;
    const next = withLanguage(raw);
    if (next !== link.href) link.setAttribute('href', next);
  }

  function apply(container = document) {
    const bindings = { 'data-i18n': null, 'data-i18n-placeholder': 'placeholder', 'data-i18n-label': 'aria-label', 'data-i18n-title': 'title', 'data-i18n-content': 'content' };
    for (const [binding, attribute] of Object.entries(bindings)) {
      const nodes = [...container.querySelectorAll(`[${binding}]`)];
      if (container.matches?.(`[${binding}]`)) nodes.unshift(container);
      for (const node of nodes) {
        const messageKey = node.getAttribute(binding);
        const text = t(messageKey);
        if (text === messageKey) continue; // A page may register its dictionary after this script.
        if (attribute) node.setAttribute(attribute, text);
        else node.textContent = text;
      }
    }
    container.querySelectorAll('a[href]').forEach(localizeLink);
  }

  function updatePage() {
    document.documentElement.lang = language;
    // Explicit URL state carries the setting between local HTML files even when
    // the browser isolates file:// storage or the visitor blocks localStorage.
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('lang') !== language) {
        url.searchParams.set('lang', language);
        history.replaceState(history.state, '', url.href);
      }
    } catch { /* Some file:// browsers disallow history replacement. */ }
    apply();
  }

  function setLanguage(next, persist = true) {
    if (!valid(next)) return false;
    const changed = next !== language;
    language = next;
    if (persist) save(language);
    updatePage();
    if (changed) window.dispatchEvent(new CustomEvent('boopland:languagechange', { detail: { language } }));
    return true;
  }

  window.BooplandI18n = Object.freeze({
    get language() { return language; }, languages, t, apply, withLanguage, setLanguage,
    register(scope, messages) {
      catalogues[scope] = { ...catalogues[scope], ...messages };
      apply();
    }
  });
  // Only an explicit choice is saved; automatic detection stays a default.
  updatePage();
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    // Dynamic cards inherit the setting; no game state is reset or reloaded.
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches('a[href]')) localizeLink(node);
        node.querySelectorAll('a[href]').forEach(localizeLink);
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) setLanguage(valid(event.newValue) ? event.newValue : systemLanguage(), false);
  });
  window.addEventListener('pageshow', event => {
    const latest = read();
    if (event.persisted && valid(latest)) setLanguage(latest, false);
    else updatePage();
  });
})();
