(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function s(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function n(e){if(e.ep)return;e.ep=!0;const t=s(e);fetch(e.href,t)}})();const i="/dark-mode-extension/logo.png";document.querySelector("#app").innerHTML=`
  <div>
    <a href="https://github.com/codesandtags/dark-mode-extension" target="_blank">
      <img src="${i}" class="logo" alt="Vite logo" />
    </a>
    <h1>Dark Mode Enabler!</h1>
    <p class="read-the-docs">
      👋 Click on the logo to learn more.
    </p>
  </div>
`;setupCounter(document.querySelector("#counter"));
