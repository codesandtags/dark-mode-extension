(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function s(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=s(e);fetch(e.href,r)}})();const c="/dark-mode-extension/logo.png";document.querySelector("#app").innerHTML=`
  <div>
    <header>
      <h1>Dark Mode Enabler!</h1>
    </header>
    <p class="read-the-docs">
      <a href="https://github.com/codesandtags/dark-mode-extension" target="_blank">
        <img src="${c}" class="logo" alt="Vite logo" />
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
`;setupCounter(document.querySelector("#counter"));
