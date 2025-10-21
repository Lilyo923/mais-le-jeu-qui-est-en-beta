/* ===========================
   Brad Bitt — Alpha 2.0
   Scènes: Preload → Intro → Menu
   Couleurs: Cyan #32C0C1 / Rose #F53098
   =========================== */

const COLORS = { cyan: '#32C0C1', pink: '#F53098', white: '#FFFFFF', grey: '#888888', gold: '#FFD700' };
const SAVE_KEY = 'bradBittSave';
const SETTINGS_KEY = 'gameSettings';

// Valeurs par défaut des options (persistantes)
function getSettings(){
  const saved = localStorage.getItem(SETTINGS_KEY);
  if(saved){ try { return JSON.parse(saved); } catch(e){} }
  const defaults = { difficulty: 'Normal', music: true, sfx: true };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults));
  return defaults;
}
function setSettings(next){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); }

/* ---------- PRELOAD SCENE ---------- */
class PreloadScene extends Phaser.Scene {
  constructor(){ super('PreloadScene'); }
  preload(){
    // Texte "Chargement..." animé en bas à droite
    const t = this.add.text(790, 585, 'Chargement', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'10px', color: COLORS.white
    }).setOrigin(1,1);
    let dots = 0;
    this.time.addEvent({
      delay: 350, loop: true,
      callback: ()=>{ dots=(dots+1)%4; t.setText('Chargement' + '.'.repeat(dots)); }
    });

    // Pré-charger les sons (remplace-les par tes propres fichiers si tu veux)
    this.load.audio('click',    'assets/sounds/click.wav');
    this.load.audio('open',     'assets/sounds/open.wav');
    this.load.audio('poweroff', 'assets/sounds/poweroff.wav');

    // Quand tout est chargé → Intro
    this.load.once('complete', ()=>{
      // Petite latence pour laisser le temps au dernier frame "Chargement..."
      this.time.delayedCall(200, ()=> this.scene.start('IntroScene'));
    });
  }
}

/* ---------- INTRO SCENE ---------- */
class IntroScene extends Phaser.Scene {
  constructor(){ super('IntroScene'); }

  create(){
    // Fond transparent → on voit le gradient CSS (on garde la cohérence visuelle)
    const settings = getSettings();

    // Enchaîne IMAGINe Studio puis Engine HwR
    this._playStudioLogo('IMAGINe', 'Studio', COLORS.cyan, COLORS.pink, settings, () => {
      this._playStudioLogo('Engine', 'HwR', COLORS.pink, COLORS.cyan, settings, () => {
        // Transition vers le menu
        this.cameras.main.fadeOut(400, 0,0,0);
        this.cameras.main.once('camerafadeoutcomplete', ()=> {
          this.scene.start('MenuScene');
        });
      });
    });
  }

  _playStudioLogo(leftWord, rightWord, leftColor, rightColor, settings, onComplete){
    const cx = 400, cy = 300;

    // Deux morceaux de texte pour gérer les couleurs séparées
    const left = this.add.text(cx, cy, leftWord, {
      fontFamily:'"Press Start 2P", monospace', fontSize:'26px', color:leftColor
    }).setOrigin(1,0.5).setAlpha(0);
    left.setShadow(0,0,leftColor,12,false,true);

    const right = this.add.text(cx, cy, rightWord, {
      fontFamily:'"Press Start 2P", monospace', fontSize:'26px', color:rightColor
    }).setOrigin(0,0.5).setAlpha(0);
    right.setShadow(0,0,rightColor,12,false,true);

    // Son d'ouverture (clic lumière)
    if(settings.sfx) this.sound.play('open', { volume: 0.8 });

    // Apparition + léger zoom "old school"
    left.setScale(0.92); right.setScale(0.92);
    this.tweens.add({ targets:[left,right], alpha:1, duration:280, ease:'sine.out' });
    this.tweens.add({ targets:[left,right], scale:1.0, duration:480, ease:'sine.out' });

    // Attends un peu, puis power-off
    this.time.delayedCall(1100, ()=>{
      // Son d'extinction
      if(getSettings().sfx) this.sound.play('poweroff', { volume: 0.9 });

      // Effet "extinction CRT": écrase verticalement puis disparaît
      this.tweens.add({
        targets:[left,right],
        scaleY: 0.06,
        alpha: 0.8,
        duration: 260,
        ease: 'quad.in',
        onComplete: ()=>{
          left.destroy(); right.destroy();
          // Petite pause avant le studio suivant
          this.time.delayedCall(200, onComplete);
        }
      });
    });
  }
}

/* ---------- MENU SCENE ---------- */
class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }

  create(){
    const settings = getSettings();
    const sfx = (key,opts)=>{ if(getSettings().sfx) this.sound.play(key, opts); };

    // Titre
    const title = this.add.text(400, 110, 'BRAD BITT', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'36px', color: COLORS.gold
    }).setOrigin(0.5);
    title.setShadow(0,0,COLORS.gold,12,false,true);
    title.setScale(0.9); title.setAlpha(0);
    this.tweens.add({ targets:title, alpha:1, duration:400, ease:'sine.out' });
    this.tweens.add({ targets:title, scale:1.0, duration:600, ease:'sine.out', delay:80 });

    // Sous-titre
    const subtitle = this.add.text(400, 150, 'mais le jeu', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'14px', color: COLORS.white
    }).setOrigin(0.5).setAlpha(0.9);

    // Items de menu
    const entries = [
      { label:'NOUVELLE PARTIE', id:'new' },
      { label:'CONTINUER', id:'continue', disabled: !localStorage.getItem(SAVE_KEY) },
      { label:'OPTIONS', id:'options' },
      { label:'CREDITS', id:'credits' },
    ];

    const items = [];
    let y = 250;

    // Flèche unique qui se déplace au survol
    const arrow = this.add.text(0,0,'▶', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'14px', color: COLORS.white
    }).setVisible(false);

    entries.forEach((e, idx)=>{
      const color = e.disabled ? COLORS.grey : COLORS.white;
      const t = this.add.text(400, y + idx*50, e.label, {
        fontFamily:'"Press Start 2P", monospace', fontSize:'16px', color
      }).setOrigin(0.5);
      if(!e.disabled){
        t.setInteractive({ useHandCursor:true });
        t.on('pointerover', ()=>{
          t.setColor(COLORS.gold);
          arrow.setPosition(t.x - t.width/2 - 22, t.y).setVisible(true);
        });
        t.on('pointerout', ()=>{
          t.setColor(COLORS.white);
          arrow.setVisible(false);
        });
        t.on('pointerdown', ()=>{
          sfx('click',{volume:0.8});
          this._onMenuSelect(e.id);
        });
      }
      items.push(t);
    });

    // Version + Studio
    this.add.text(20, 580, 'Version Alpha 1.0', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'10px', color: '#aaaaaa'
    }).setOrigin(0,1);
    this.add.text(780, 580, 'by IMAGINe Studio', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'10px', color: '#aaaaaa'
    }).setOrigin(1,1);

    // Fenêtres intégrées (créées masquées)
    this._buildOptionsWindow();
    this._buildCreditsWindow();
  }

  _onMenuSelect(id){
    if(id==='new'){
      localStorage.removeItem(SAVE_KEY);
      alert('Nouvelle partie ! (brancher ici Level 1-0)');
    }
    if(id==='continue'){
      if(localStorage.getItem(SAVE_KEY)){
        alert('Continuer la partie (chargement à implémenter)');
      }
    }
    if(id==='options'){ this._showOptions(true); }
    if(id==='credits'){ this._showCredits(true); }
  }

  /* ===== Fenêtre OPTIONS ===== */
  _buildOptionsWindow(){
    const settings = getSettings();
    const cx=400, cy=300;

    // Overlay sombre
    this.optionsOverlay = this.add.rectangle(400,300,800,600,0x000000,0.35).setVisible(false).setInteractive();

    // Cadre
    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0x0b0b0f, 0.95).fillRoundedRect(cx-180, cy-120, 360, 240, 10);
    g.lineStyle(2, 0xffffff, 1).strokeRoundedRect(cx-180, cy-120, 360, 240, 10);
    this.optionsFrame = g;

    // Titre
    const title = this.add.text(cx, cy-90, 'OPTIONS', {
      fontFamily:'"Press Start 2P", monospace', fontSize:'14px', color: COLORS.cyan
    }).setOrigin(0.5).setVisible(false);

    // Difficulté
    const diffLabel = this.add.text(cx-130, cy-40, 'Difficulté', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#ffffff'
    }).setOrigin(0,0.5).setVisible(false);

    const diffVal = this.add.text(cx+60, cy-40, settings.difficulty, {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color: COLORS.pink
    }).setOrigin(0.5).setVisible(false);

    const diffLeft = this.add.text(cx+30, cy-40, '<', { fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#fff' })
      .setOrigin(0.5).setInteractive({useHandCursor:true}).setVisible(false);
    const diffRight = this.add.text(cx+90, cy-40, '>', { fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#fff' })
      .setOrigin(0.5).setInteractive({useHandCursor:true}).setVisible(false);

    const diffs = ['Facile','Normal','Difficile'];
    const sfxPlay = (key)=>{ if(getSettings().sfx) this.sound.play(key,{volume:0.8}); };

    const setDiff = (d)=>{ const s=getSettings(); s.difficulty=d; setSettings(s); diffVal.setText(d); };

    diffLeft.on('pointerdown', ()=>{ sfxPlay('click');
      const cur = getSettings().difficulty;
      const i = diffs.indexOf(cur);
      setDiff(diffs[(i+3-1)%3]);
    });
    diffRight.on('pointerdown', ()=>{ sfxPlay('click');
      const cur = getSettings().difficulty;
      const i = diffs.indexOf(cur);
      setDiff(diffs[(i+1)%3]);
    });

    // Musique
    const musicLabel = this.add.text(cx-130, cy, 'Musique', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#ffffff'
    }).setOrigin(0,0.5).setVisible(false);
    const musicVal = this.add.text(cx+60, cy, getSettings().music?'ON':'OFF', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color: COLORS.cyan
    }).setOrigin(0.5).setInteractive({useHandCursor:true}).setVisible(false);
    musicVal.on('pointerdown', ()=>{ sfxPlay('click');
      const s=getSettings(); s.music=!s.music; setSettings(s);
      musicVal.setText(s.music?'ON':'OFF');
    });

    // Effets sonores
    const sfxLabel = this.add.text(cx-130, cy+40, 'Sons', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#ffffff'
    }).setOrigin(0,0.5).setVisible(false);
    const sfxVal = this.add.text(cx+60, cy+40, getSettings().sfx?'ON':'OFF', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color: COLORS.cyan
    }).setOrigin(0.5).setInteractive({useHandCursor:true}).setVisible(false);
    sfxVal.on('pointerdown', ()=>{ sfxPlay('click');
      const s=getSettings(); s.sfx=!s.sfx; setSettings(s);
      sfxVal.setText(s.sfx?'ON':'OFF');
    });

    // Bouton Retour
    const back = this.add.text(cx, cy+90, 'RETOUR', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#ffffff'
    }).setOrigin(0.5).setInteractive({useHandCursor:true}).setVisible(false);
    back.on('pointerover', ()=> back.setColor(COLORS.gold));
    back.on('pointerout', ()=> back.setColor('#ffffff'));
    back.on('pointerdown', ()=>{ sfxPlay('click'); this._showOptions(false); });

    this.optionsElems = [title,diffLabel,diffVal,diffLeft,diffRight,musicLabel,musicVal,sfxLabel,sfxVal,back];
  }

  _showOptions(show){
    this.optionsOverlay.setVisible(show);
    this.optionsFrame.setVisible(show);
    this.optionsElems.forEach(e=> e.setVisible(show));
  }

  /* ===== Fenêtre CREDITS ===== */
  _buildCreditsWindow(){
    const cx=400, cy=300;
    this.creditsOverlay = this.add.rectangle(400,300,800,600,0x000000,0.35).setVisible(false).setInteractive();

    const g = this.add.graphics().setVisible(false);
    g.fillStyle(0x0b0b0f, 0.95).fillRoundedRect(cx-200, cy-120, 400, 240, 10);
    g.lineStyle(2, 0xffffff, 1).strokeRoundedRect(cx-200, cy-120, 400, 240, 10);
    this.creditsFrame = g;

    const title = this.add.text(cx, cy-90, 'CREDITS', {
      fontFamily:'"Press Start 2P"', fontSize:'14px', color: COLORS.pink
    }).setOrigin(0.5).setVisible(false);

    const text = this.add.text(cx, cy-25,
      "Site imaginé par Brad Bitt.\nMusique : échantillons créés par Mixvibes,\nassemblés par Lilyo.",
      { fontFamily:'"Press Start 2P"', fontSize:'10px', color:'#ffffff', align:'center' }
    ).setOrigin(0.5).setVisible(false);

    const back = this.add.text(cx, cy+85, 'RETOUR', {
      fontFamily:'"Press Start 2P"', fontSize:'12px', color:'#ffffff'
    }).setOrigin(0.5).setInteractive({useHandCursor:true}).setVisible(false);

    const sfxPlay = (key)=>{ if(getSettings().sfx) this.sound.play(key,{volume:0.8}); };
    back.on('pointerover', ()=> back.setColor(COLORS.gold));
    back.on('pointerout', ()=> back.setColor('#ffffff'));
    back.on('pointerdown', ()=>{ sfxPlay('click'); this._showCredits(false); });

    this.creditsElems = [title,text,back];
  }

  _showCredits(show){
    this.creditsOverlay.setVisible(show);
    this.creditsFrame.setVisible(show);
    this.creditsElems.forEach(e=> e.setVisible(show));
  }
}

/* ---------- CONFIG & BOOT ---------- */
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  // Canvas transparent pour laisser voir le gradient CSS
  transparent: true,
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PreloadScene, IntroScene, MenuScene],
};

new Phaser.Game(config);
