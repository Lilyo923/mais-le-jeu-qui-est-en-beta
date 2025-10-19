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
// --- Gestion des sous-menus ---
const optionsMenu = document.getElementById("options-menu");
const creditsMenu = document.getElementById("credits-menu");
const optionsBtn = document.getElementById("options-btn");
const creditsBtn = document.getElementById("credits-btn");
const backBtns = document.querySelectorAll(".back-btn");
const toggleSoundBtn = document.getElementById("toggle-sound");

let soundEnabled = true;

// Ouvrir Options
optionsBtn.addEventListener("click", () => {
  optionsMenu.classList.remove("hidden");
});

// Ouvrir Crédits
creditsBtn.addEventListener("click", () => {
  creditsMenu.classList.remove("hidden");
});

// Bouton Retour (ferme les fenêtres)
backBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    optionsMenu.classList.add("hidden");
    creditsMenu.classList.add("hidden");
  });
});

// Bouton Son ON/OFF
toggleSoundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  toggleSoundBtn.textContent = soundEnabled ? "ON" : "OFF";
});
