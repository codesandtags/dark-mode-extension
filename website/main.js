import "./style.css";
import appLogo from "/logo.png";

document.querySelector("#app").innerHTML = `
  <div>
    <a href="https://github.com/codesandtags/dark-mode-extension" target="_blank">
      <img src="${appLogo}" class="logo" alt="Vite logo" />
    </a>
    <h1>Dark Mode Enabler!</h1>
    <p class="read-the-docs">
      👋 Click on the logo to learn more.
    </p>
  </div>
`;

setupCounter(document.querySelector("#counter"));
