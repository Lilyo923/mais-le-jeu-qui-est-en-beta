// Disparaît après 8 secondes (temps de la vidéo) :
setTimeout(() => {
  document.getElementById('intro-screen').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
}, 8000);

// Gestion des sous-menus
const menu = document.getElementById('menu');
const optionsMenu = document.getElementById('options-menu');
const creditsMenu = document.getElementById('credits-menu');

document.getElementById('options').addEventListener('click', () => {
  menu.classList.add('hidden');
  optionsMenu.classList.remove('hidden');
});

document.getElementById('credits').addEventListener('click', () => {
  menu.classList.add('hidden');
  creditsMenu.classList.remove('hidden');
});

document.getElementById('back-options').addEventListener('click', () => {
  optionsMenu.classList.add('hidden');
  menu.classList.remove('hidden');
});

document.getElementById('back-credits').addEventListener('click', () => {
  creditsMenu.classList.add('hidden');
  menu.classList.remove('hidden');
});

// Sauvegarde des options
const difficultySelect = document.getElementById('difficulty');
const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');

[difficultySelect, musicToggle, sfxToggle].forEach(el => {
  el.addEventListener('change', saveSettings);
});

function saveSettings() {
  const settings = {
    difficulty: difficultySelect.value,
    music: musicToggle.checked,
    sfx: sfxToggle.checked
  };
  localStorage.setItem('gameSettings', JSON.stringify(settings));
}

// Charger les options si présentes
window.addEventListener('load', () => {
  const saved = localStorage.getItem('gameSettings');
  if (saved) {
    const { difficulty, music, sfx } = JSON.parse(saved);
    difficultySelect.value = difficulty;
    musicToggle.checked = music;
    sfxToggle.checked = sfx;
    document.getElementById('continue').classList.remove('disabled');
  }
});
