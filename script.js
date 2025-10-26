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
    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
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

/* 6️⃣ Niveau 1-0 */
class GameIntroScene extends Phaser.Scene{
  constructor(){ super('GameIntroScene'); }
  create(){
    AudioMgr.init(this);
    const W=1600,H=900;
    this.physics.world.setBounds(0,0,W,H);
    this.physics.world.gravity.y=1000;

    // Ciel
    this.bg=this.add.graphics();
    this._drawSky();
    this.clouds=this.add.group();
    for(let i=0;i<8;i++){
      const c=this.add.graphics(); c.fillStyle(0xffffff,0.3);
      const x=Phaser.Math.Between(0,W), y=Phaser.Math.Between(30,250);
      c.fillEllipse(x,y,Phaser.Math.Between(100,180),Phaser.Math.Between(40,80));
      c._speed=Phaser.Math.FloatBetween(0.2,0.6); c._x=x; this.clouds.add(c);
    }

    // Sol
    const g=this.add.graphics();
    g.fillStyle(0x228B22,1); g.fillRect(0,780,W,20);
    g.fillStyle(0x8B4513,1); g.fillRect(0,
