/* ========= Brad Bitt — Alpha 2.2 ========= */
const COLORS={cyan:'#32C0C1',pink:'#F53098',white:'#FFFFFF',grey:'#888888',gold:'#FFD700'};
const SAVE_KEY='bradBittSave';
const SETTINGS_KEY='gameSettings';
function getSettings(){const s=localStorage.getItem(SETTINGS_KEY);
  if(s)try{return JSON.parse(s);}catch(e){}
  const d={difficulty:'Normal',music:true,sfx:true};
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(d));return d;}
function setSettings(v){localStorage.setItem(SETTINGS_KEY,JSON.stringify(v));}

/* ----- PRELOAD ----- */
class PreloadScene extends Phaser.Scene{
  constructor(){super('PreloadScene');}
  preload(){
    const t=this.add.text(790,585,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff'}).setOrigin(1,1);
    let d=0;this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4;t.setText('Chargement'+'.'.repeat(d));}});
    ['click','hover','open','poweroff','start','continue','back'].forEach(v=>this.load.audio(v,`assets/sounds/${v}.wav`));
    this.load.once('complete',()=>this.time.delayedCall(300,()=>this.scene.start('IntroScene')));
  }
}

/* ----- INTRO ----- */
class IntroScene extends Phaser.Scene{
  constructor(){super('IntroScene');}
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
    if(s.sfx)this.sound.play('open',{volume:0.8});
    this.tweens.add({targets:[L,R],alpha:1,scale:{from:0.9,to:1},duration:800,ease:'sine.out'});
    this.time.delayedCall(2300,()=>{
      if(getSettings().sfx)this.sound.play('poweroff',{volume:0.9});
      this.tweens.add({targets:[L,R],scaleY:0.05,alpha:0.8,duration:500,ease:'quad.in',
        onComplete:()=>{L.destroy();R.destroy();this.time.delayedCall(400,onDone);}});
    });
  }
}

/* ----- MENU ----- */
class MenuScene extends Phaser.Scene{
  constructor(){super('MenuScene');}
  create(){
    const s=getSettings(),play=(k)=>{if(s.sfx)this.sound.play(k,{volume:0.9});};
    const title=this.add.text(400,110,'BRAD BITT',{fontFamily:'"Press Start 2P"',fontSize:'36px',color:COLORS.gold,stroke:'#fff',strokeThickness:2})
      .setOrigin(0.5).setAlpha(0);
    this.tweens.add({targets:title,alpha:1,scale:{from:0.9,to:1},duration:600});
    this.add.text(400,155,'mais le jeu',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.white}).setOrigin(0.5);

    const data=[
      {label:'NOUVELLE PARTIE',id:'new'},
      {label:'CONTINUER',id:'continue',disabled:!localStorage.getItem(SAVE_KEY)},
      {label:'OPTIONS',id:'options'},
      {label:'CREDITS',id:'credits'}
    ];

    const arrow=this.add.text(0,0,'▶',{fontFamily:'"Press Start 2P"',fontSize:'16px',color:'#fff'}).setVisible(false);
    let y=250;
    data.forEach((e)=>{
      const col=e.disabled?COLORS.grey:COLORS.white;
      const t=this.add.text(400,y,e.label,{fontFamily:'"Press Start 2P"',fontSize:'16px',color:col}).setOrigin(0.5);
      y+=50;
      if(!e.disabled){
        t.setInteractive({useHandCursor:true});
        t.on('pointerover',()=>{
          if(getSettings().sfx)this.sound.play('hover',{volume:0.7});
          t.setColor(COLORS.gold);
          arrow.setPosition(t.x-t.displayWidth/2-22,t.y+1).setVisible(true);
        });
        t.on('pointerout',()=>{t.setColor(COLORS.white);arrow.setVisible(false);});
        t.on('pointerdown',()=>{if(getSettings().sfx)this.sound.play('click');this._onSelect(e.id);});
      }
    });

    this.add.text(20,580,'Version Alpha 2.1.1',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(0,1);
    this.add.text(780,580,'by IMAGINe Studio',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#aaa'}).setOrigin(1,1);
    this._buildOptions();this._buildCredits();
  }

  _onSelect(id){
    const p=(k)=>{if(getSettings().sfx)this.sound.play(k,{volume:0.9});};
    if(id==='new'){p('start');localStorage.removeItem(SAVE_KEY);alert('Nouvelle partie (niveau 1-0)');}
    if(id==='continue'&&localStorage.getItem(SAVE_KEY)){p('continue');alert('Chargement partie…');}
    if(id==='options')this._toggleOptions(true);
    if(id==='credits')this._toggleCredits(true);
  }

  /* ---- OPTIONS ---- */
  _buildOptions(){
    const s=getSettings(),cx=400,cy=300,p=(k)=>{if(getSettings().sfx)this.sound.play(k,{volume:0.8});};
    this.optOverlay=this.add.rectangle(400,300,800,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-190,cy-130,380,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-190,cy-130,380,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'OPTIONS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5).setVisible(false);

    // difficulté
    const diffLab=this.add.text(cx-130,cy-45,'Difficulté',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0,0.5).setVisible(false);
    const diffVal=this.add.text(cx+60,cy-45,s.difficulty,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const L=this.add.text(cx-10,cy-45,'<',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const R=this.add.text(cx+130,cy-45,'>',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    const diffs=['Facile','Normal','Difficile'],setD=d=>{const s=getSettings();s.difficulty=d;setSettings(s);diffVal.setText(d);};
    L.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+2)%3]);});
    R.on('pointerdown',()=>{p('click');setD(diffs[(diffs.indexOf(getSettings().difficulty)+1)%3]);});

    // sons
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

  /* ---- CREDITS ---- */
  _buildCredits(){
    const cx=400,cy=300,p=(k)=>{if(getSettings().sfx)this.sound.play(k,{volume:0.8});};
    this.credOverlay=this.add.rectangle(400,300,800,600,0x000000,0.4).setVisible(false).setInteractive();
    const g=this.add.graphics().fillStyle(0x0b0b0f,0.95).fillRoundedRect(cx-210,cy-130,420,260,10)
      .lineStyle(2,0xffffff).strokeRoundedRect(cx-210,cy-130,420,260,10).setVisible(false);
    const title=this.add.text(cx,cy-100,'CREDITS',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.pink}).setOrigin(0.5).setVisible(false);
    const text=this.add.text(cx,cy-25,"Site imaginé par Brad Bitt.\n Musique: Échantillons créés par Mixvibes,\nassemblés par Lilyo.",{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#fff',align:'center'})
      .setOrigin(0.5).setVisible(false);
    const back=this.add.text(cx,cy+95,'RETOUR',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive().setVisible(false);
    back.on('pointerover',()=>back.setColor(COLORS.gold));
    back.on('pointerout',()=>back.setColor('#fff'));
    back.on('pointerdown',()=>{p('back');this._toggleCredits(false);});
    this.credElems=[g,title,text,back];
  }
  _toggleCredits(v){this.credOverlay.setVisible(v);this.credElems.forEach(e=>e.setVisible(v));}
}

/* ----- CONFIG ----- */
new Phaser.Game({
  type:Phaser.AUTO,parent:'game-container',width:800,height:600,
  transparent:true,pixelArt:true,
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
  scene:[PreloadScene,IntroScene,MenuScene]
});
