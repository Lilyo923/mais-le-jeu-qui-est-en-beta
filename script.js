/* ========= Brad Bitt — Version Fusionnée ========= */
/* Intro → Menu → Niveau 1-0 | Style rétro, sons unifiés */

const SAVE_KEY = 'bradBittSave';
const SETTINGS_KEY = 'gameSettings';
const COLORS = {
  cyan: '#32C0C1',
  pink: '#F53098',
  white: '#FFFFFF',
  grey: '#888888',
  gold: '#FFD700'
};

/* ======= Gestion des paramètres ======= */
function getSettings() {
  const s = localStorage.getItem(SETTINGS_KEY);
  if (s) try { return JSON.parse(s); } catch(e){}
  const d = { difficulty: 'Normal', music: true, sfx: true };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(d));
  return d;
}
function setSettings(v) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)); }
function hasSave() { return !!localStorage.getItem(SAVE_KEY); }
function resetSave() { localStorage.removeItem(SAVE_KEY); }
function setSave(obj) { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); }

/* ======= Gestion audio ======= */
class AudioMgr {
  static scene = null;
  static init(scene){ this.scene = scene; }
  static play(key, vol=0.9){ const s=getSettings(); if(s.sfx && this.scene) this.scene.sound.play(key,{volume:vol}); }
  static music = null;
  static playMusic(key, vol=0.6){
    const s=getSettings(); if(!s.music || !this.scene) return;
    if(this.music){ this.music.stop(); this.music.destroy(); }
    this.music = this.scene.sound.add(key,{volume:vol,loop:true});
    this.music.play();
  }
  static setMusicEnabled(v){ const s=getSettings(); s.music=v; setSettings(s); if(!v&&this.music){this.music.stop();} }
  static setSfxEnabled(v){ const s=getSettings(); s.sfx=v; setSettings(s); }
}

/* ======= SCÈNE 1 – Préchargement ======= */
class PreloadScene extends Phaser.Scene {
  constructor(){ super('PreloadScene'); }
  preload(){
    const t=this.add.text(790,585,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff'}).setOrigin(1,1);
    let d=0;
    this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4;t.setText('Chargement'+'.'.repeat(d));}});
    [
      'click','hover','open','poweroff','start','continue','back',
      'jump','land_heavy','wind_whoosh','punch','stomp_hit','clong_helmet',
      'enemy_hurt','spikes_toggle_on','spikes_toggle_off','timer_tick',
      'pause_on','pause_off'
    ].forEach(k=>this.load.audio(k,`assets/sounds/${k}.wav`));
    this.load.audio('level1_intro_theme','assets/music/level1_intro_theme.mp3');
    this.load.spritesheet('brad','assets/img/player/brad_48x48.png',{ frameWidth:48, frameHeight:48 });
    this.load.once('complete',()=>this.scene.start('IntroScene'));
  }
  create(){ AudioMgr.init(this); }
}

/* ======= SCÈNE 2 – Intro Logo ======= */
class IntroScene extends Phaser.Scene {
  constructor(){ super('IntroScene'); }
  create(){
    const s=getSettings();
    this._playLogo('IMAGINe','Studio',COLORS.cyan,COLORS.pink,s,()=>{
      this._playLogo('Engine','HwR',COLORS.pink,COLORS.cyan,s,()=>{
        this.cameras.main.fadeOut(500,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene'));
      });
    });
  }
  _playLogo(l,r,lc,rc,s,onDone){
    const cx=400,cy=300;
    const L=this.add.text(cx,cy,l,{fontFamily:'"Press Start 2P"',fontSize:'26px',color:lc}).setOrigin(1,0.5).setAlpha(0);
    const R=this.add.text(cx,cy,r,{fontFamily:'"Press Start 2P"',fontSize:'26px',color:rc}).setOrigin(0,0.5).setAlpha(0);
    if(s.sfx) this.sound.play('open',{volume:0.8});
    this.tweens.add({targets:[L,R],alpha:1,scale:{from:0.9,to:1},duration:800,ease:'sine.out'});
    this.time.delayedCall(2300,()=>{
      if(getSettings().sfx) this.sound.play('poweroff',{volume:0.9});
      this.tweens.add({
        targets:[L,R],scaleY:0.05,alpha:0.8,duration:500,ease:'quad.in',
        onComplete:()=>{L.destroy();R.destroy();this.time.delayedCall(400,onDone);}
      });
    });
  }
}

/* ======= SCÈNE 3 – Menu Principal ======= */
class MenuScene extends Phaser.Scene {
  constructor(){ super('MenuScene'); }

  create(){
    AudioMgr.init(this);
    const s=getSettings(),play=(k)=>{if(s.sfx)this.sound.play(k,{volume:0.9});};

    const title=this.add.text(400,110,'BRAD BITT',{fontFamily:'"Press Start 2P"',fontSize:'36px',color:COLORS.gold,stroke:'#fff',strokeThickness:2}).setOrigin(0.5).setAlpha(0);
    this.tweens.add({targets:title,alpha:1,scale:{from:0.9,to:1},duration:600});
    this.add.text(400,155,'mais le jeu',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.white}).setOrigin(0.5);

    const data=[
      {label:'NOUVELLE PARTIE',id:'new'},
      {label:'CONTINUER',id:'continue',disabled:!hasSave()},
      {label:'OPTIONS',id:'options'},
      {label:'CREDITS',id:'credits'}
    ];

    const arrow=this.add.text(0,0,'▶',{fontFamily:'"Press Start 2P"',fontSize:'16px',color:'#fff'}).setVisible(false);
    let y=250;
    data.forEach(e=>{
      const col=e.disabled?COLORS.grey:COLORS.white;
      const t=this.add.text(400,y,e.label,{fontFamily:'"Press Start 2P"',fontSize:'16px',color:col}).setOrigin(0.5);
      y+=50;
      if(!e.disabled){
        t.setInteractive({useHandCursor:true});
        t.on('pointerover',()=>{play('hover',0.7);t.setColor(COLORS.gold);arrow.setPosition(t.x-t.displayWidth/2-22,t.y+1).setVisible(true);});
        t.on('pointerout',()=>{t.setColor(COLORS.white);arrow.setVisible(false);});
        t.on('pointerdown',()=>{play('click');this._onSelect(e.id);});
      }
    });

    this.add.text(20,580,'Version 1.0 Fusion',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(0,1);
    this.add.text(780,580,'by IMAGINe Studio',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(1,1);

    this._buildOptions();
    this._buildCredits();
  }

  _onSelect(id){
    if(id==='new'){
      if(hasSave()) this._showWarningPopup();
      else { AudioMgr.play('start'); this.scene.start('BootScene'); }
    }
    if(id==='continue' && hasSave()){ AudioMgr.play('continue'); alert('Chargement de la sauvegarde...'); }
    if(id==='options') this._toggleOptions(true);
    if(id==='credits') this._toggleCredits(true);
  }

  _showWarningPopup(){
    AudioMgr.play('open');
    const overlay=document.createElement('div'); overlay.className='popup-overlay';
    const popup=document.createElement('div'); popup.className='warning-popup';
    popup.innerHTML=`
      <div class="warning-symbol">⚠️</div>
      <div class="warning-content">
        <p>Toute progression actuelle sera effacée.<br>Es-tu sûr de vouloir recommencer ?</p>
        <div class="warning-buttons">
          <button id="cancel-btn">ANNULER</button>
          <button id="confirm-btn" class="danger">CONTINUER</button>
        </div>
      </div>
    `;
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    document.getElementById('cancel-btn').onclick=()=>{AudioMgr.play('back');document.body.removeChild(overlay);};
    document.getElementById('confirm-btn').onclick=()=>{
      AudioMgr.play('click');
      resetSave();
      document.body.removeChild(overlay);
      this.scene.start('BootScene');
    };
  }

  /* ---- Options ---- */
  _buildOptions(){
    const s=getSettings(),cx=400,cy=300,p=(k)=>{if(s.sfx)this.sound.play(k,{volume:0.8});};
    this.optOverlay=this.add.rectangle(400,300,800,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-190,cy-130,380,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-190,cy-130,380,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'OPTIONS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5).setVisible(false);

    const diffLab=this.add.text(cx-130,cy-45,'Difficulté',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const diffVal=this.add.text(cx+60,cy-45,s.difficulty,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const L=this.add.text(cx-40,cy-45,'<',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const R=this.add.text(cx+160,cy-45,'>',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const diffs=['Facile','Normal','Difficile'],setD=d=>{const s=getSettings();s.difficulty=d;setSettings(s);diffVal.setText(d);};
    L.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+2)%3]);});
    R.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+1)%3]);});

    const musLab=this.add.text(cx-130,cy,'Musique',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const musVal=this.add.text(cx+60,cy,getSettings().music?'ON':'OFF',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.cyan})
      .setOrigin(0.5).setInteractive().setVisible(false);
    musVal.on('pointerdown',()=>{p('click');const s=getSettings();s.music=!s.music;setSettings(s);musVal.setText(s.music?'ON':'OFF');});

    const sfxLab=this.add.text(cx-130,cy+45,'Sons',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const sfxVal=this.add.text(cx+60,cy+45,getSettings().sfx?'ON':'OFF',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.cyan})
      .setOrigin(0.5).setInteractive().setVisible(false);
    sfxVal.on('pointerdown',()=>{p('click');const s=getSettings();s.sfx=!s.sfx;setSettings(s);sfxVal.setText(s.sfx?'ON':'OFF');});

    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleOptions(false);});

    this.optElems=[g,title,diffLab,diffVal,L,R,musLab,musVal,sfxLab,sfxVal,back];
  }
  _toggleOptions(v){this.optOverlay.setVisible(v);this.optElems.forEach(e=>e.setVisible(v));}

  _buildCredits(){
    const cx=400,cy=300;
    this.credOverlay=this.add.rectangle(400,300,800,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-210,cy-130,420,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-210,cy-130,420,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'CREDITS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const text=this.add.text(cx,cy-25,"Site imaginé par Brad Bitt.\nMusique : Échantillons créés par Mixvibes,\nassemblés par Lilyo.",{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff',align:'center'}).setOrigin(0.5).setVisible(false);
    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{AudioMgr.play('back');this._toggleCredits(false);});
    this.credElems=[g,title,text,back];
  }
  _toggleCredits(v){this.credOverlay.setVisible(v);this.credElems.forEach(e=>e.setVisible(v));}
}

/* ======= SCÈNE 4 – Jeu (niveau 1-0) ======= */
// (Reprise intégrale de ton niveau : chute, plateformes, ennemis, nuages, tutoriel, etc.)
class BootScene extends Phaser.Scene {
  constructor(){ super('BootScene'); }
  preload(){
    const t=this.add.text(400,560,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4;t.setText('Chargement'+'.'.repeat(d));}});
    this.load.once('complete',()=> this.scene.start('GameScene'));
  }
  create(){ AudioMgr.init(this); }
}

class GameScene extends Phaser.Scene {
  constructor(){ super('GameScene'); }

  create(){
    AudioMgr.init(this);
    const W=4000,H=2400;
    this.physics.world.setBounds(0,-H,W,H+800);
    this.bg=this.add.graphics().setScrollFactor(0);
    this._drawSky(0);
    this.cloudsFar=this._spawnClouds(8,0.15,0xFFFFFF,0.22);
    this.cloudsMid=this._spawnClouds(8,0.30,0xFFFFFF,0.28);
    this.cloudsNear=this._spawnClouds(6,0.50,0xFFFFFF,0.35);
    this.platforms=this.physics.add.staticGroup();
    this.platforms.create(800,0,null).setDisplaySize(1600,24).refreshBody();
    const baseX=1900,gap=180;
    [0,1,2,3].forEach(i=>this.platforms.create(baseX+i*gap,-80-i*30,null).setDisplaySize(120,18).refreshBody());
    this.spikes=this.physics.add.staticGroup();
    this.buttons=this.physics.add.staticGroup();
    this.enemies=this.physics.add.group({allowGravity:true,immovable:false});
    const e1=this._spawnEnemy(3000,-40,'basic');
    const e2=this._spawnEnemy(3200,-40,'helmet');

    this.player=this.physics.add.sprite(200,-1800,'brad',0);
    this._initBradAnims();
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player,this.platforms,()=>this._onLand());
    this.physics.add.collider(this.enemies,this.platforms);

    this.cursors=this.input.keyboard.createCursorKeys();
    this.keyZ=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.cameras.main.setBounds(0,-H,W,H+600);
    this.cameras.main.startFollow(this.player,true,0.12
