// Intro : afficher successivement IMAGINe Studio puis Engine HwR
window.addEventListener("load", () => {
  const logo1 = document.getElementById("logo1");
  const logo2 = document.getElementById("logo2");
  const intro = document.getElementById("intro");
  const menu = document.getElementById("menu");

  // Affiche le premier logo
  setTimeout(() => {
    logo1.style.opacity = 1;
  }, 500);

  // Puis transition vers le deuxième logo
  setTimeout(() => {
    logo1.style.opacity = 0;
    logo2.classList.remove("hidden");
    logo2.style.opacity = 1;
  }, 2500);

  // Puis disparition de l’intro et apparition du menu
  setTimeout(() => {
    intro.classList.add("hidden");
    menu.classList.remove("hidden");
  }, 4500);
});
