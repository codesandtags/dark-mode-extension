import "./style.css";
import appLogo from "/logo.png";

document.querySelector("#app").innerHTML = `
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
        <img src="${appLogo}" class="logo" alt="Vite logo" />
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
`;

setupCounter(document.querySelector("#counter"));

// Dark-mode preview when hovering or focusing the feature phrase
;(function () {
  const app = document.querySelector('#app');
  const feature = app && app.querySelector('.feature');
  if (!app || !feature) return;

  const add = () => app.classList.add('dark-preview');
  const remove = () => app.classList.remove('dark-preview');

  feature.addEventListener('mouseenter', add);
  feature.addEventListener('mouseleave', remove);
  feature.addEventListener('focus', add);
  feature.addEventListener('blur', remove);
  feature.addEventListener('touchstart', add, {passive: true});
  feature.addEventListener('touchend', remove, {passive: true});
})();
