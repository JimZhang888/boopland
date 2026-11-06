/* Shared Vercel Web Analytics loader for this static site.
   Enable Web Analytics in Vercel, then deploy to activate the endpoint. */
(() => {
  'use strict';

  const { protocol, hostname } = window.location;
  if (!['http:', 'https:'].includes(protocol)
    || hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || /^127\./.test(hostname)
    || hostname === '[::1]') return;

  // Vercel serves this endpoint at the domain root, including for game pages.
  const src = '/_vercel/insights/script.js';
  if (document.querySelector(`script[src="${src}"]`)) return;

  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  document.head.appendChild(script);
})();
