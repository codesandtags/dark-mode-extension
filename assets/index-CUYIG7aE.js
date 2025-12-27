(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const n of t.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function s(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function a(e){if(e.ep)return;e.ep=!0;const t=s(e);fetch(e.href,t)}})();const i="/dark-mode-extension/logo.png";document.querySelector("#app").innerHTML=`
  <div class="container">
    <header>
      <h1>Dark Mode Enabler!</h1>
    </header>
    <p>
      <span tabindex="0">Enables dark mode</span> and filters on all websites that don’t support it natively.
      <a href="https://chromewebstore.google.com/detail/dark-mode-enabler/jpgjmidladomebfdpanhbeodbmkibdcp?pli=1" target="_blank" class="feature">Join over 500</a> users who already enjoy a more comfortable browsing experience.
    </p>
    <p class="read-the-docs">
      <a href="https://chromewebstore.google.com/detail/dark-mode-enabler/jpgjmidladomebfdpanhbeodbmkibdcp?pli=1" target="_blank">
        <img src="${i}" class="logo" alt="Vite logo" />
      </a>
      💡 Click on the logo to learn more.
    </p>
    <iframe
      width="1000px"
      height="400px"
      src="https://www.youtube.com/embed/Y_eHLaOQImE?si=3irs46eRKzwQzrLz"
      title="Dark Mode Enabler example"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen>
    </iframe>
  </div>
`;setupCounter(document.querySelector("#counter"));(function(){const o=document.querySelector("#app"),r=o&&o.querySelector(".feature");if(!o||!r)return;const s=()=>o.classList.add("dark-preview"),a=()=>o.classList.remove("dark-preview");r.addEventListener("mouseenter",s),r.addEventListener("mouseleave",a),r.addEventListener("focus",s),r.addEventListener("blur",a),r.addEventListener("touchstart",s,{passive:!0}),r.addEventListener("touchend",a,{passive:!0})})();
