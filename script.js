window.addEventListener("load", () => {
  const intro = document.getElementById("intro");
  const logoText = document.getElementById("logo-text");
  const menu = document.getElementById("menu");

  // --- Étape 1 : IMAGINe Studio
  setTimeout(() => {
    logoText.textContent = "IMAGINe Studio";
    logoText.style.opacity = 1;
  }, 500);

  // --- Étape 2 : disparition du premier logo
  setTimeout(() => {
    logoText.classList.add("fade-out");
  }, 2500);

  // --- Étape 3 : Engine HwR
  setTimeout(() => {
    logoText.classList.remove("fade-out");
    logoText.style.opacity = 1;
    logoText.textContent = "Engine HwR";
  }, 3500);

  // --- Étape 4 : extinction CRT
  setTimeout(() => {
    // On stoppe le scintillement pour ne pas bloquer l'animation
    intro.style.animation = "none";
    intro.classList.add("crt-off");
  }, 5500);

  // --- Étape 5 : cacher l’intro et afficher le menu
  setTimeout(() => {
    intro.style.display = "none";
    menu.classList.remove("hidden");
  }, 6800); // délai légèrement plus long pour que le CRT off se termine
});
