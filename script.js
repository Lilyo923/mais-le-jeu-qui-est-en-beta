/* ========= Brad Bitt — Menu Fusion Alpha 3.0 ========= */
const COLORS = { cyan:'#32C0C1', pink:'#F53098', white:'#FFFFFF', grey:'#888888', gold:'#FFD700' };
const SAVE_KEY = 'bradBittSave';
const SETTINGS_KEY = 'gameSettings';

/* ---- Settings helpers ---- */
function getSettings(){
  const s = localStorage.getItem(SETTINGS_KEY);
  if(s){ try{ return JSON.parse(s); }catch(e){} }
  const d = { difficulty:'Normal', music:true, sfx:true };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(d));
  return d;
}
function setSettings(v){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(v)); }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
function resetSave(){ localStorage.removeItem(SAVE_KEY); }

/* ---- Audio Manager ---- */
class AudioMgr{
  static scene=null; static music=null;
  static init(scene){ this.scene=scene; }
  static play(key,vol=0.9){ const s=getSettings(); if(s.sfx&&this.scene)this.scene.sound.play(key,{volume:vol}); }
  static playMusic(key,vol=0.6){
    const s=getSettings(); if(!s.music||!this.scene)return;
    if(this.music){ this.music.stop(); this.music.destroy(); }
    this.music=this.scene.sound.add(key,{volume:vol,loop:true}); this.music.play();
  }
}

/* ========================== SCÈNES ========================== */

/* 1️⃣ Chargement global */
class PreloadScene extends Phaser.Scene{
  constructor(){ super('PreloadScene'); }
  preload(){
    const txt=this.add.text(790,585,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff'}).setOrigin(1,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4; txt.setText('Chargement'+'.'.repeat(d));}});
    const sfx=['click','hover','open','poweroff','start','continue','back'];
    sfx.forEach(k=>this.load.audio(k,`assets/sounds/${k}.wav`));
    this.load.once('complete',()=>this.scene.start('IntroScene'));
  }
  create(){ AudioMgr.init(this); }
}

/* 2️⃣ Intro logos */
class IntroScene extends Phaser.Scene{
  constructor(){ super('IntroScene'); }
  create(){
    const s=getSettings();
    this._logo('IMAGINe','Studio',COLORS.cyan,COLORS.pink,()=>{
      this._logo('Engine','HwR',COLORS.pink,COLORS.cyan,()=>{
        this.cameras.main.fadeOut(700,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene'));
      });
    });
  }
  _logo(Ltxt,Rtxt,Lcol,Rcol,done){
    const cx=400,cy=300;
    const L=this.add.text(cx,cy,Ltxt,{fontFamily:'"Press Start 2P"',fontSize:'26px',color:Lcol}).setOrigin(1,0.5).setAlpha(0);
    const R=this.add.text(cx,cy,Rtxt,{fontFamily:'"Press Start 2P"',fontSize:'26px',color:Rcol}).setOrigin(0,0.5).setAlpha(0);
    AudioMgr.play('open',0.8);
    this.tweens.add({targets:[L,R],alpha:1,scale:{from:0.9,to:1},duration:800,ease:'sine.out'});
    this.time.delayedCall(2300,()=>{
      AudioMgr.play('poweroff',0.9);
      this.tweens.add({
        targets:[L,R],scaleY:0.05,alpha:0.8,duration:500,ease:'quad.in',
        onComplete:()=>{L.destroy();R.destroy();this.time.delayedCall(400,done);}
      });
    });
  }
}

/* 3️⃣ Menu principal */
class MenuScene extends Phaser.Scene{
  constructor(){ super('MenuScene'); }
  create(){
    AudioMgr.init(this);

    // Titre animé
    const title=this.add.text(400,110,'BRAD BITT',{
      fontFamily:'"Press Start 2P"',fontSize:'36px',color:COLORS.gold,stroke:'#fff',strokeThickness:2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({targets:title,alpha:1,scale:{from:0.9,to:1},duration:800,ease:'sine.out'});
    this.add.text(400,155,'mais le jeu',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.white}).setOrigin(0.5);

    // Menu
    const data=[
      {label:'NOUVELLE PARTIE',id:'new'},
      {label:'CONTINUER',id:'continue',disabled:!hasSave()},
      {label:'OPTIONS',id:'options'},
      {label:'CREDITS',id:'credits'}
    ];

    const arrow=this.add.text(0,0,'▶',{fontFamily:'"Press Start 2P"',fontSize:'16px',color:'#fff'}).setVisible(false);
    let y=250;
    data.forEach(e=>{
      const t=this.add.text(400,y,e.label,{
        fontFamily:'"Press Start 2P"',fontSize:'16px',
        color:e.disabled?COLORS.grey:COLORS.white
      }).setOrigin(0.5);
      y+=50;

      if(!e.disabled){
        t.setInteractive({useHandCursor:true});
        t.on('pointerover',()=>{
          AudioMgr.play('hover',0.7);
          t.setColor(COLORS.gold);
          arrow.setPosition(t.x-t.displayWidth/2-22,t.y+1).setVisible(true);
        });
        t.on('pointerout',()=>{t.setColor(COLORS.white);arrow.setVisible(false);});
        t.on('pointerdown',()=>{AudioMgr.play('click');this._select(e.id);});
      }
    });

    // Pied de page
    this.add.text(400,580,'Version Alpha 3.0',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(0.5,1);
    this.add.text(780,580,'IMAGINe Studio & Engine HwR',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(1,1);

    this._buildOptions(); this._buildCredits();
  }

  /* --- Gestion des clics --- */
  _select(id){
    if(id==='new'){
      if(hasSave()) return this._warnNewGame();
      AudioMgr.play('start');
      this._fadeOutTo('BootScene');
    }
    if(id==='continue' && hasSave()){
      AudioMgr.play('continue');
      this._fadeOutTo('BootScene');
    }
    if(id==='options') this._toggleOptions(true);
    if(id==='credits') this._toggleCredits(true);
  }

  /* --- Fondu vers une autre scène --- */
  _fadeOutTo(sceneKey){
    const objs=this.children.list.filter(o=>o.alpha!==undefined);
    let delay=0;
    objs.forEach(o=>{
      this.tweens.add({targets:o,alpha:0,duration:300,delay,ease:'sine.in'});
      delay+=80;
    });
    this.time.delayedCall(delay+400,()=>this.scene.start(sceneKey));
  }

  /* --- Popup "Nouvelle partie" --- */
  _warnNewGame(){
    AudioMgr.play('open');
    const overlay=document.createElement('div');
    overlay.className='popup-overlay';
    const box=document.createElement('div');
    box.className='warning-popup';
    box.innerHTML=`
      <div class="warning-symbol">⚠️</div>
      <div class="warning-content">
        <p>Toute progression actuelle sera effacée.<br>Es-tu sûr de vouloir recommencer&nbsp;?</p>
        <div class="warning-buttons">
          <button id="w-cancel">ANNULER</button>
          <button id="w-ok" class="danger">CONTINUER</button>
        </div>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.getElementById('w-cancel').onclick=()=>{
      AudioMgr.play('back'); document.body.removeChild(overlay);
    };
    document.getElementById('w-ok').onclick=()=>{
      AudioMgr.play('click'); resetSave(); document.body.removeChild(overlay);
      this._fadeOutTo('BootScene');
    };
  }

  /* --- Menu Options --- */
  _buildOptions(){
    const cx=400,cy=300,s=getSettings(),p=(k)=>AudioMgr.play(k,0.8);
    this.optOverlay=this.add.rectangle(cx,cy,800,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-190,cy-130,380,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-190,cy-130,380,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'OPTIONS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5).setVisible(false);

    // difficulté
    const diffLab=this.add.text(cx-130,cy-45,'Difficulté',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const diffVal=this.add.text(cx+60,cy-45,s.difficulty,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const L=this.add.text(cx-60,cy-45,'<',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const R=this.add.text(cx+180,cy-45,'>',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const diffs=['Facile','Normal','Difficile'], setD=d=>{const s=getSettings();s.difficulty=d;setSettings(s);diffVal.setText(d);};
    L.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+2)%3]);});
    R.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+1)%3]);});

    // musique
    const musLab=this.add.text(cx-130,cy,'Musique',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const musVal=this.add.text(cx+60,cy,getSettings().music?'ON':'OFF',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.cyan})
      .setOrigin(0.5).setInteractive().setVisible(false);
    musVal.on('pointerdown',()=>{p('click');const s=getSettings();s.music=!s.music;setSettings(s);musVal.setText(s.music?'ON':'OFF');
      if(!s.music&&AudioMgr.music){AudioMgr.music.stop();}});

    // sons
    const sfxLab=this.add.text(cx-130,cy+45,'Sons',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const sfxVal=this.add.text(cx+60,cy+45,getSettings().sfx?'ON':'OFF',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.cyan})
      .setOrigin(0.5).setInteractive().setVisible(false);
    sfxVal.on('pointerdown',()=>{p('click');const s=getSettings();s.sfx=!s.sfx;setSettings(s);sfxVal.setText(s.sfx?'ON':'OFF');});

    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'})
      .setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleOptions(false);});

    this.optElems=[g,title,diffLab,diffVal,L,R,musLab,musVal,sfxLab,sfxVal,back];
  }
  _toggleOptions(v){this.optOverlay.setVisible(v);this.optElems.forEach(e=>e.setVisible(v));}

  /* --- Crédits --- */
  _buildCredits(){
    const cx=400,cy=300,p=(k)=>AudioMgr.play(k,0.8);
    this.credOverlay=this.add.rectangle(400,300,800,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-210,cy-130,420,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-210,cy-130,420,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'CREDITS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const text=this.add.text(cx,cy-25,"Site imaginé par Brad Bitt.\nMusique : Échantillons créés par Mixvibes,\nassemblés par Lilyo.",{
      fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff',align:'center'}).setOrigin(0.5).setVisible(false);
    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleCredits(false);});
    this.credElems=[g,title,text,back];
  }
  _toggleCredits(v){this.credOverlay.setVisible(v);this.credElems.forEach(e=>e.setVisible(v));}
}
/* ========= Brad Bitt — Niveau 1-0 Intro corrigé ========= */

class BootScene extends Phaser.Scene{
  constructor(){ super('BootScene'); }
  preload(){
    const txt=this.add.text(400,560,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4;txt.setText('Chargement'+'.'.repeat(d));}});
    this.load.audio('level1_intro_theme','assets/music/level1_intro_theme.mp3');
    this.load.spritesheet('brad','assets/img/player/brad_48x48.png',{ frameWidth:48, frameHeight:48 });
    this.load.once('complete',()=> this.scene.start('GameIntroScene'));
  }
  create(){ AudioMgr.init(this); }
}

/* ====== Niveau 1-0 ====== */
class GameIntroScene extends Phaser.Scene{
  constructor(){ super('GameIntroScene'); }

  create(){
    AudioMgr.init(this);
    const W=1600,H=900;
    this.physics.world.setBounds(0,0,W,H);
    this.physics.world.gravity.y=1000;

    /* === Ciel dynamique === */
    this.bg=this.add.graphics();
    this._drawSky();
    this.clouds=this.add.group();
    for(let i=0;i<8;i++){
      const c=this.add.graphics();
      c.fillStyle(0xffffff,0.3);
      const x=Phaser.Math.Between(0,W), y=Phaser.Math.Between(30,250);
      c.fillEllipse(x,y,Phaser.Math.Between(100,180),Phaser.Math.Between(40,80));
      c._speed=Phaser.Math.FloatBetween(0.2,0.6);
      c._x=x; this.clouds.add(c);
    }

    /* === Sol herbe + terre === */
    const g=this.add.graphics();
    g.fillStyle(0x228B22,1); g.fillRect(0,780,W,20);     // herbe
    g.fillStyle(0x8B4513,1); g.fillRect(0,800,W,120);    // terre
    this.platforms=this.physics.add.staticGroup();
    const ground=this.platforms.create(W/2,790,null).setDisplaySize(W,20).refreshBody();

    /* === Joueur === */
    this.player=this.physics.add.sprite(200,600,'brad',0);
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this._initBradAnims();
    this.player.play('brad_idle');
    this.physics.add.collider(this.player,this.platforms,()=>this._onLand());

    /* === Ennemis blocs === */
    this.enemies=this.physics.add.group({allowGravity:true});
    this._spawnEnemy(1000,740,'basic');
    this._spawnEnemy(1200,740,'helmet');
    this.physics.add.collider(this.enemies,this.platforms);

    /* === Caméra & contrôles === */
    this.cameras.main.setBounds(0,0,W,H);
    this.cameras.main.startFollow(this.player,true,0.12,0.12);
    this.cursors=this.input.keyboard.createCursorKeys();
    this.keyZ=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    /* === Musique & intro === */
    AudioMgr.playMusic('level1_intro_theme',0.4);

    /* === Pause menu === */
    this.isPaused=false;
    this._setupPause();

    /* === Mobile === */
    this._setupMobile();

    /* Fondu d’entrée */
    this.cameras.main.fadeIn(800,0,0,0);
  }

  update(){
    if(this.isPaused) return;

    const c=this.cursors, p=this.player;
    const speed=180, jump=-400;

    if(c.left.isDown){ p.setVelocityX(-speed); p.flipX=true; p.play('brad_walk',true);}
    else if(c.right.isDown){ p.setVelocityX(speed); p.flipX=false; p.play('brad_walk',true);}
    else{ p.setVelocityX(0); p.play('brad_idle',true); }

    if((c.up.isDown||this.keyZ.isDown||this.keySpace.isDown||this._mobileJump)&&p.body.touching.down){
      AudioMgr.play('jump'); p.setVelocityY(jump);
    }

    // mise à jour du ciel
    this._drawSky();
    this.clouds.children.iterate(c=>{
      c._x -= c._speed;
      if(c._x<-200) c._x=1600+200;
      c.setX(c._x);
    });
  }

  /* === Visuel ciel === */
  _drawSky(){
    const g=this.bg; g.clear();
    const W=1600,H=900;
    const top=Phaser.Display.Color.GetColor(20,30,60);
    const mid=Phaser.Display.Color.GetColor(40,80,130);
    const bot=Phaser.Display.Color.GetColor(60,110,160);
    g.fillGradientStyle(top,top,mid,mid,1);
    g.fillRect(0,0,W,H*0.7);
    g.fillStyle(bot,1); g.fillRect(0,H*0.7,W,H*0.3);
  }

  _spawnEnemy(x,y,type){
    const e=this.enemies.create(x,y,null);
    e.setSize(32,32).setCollideWorldBounds(true).setBounce(0.1);
    e.setTintFill(type==='helmet'?0x3a7dff:0xff2a2a);
    return e;
  }

  _initBradAnims(){
    if(this.anims.exists('brad_idle')) return;
    this.anims.create({key:'brad_idle',frames:this.anims.generateFrameNumbers('brad',{start:0,end:3}),frameRate:6,repeat:-1});
    this.anims.create({key:'brad_walk',frames:this.anims.generateFrameNumbers('brad',{start:4,end:7}),frameRate:10,repeat:-1});
    this.anims.create({key:'brad_jump',frames:this.anims.generateFrameNumbers('brad',{start:8,end:11}),frameRate:10,repeat:-1});
  }

  _onLand(){ if(!this.landed){ AudioMgr.play('land_heavy',0.7); this.landed=true; } }

  /* === Pause === */
  _setupPause(){
    const pBtn=document.getElementById('btn-pause');
    pBtn.addEventListener('click',()=>this._togglePause());
    this.input.keyboard.on('keydown-P',()=>this._togglePause());
  }

  _togglePause(){
    if(this.isPaused){
      this.scene.resume();
      this.isPaused=false;
      AudioMgr.play('pause_off');
      const o=document.querySelector('.popup-overlay');
      if(o) o.remove();
    }else{
      this.scene.pause();
      this.isPaused=true;
      AudioMgr.play('pause_on');
      const overlay=document.createElement('div');
      overlay.className='popup-overlay';
      overlay.innerHTML=`
        <div class="popup">
          <h3>Jeu en pause</h3>
          <div class="row">
            <button class="btn" id="resumeBtn">Reprendre</button>
            <button class="btn warning" id="quitBtn">Quitter</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.getElementById('resumeBtn').onclick=()=>{AudioMgr.play('back');this._togglePause();};
      document.getElementById('quitBtn').onclick=()=>{
        AudioMgr.play('click');document.body.removeChild(overlay);
        this.scene.stop();this.scene.start('MenuScene');
      };
    }
  }

  /* === Contrôles mobiles === */
  _setupMobile(){
    const ui=document.getElementById('mobile-ui');
    const jump=document.getElementById('btn-jump');
    const pause=document.getElementById('btn-pause');
    if(!ui) return;
    ui.classList.remove('hidden');
    this._mobileJump=false;

    jump.addEventListener('touchstart',()=>{this._mobileJump=true;});
    jump.addEventListener('touchend',()=>{this._mobileJump=false;});
    pause.addEventListener('touchstart',()=>this._togglePause());
  }
}

/* === Configuration Phaser === */
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  transparent: true,
  physics: { default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PreloadScene, IntroScene, MenuScene, BootScene, GameIntroScene]
});
