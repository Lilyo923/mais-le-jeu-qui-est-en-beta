/* ========= Brad Bitt — Fusion Alpha 3.2 (Menu + Niveau) ========= */
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
    const txt=this.add.text(950,585,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff'}).setOrigin(1,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4; txt.setText('Chargement'+'.'.repeat(d));}});
    const sfx=['click','hover','open','poweroff','start','continue','back','pause_on','pause_off','jump','land_heavy'];
    sfx.forEach(k=>this.load.audio(k,`assets/sounds/${k}.wav`));
    this.load.audio('level1_intro_theme','assets/music/level1_intro_theme.mp3');
    this.load.spritesheet('brad','assets/img/player/brad_48x48.png',{ frameWidth:48, frameHeight:48 });
    this.load.once('complete',()=>this.scene.start('IntroScene'));
  }
  create(){ AudioMgr.init(this); }
}

/* 2️⃣ Intro logos */
class IntroScene extends Phaser.Scene{
  constructor(){ super('IntroScene'); }
  create(){
    this._logo('IMAGINe','Studio',COLORS.cyan,COLORS.pink,()=>{
      this._logo('Engine','HwR',COLORS.pink,COLORS.cyan,()=>{
        this.cameras.main.fadeOut(700,0,0,0);
        this.cameras.main.once('camerafadeoutcomplete',()=>this.scene.start('MenuScene'));
      });
    });
  }
  _logo(Ltxt,Rtxt,Lcol,Rcol,done){
    const cx=480,cy=300;
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
    const cx=480;

    const title=this.add.text(cx,110,'BRAD BITT',{
      fontFamily:'"Press Start 2P"',fontSize:'36px',color:COLORS.gold,stroke:'#fff',strokeThickness:2
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({targets:title,alpha:1,scale:{from:0.9,to:1},duration:800,ease:'sine.out'});
    this.add.text(cx,155,'mais le jeu',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.white}).setOrigin(0.5);

    const data=[
      {label:'NOUVELLE PARTIE',id:'new'},
      {label:'CONTINUER',id:'continue',disabled:!hasSave()},
      {label:'OPTIONS',id:'options'},
      {label:'CREDITS',id:'credits'}
    ];

    const arrow=this.add.text(0,0,'▶',{fontFamily:'"Press Start 2P"',fontSize:'16px',color:'#fff'}).setVisible(false);
    let y=250;
    data.forEach(e=>{
      const t=this.add.text(cx,y,e.label,{
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
    this.add.text(cx,580,'Version Alpha 3.2',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(0.5,1);
    this.add.text(940,580,'IMAGINe Studio & Engine HwR',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(1,1);

    this._buildOptions(); this._buildCredits();
  }

  _select(id){
    if(id==='new'){
      if(hasSave()) return this._warnNewGame();
      AudioMgr.play('start');
      this._fadeOutTo('DifficultyScene');
    }
    if(id==='continue' && hasSave()){
      AudioMgr.play('continue');
      this._fadeOutTo('BootScene');
    }
    if(id==='options') this._toggleOptions(true);
    if(id==='credits') this._toggleCredits(true);
  }

  _fadeOutTo(sceneKey){
    const objs=this.children.list.filter(o=>o.alpha!==undefined);
    let delay=0;
    objs.forEach(o=>{
      this.tweens.add({targets:o,alpha:0,duration:300,delay,ease:'sine.in'});
      delay+=80;
    });
    this.time.delayedCall(delay+400,()=>this.scene.start(sceneKey));
  }

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
      this._fadeOutTo('DifficultyScene');
    };
  }

  /* --- Options --- */
  _buildOptions(){
    const cx=480,cy=300,s=getSettings(),p=(k)=>AudioMgr.play(k,0.8);
    this.optOverlay=this.add.rectangle(cx,cy,960,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-190,cy-130,380,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-190,cy-130,380,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'OPTIONS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5).setVisible(false);

    // difficulté
    const diffLab=this.add.text(cx-130,cy-45,'Difficulté',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const diffVal=this.add.text(cx+60,cy-45,s.difficulty,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const L=this.add.text(cx+10,cy-45,'<',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(1,0.5).setInteractive().setVisible(false);
    const R=this.add.text(cx+110,cy-45,'>',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setInteractive().setVisible(false);
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
    const cx=480,cy=300,p=(k)=>AudioMgr.play(k,0.8);
    this.credOverlay=this.add.rectangle(cx,cy,960,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-210,cy-130,420,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-210,cy-130,420,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'CREDITS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const text=this.add.text(cx,cy-25,"Site imaginé par Brad Bitt.\nMusique : Échantillons créés par Mixvibes,\nassemblés par Lilyo.",{
      fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff',align:'center'}).setOrigin(0.5).setVisible(false);
    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff' ,lineSpacing: 10}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleCredits(false);});
    this.credElems=[g,title,text,back];
  }
  _toggleCredits(v){this.credOverlay.setVisible(v);this.credElems.forEach(e=>e.setVisible(v));}
}

/* 4️⃣ Choix de difficulté */
class DifficultyScene extends Phaser.Scene{
  constructor(){ super('DifficultyScene'); }
  create(){
    AudioMgr.init(this);
    const cx=480,cy=300;
    const panel=this.add.rectangle(cx,cy,460,240,0x0b0b0f,0.98).setStrokeStyle(2,0xffffff);
    const title=this.add.text(cx,240,'CHOISIS LA DIFFICULTÉ',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5);
    const opts=['Facile','Normal','Difficile']; let x=cx-150;
    opts.forEach(label=>{
      const btn=this.add.text(x,cy,label,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive({useHandCursor:true});
      btn.on('pointerover',()=>{AudioMgr.play('hover',0.7); btn.setColor(COLORS.gold);});
      btn.on('pointerout',()=>btn.setColor('#fff'));
      btn.on('pointerdown',()=>{ AudioMgr.play('click'); const st=getSettings(); st.difficulty=label; setSettings(st);
        this.tweens.add({targets:[panel,title,btn],alpha:0,duration:400,onComplete:()=>this.scene.start('BootScene')}); });
      x+=150;
    });
  }
}

/* 5️⃣ Boot + Niveau */
class BootScene extends Phaser.Scene{
  constructor(){ super('BootScene'); }
  create(){ this.scene.start('GameIntroScene'); }
}

/* 6) Niveau 1-0 (intro chute + début de zone) */
class GameIntroScene extends Phaser.Scene {
  constructor(){ super('GameIntroScene'); }
  create(){
    AudioMgr.init(this);
    const W=4000,H=2400;
    this.physics.world.setBounds(0,-H,W,H+800);
    this.physics.world.gravity.y=1200;

    // Fond & nuages
    this.bg=this.add.graphics().setScrollFactor(0);
    this._drawSky(0);
    this.cloudsFar = this._spawnClouds(8,0.15,0xFFFFFF,0.22);
    this.cloudsMid = this._spawnClouds(8,0.30,0xFFFFFF,0.28);
    this.cloudsNear= this._spawnClouds(6,0.50,0xFFFFFF,0.35);

    // Plateformes sol + structures
    this.platforms=this.physics.add.staticGroup();
    this.platforms.create(800,780,null).setDisplaySize(1600,40).refreshBody(); // sol visible
    const baseX=1900, gap=180;
    [0,1,2,3].forEach(i=> this.platforms.create(baseX+i*gap, 700 - i*30, null).setDisplaySize(120,18).refreshBody());

    // Ennemis (blocs temporaires)
    this.enemies=this.physics.add.group({allowGravity:true});
    this._spawnEnemy(3000,700,'basic');
    this._spawnEnemy(3200,700,'helmet');

    // Joueur
    this.player=this.physics.add.sprite(200,700,'brad',0);
    this._initBradAnims();
    this.player.play('brad_idle', true);
    this.player.setCollideWorldBounds(true);

    // Collisions
    this.physics.add.collider(this.player,this.platforms,()=>this._onLand());
    this.physics.add.collider(this.enemies,this.platforms);

    // Contrôles clavier
    this.cursors=this.input.keyboard.createCursorKeys();
    this.keyZ=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Caméra
    this.cameras.main.setBounds(0,-H,W,H+600);
    this.cameras.main.startFollow(this.player,true,0.12,0.12);

    // Intro chute
    AudioMgr.play('wind_whoosh',0.6);
    this.state='intro_fall';
    this.time.delayedCall(10000,()=>{ if(this.state==='intro_fall'){ this.player.setVelocityY(0); this.player.y = 700; }});
  }

  update(time,delta){
    const t = Math.min(1, time/3000);
    this._drawSky(t);
    this._tickClouds(this.cloudsFar, 10*delta/1000);
    this._tickClouds(this.cloudsMid, 20*delta/1000);
    this._tickClouds(this.cloudsNear,35*delta/1000);

    // Mouvement du joueur
    if(this.cursors.left.isDown){
      this.player.setVelocityX(-200);
      this.player.flipX = true;
      this.player.play('brad_walk', true);
    } else if(this.cursors.right.isDown){
      this.player.setVelocityX(200);
      this.player.flipX = false;
      this.player.play('brad_walk', true);
    } else {
      this.player.setVelocityX(0);
      if(this.player.body.blocked.down) this.player.play('brad_idle', true);
    }

    // Saut
    if((Phaser.Input.Keyboard.JustDown(this.keyZ) || Phaser.Input.Keyboard.JustDown(this.keySpace)) && this.player.body.blocked.down){
      this.player.setVelocityY(-500);
      AudioMgr.play('jump',0.6);
      this.player.play('brad_jump', true);
    }
  }

  /* --- visuel --- */
  _drawSky(t){
    this.bg.clear();
    const top=Phaser.Display.Color.Interpolate.ColorWithColor({r:11,g:11,b:15},{r:32,g:78,b:156},100,t*100);
    const mid=Phaser.Display.Color.Interpolate.ColorWithColor({r:18,g:18,b:23},{r:76,g:140,b:210},100,t*100);
    const bot=Phaser.Display.Color.Interpolate.ColorWithColor({r:10,g:10,b:13},{r:40,g:96,b:176},100,t*100);
    const w=this.scale.width,h=this.scale.height,g=this.bg;
    g.fillStyle(Phaser.Display.Color.GetColor(top.r,top.g,top.b),1); g.fillRect(0,0,w,h*0.4);
    g.fillStyle(Phaser.Display.Color.GetColor(mid.r,mid.g,mid.b),1); g.fillRect(0,h*0.4,w,h*0.35);
    g.fillStyle(Phaser.Display.Color.GetColor(bot.r,bot.g,bot.b),1); g.fillRect(0,h*0.75,w,h*0.25);
  }
  _spawnClouds(n,sf,color,alpha){
    const g=this.add.group();
    for(let i=0;i<n;i++){
      const c=this.add.graphics().setScrollFactor(0);
      c.fillStyle(color,alpha);
      const x=Phaser.Math.Between(0,800), y=Phaser.Math.Between(20,300);
      c.fillEllipse(x,y,Phaser.Math.Between(110,200),Phaser.Math.Between(40,80));
      c._speed=sf; c._x=x; g.add(c);
    }
    return g;
  }
  _tickClouds(group,spd){
    group.children.iterate(c=>{ c._x-=spd*c._speed; if(c._x<-220) c._x=800+220; c.setX(c._x); });
  }

  /* --- gameplay --- */
  _spawnEnemy(x,y,type){
    const en=this.enemies.create(x,y,null);
    en.setSize(32,32).setBounce(0.1).setCollideWorldBounds(true);
    en.setTintFill(type==='helmet'?0x2a7dff:0xff2a2a);
    return en;
  }
  _onLand(){
    if(this.landed) return;
    this.landed=true;
    AudioMgr.play('land_heavy',0.8);
    AudioMgr.playMusic('level1_intro_theme',0.28);
  }
  _initBradAnims(){
    if(this.anims.exists('brad_idle')) return;
    this.anims.create({ key:'brad_idle', frames:this.anims.generateFrameNumbers('brad',{start:0,end:3}), frameRate:6, repeat:-1});
    this.anims.create({ key:'brad_walk', frames:this.anims.generateFrameNumbers('brad',{start:4,end:7}), frameRate:10, repeat:-1});
    this.anims.create({ key:'brad_jump', frames:this.anims.generateFrameNumbers('brad',{start:8,end:11}), frameRate:10, repeat:-1});
  }
}

  update(){
    const p=this.player,c=this.cursors;
    const speed=180,jump=-400;
    if(c.left.isDown){ p.setVelocityX(-speed); p.flipX=true; p.play('brad_walk',true);}
    else if(c.right.isDown){ p.setVelocityX(speed); p.flipX=false; p.play('brad_walk',true);}
    else{ p.setVelocityX(0); p.play('brad_idle',true);}
    if((c.up.isDown||this.keyZ.isDown||this.keySpace.isDown||this._mobileJump)&&p.body.touching.down){ AudioMgr.play('jump'); p.setVelocityY(jump); }

    this._drawSky();
    this.clouds.children.iterate(c=>{ c._x-=c._speed; if(c._x<-200)c._x=1600+200; c.setX(c._x); });
  }

  _drawSky(){
    const g=this.bg; g.clear(); const W=1600,H=900;
    const top=Phaser.Display.Color.GetColor(20,30,60);
    const mid=Phaser.Display.Color.GetColor(40,80,130);
    const bot=Phaser.Display.Color.GetColor(60,110,160);
    g.fillGradientStyle(top,top,mid,mid,1); g.fillRect(0,0,W,H*0.7);
    g.fillStyle(bot,1); g.fillRect(0,H*0.7,W,H*0.3);
  }
  _onLand(){ if(!this.landed){ AudioMgr.play('land_heavy',0.7); this.landed=true; } }
  _initBradAnims(){
    if(this.anims.exists('brad_idle')) return;
    this.anims.create({key:'brad_idle',frames:this.anims.generateFrameNumbers('brad',{start:0,end:3}),frameRate:6,repeat:-1});
    this.anims.create({key:'brad_walk',frames:this.anims.generateFrameNumbers('brad',{start:4,end:7}),frameRate:10,repeat:-1});
    this.anims.create({key:'brad_jump',frames:this.anims.generateFrameNumbers('brad',{start:8,end:11}),frameRate:10,repeat:-1});
  }

  _setupMobile(){
    const ui=document.getElementById('mobile-ui'); if(!ui)return;
    ui.classList.remove('hidden'); this._mobileJump=false;
    const jump=document.getElementById('btn-jump');
    jump.addEventListener('touchstart',()=>{this._mobileJump=true;});
    jump.addEventListener('touchend',()=>{this._mobileJump=false;});
  }
}

/* === Configuration Phaser === */
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 600,
  pixelArt: true,
  transparent: true,
  physics: { default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [PreloadScene, IntroScene, MenuScene, DifficultyScene, BootScene, GameIntroScene]
});
