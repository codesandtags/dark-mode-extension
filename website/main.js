import "./style.css";
import appLogo from "/logo.png";

document.querySelector("#app").innerHTML = `
  <div>
    <header>
      <h1>Dark Mode Enabler!</h1>
    </header>
    <p class="read-the-docs">
      <a href="https://github.com/codesandtags/dark-mode-extension" target="_blank">
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
