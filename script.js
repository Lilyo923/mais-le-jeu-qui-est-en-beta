window.addEventListener("load", () => {
  const intro = document.getElementById("intro");
  const logoText = document.getElementById("logo-text");
  const menu = document.getElementById("menu");

  // --- Étape 1 : afficher IMAGINe Studio
  setTimeout(() => {
    logoText.textContent = "IMAGINe Studio";
    logoText.style.opacity = 1;
  }, 500);

  // --- Étape 2 : faire disparaître le premier logo
  setTimeout(() => {
    logoText.classList.add("fade-out");
  }, 2500);

  // --- Étape 3 : afficher Engine HwR
  setTimeout(() => {
    logoText.classList.remove("fade-out");
    logoText.style.opacity = 1;
    logoText.textContent = "Engine HwR";
  }, 3500);

  // --- Étape 4 : extinction CRT + affichage du menu
  setTimeout(() => {
    intro.classList.add("crt-off");
  }, 5500);

  setTimeout(() => {
    intro.classList.add("hidden");
    menu.classList.remove("hidden");
  }, 6500);
});
