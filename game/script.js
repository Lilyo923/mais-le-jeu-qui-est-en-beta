/* ========= Brad Bitt — Level 1-0 (Phaser 3) ========= */
/* Style & clés compatibles avec ton menu Alpha 2.2 */

const SAVE_KEY='bradBittSave';
const SETTINGS_KEY='gameSettings';
const COLORS={cyan:'#32C0C1',pink:'#F53098',white:'#FFFFFF',grey:'#888888',gold:'#FFD700'};

/* ---------- Settings helpers (compatibles menu) ---------- */
function getSettings(){
  const s=localStorage.getItem(SETTINGS_KEY);
  if(s){ try{ return JSON.parse(s); }catch(e){} }
  const d={difficulty:'Normal',music:true,sfx:true};
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(d));
  return d;
}
function setSettings(v){ localStorage.setItem(SETTINGS_KEY,JSON.stringify(v)); }
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
function resetSave(){ localStorage.removeItem(SAVE_KEY); }
function setSave(obj){ localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); }

/* ---------- Audio Manager (sons unifiés) ---------- */
class AudioMgr{
  static scene=null;
  static init(scene){ this.scene=scene; }
  static play(key, vol=0.9){ const s=getSettings(); if(s.sfx && this.scene) this.scene.sound.play(key,{volume:vol}); }
  static music=null;
  static playMusic(key, vol=0.6){
    const s=getSettings(); if(!s.music||!this.scene) return;
    if(this.music) { this.music.stop(); this.music.destroy(); }
    this.music=this.scene.sound.add(key,{volume:vol,loop:true});
    this.music.play();
  }
  static setMusicEnabled(v){ const s=getSettings(); s.music=v; setSettings(s); if(!v&&this.music){ this.music.stop(); } }
  static setSfxEnabled(v){ const s=getSettings(); s.sfx=v; setSettings(s); }
}

/* ---------- Scène de boot / préchargement ---------- */
class BootScene extends Phaser.Scene{
  constructor(){ super('BootScene'); }
  preload(){
    const t=this.add.text(400,560,'Chargement',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5,1);
    let d=0; this.time.addEvent({delay:350,loop:true,callback:()=>{d=(d+1)%4; t.setText('Chargement'+'.'.repeat(d));}});
    // SFX (mêmes clés que ton menu)
    ['click','hover','open','poweroff','start','continue','back',
     'jump','land_heavy','wind_whoosh','punch','stomp_hit','clong_helmet',
     'enemy_hurt','spikes_toggle_on','spikes_toggle_off','timer_tick',
     'pause_on','pause_off'
    ].forEach(k=> this.load.audio(k, `assets/sfx/${k}.wav`));
    // Musique (mets ton fichier ici si tu veux qu'elle joue à l’atterrissage)
    this.load.audio('level1_intro_theme','assets/music/level1_intro_theme.mp3');
    // Sprite joueur (optionnel : sinon placeholder)
    this.load.spritesheet('brad','assets/img/player/brad_48x48.png',{ frameWidth:48, frameHeight:48 });
    this.load.once('complete',()=> this.scene.start('DifficultyScene'));
  }
  create(){ AudioMgr.init(this); }
}

/* ---------- Choix de difficulté avant de jouer ---------- */
class DifficultyScene extends Phaser.Scene{
  constructor(){ super('DifficultyScene'); }
  create(){
    AudioMgr.init(this);
    const s=getSettings();
    const overlay=this.add.rectangle(400,300,800,600,0x000000,0.35);
    const panel=this.add.rectangle(400,300,460,240,0x0b0b0f,0.98).setStrokeStyle(2,0xffffff).setOrigin(0.5);
    const title=this.add.text(400,240,'CHOISIS LA DIFFICULTÉ',{fontFamily:'"Press Start 2P"',fontSize:'14px',color:COLORS.cyan}).setOrigin(0.5);
    const opts=['Facile','Normal','Difficile'];
    let x=400-150;
    opts.forEach((label,i)=>{
      const btn=this.add.text(x,300,label,{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setOrigin(0.5).setInteractive({useHandCursor:true});
      btn.on('pointerover',()=>{AudioMgr.play('hover',0.7); btn.setColor(COLORS.gold);});
      btn.on('pointerout',()=>btn.setColor('#fff'));
      btn.on('pointerdown',()=>{
        AudioMgr.play('click');
        const st=getSettings(); st.difficulty=label; setSettings(st);
        this.tweens.add({targets:[overlay,panel,title,btns],alpha:0,duration:400,onComplete:()=>this.scene.start('GameIntroScene')});
      });
      x+=150;
    });
    const btns=this.add.text(400,360,'Appuie pour lancer le niveau 1-0',{fontFamily:'"Press Start 2P"',fontSize:'10px',color:'#ccc'}).setOrigin(0.5);
  }
}

/* ---------- Scène de jeu : intro chute + niveau + fin ---------- */
class GameIntroScene extends Phaser.Scene{
  constructor(){ super('GameIntroScene'); }

  create(){
    AudioMgr.init(this);
    // Monde
    const W=4000, H=2400; // hauteur suffisante pour chute + niveau horizontal
    this.physics.world.setBounds(0,-H, W, H+800);
    // Fond gradient (noir -> bleu)
    this.bg = this.add.graphics().setScrollFactor(0);
    this._drawSky(0);

    // Nuages générés (parallax), pas d’assets
    this.cloudsFar = this._spawnClouds(8, 0.15, 0xFFFFFF, 0.22);
    this.cloudsMid = this._spawnClouds(8, 0.30, 0xFFFFFF, 0.28);
    this.cloudsNear= this._spawnClouds(6, 0.50, 0xFFFFFF, 0.35);

    // Sol et plateformes
    this.platforms = this.physics.add.staticGroup();
    // Sol herbe à y=0
    this.platforms.create(800, 0, null).setDisplaySize(1600, 24).refreshBody(); // bloc statique invisible (hitbox)
    // Plateformes volantes à droite (après le puzzle)
    const baseX=1900, gap=180;
    [0,1,2,3].forEach(i=>{
      const p=this.platforms.create(baseX+i*gap, -80 - i*30, null).setDisplaySize(120, 18).refreshBody();
      p.isFloating=true;
    });

    // Spikes bloquant une des plateformes
    this.spikes = this.physics.add.staticGroup();
    const spikesBlock=this.spikes.create(baseX+gap, -110, null).setData('enabled', true).setDisplaySize(110,18).refreshBody();

    // Bouton temporisé sur un "arbre" plus loin
    this.buttons = this.physics.add.staticGroup();
    const timerButton = this.buttons.create(2400, -20, null).setData({mode:'timer', duration:5, target:spikesBlock}).refreshBody();

    // Arène combats encore à droite
    const arenaX=3000;
    this.platforms.create(arenaX+200, 0, null).setDisplaySize(900, 24).refreshBody();

    // Ennemis (placeholder blocs)
    this.enemies = this.physics.add.group({allowGravity:true, immovable:false});
    const e1=this._spawnEnemy(arenaX+260,-40,'basic');   // ROUGE (stomp)
    const e2=this._spawnEnemy(arenaX+520,-40,'helmet');  // BLEU (action)

    // Joueur
    const hasBrad = this.textures.exists('brad');
    const startY = -1800; // haut du ciel
    if(hasBrad){
      this.player = this.physics.add.sprite(200, startY, 'brad', 0);
      this._initBradAnims();
    }else{
      this.player = this.physics.add.rectangle(200, startY, 32, 48, 0xffffff);
    }
    this.player.setCollideWorldBounds(true);

    // Physique / collisions
    this.physics.add.collider(this.player, this.platforms, this._onLand, null, this);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.enemies);
    // Spikes = dégâts si actifs
    this.physics.add.overlap(this.player, this.spikes, (pl, sp)=>{
      if(sp.getData('enabled')) this._onPlayerHurt();
    });

    // Inputs
    this.cursors=this.input.keyboard.createCursorKeys();
    this.keyZ=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.keyE=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyP=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keySpace=this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Caméra suiveuse
    this.cameras.main.setBounds(0,-H, W, H+600);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // États
    this.state='intro_fall'; // intro_fall -> intro_land -> intro_getup -> play
    this.timeFromStart=0;
    this.landed=false;
    this.introFallDuration=10000; // ~10s
    this.physics.world.gravity.y = 1200;

    // Tutoriel (gating / hints)
    this.hint = this.add.text(0,0,'',{fontFamily:'"Press Start 2P"',fontSize:'12px',color:'#fff'}).setScrollFactor(0).setOrigin(0.5);
    this.hint.setPosition(400, 80).setAlpha(0);

    this.tutorialStage=0; // 0: move, 1: jump, 2: interact, 3: combat
    this.mobileUI = document.getElementById('mobile-ui');
    this.btnJump  = document.getElementById('btn-jump');
    this.btnAction= document.getElementById('btn-action');
    this.btnPause = document.getElementById('btn-pause');
    this.mobileJump=false; this.mobileAction=false;

    // Mobile buttons handlers
    this.btnJump.addEventListener('touchstart', ()=>{ this.mobileJump=true; this.btnJump.style.transform='scale(0.96)'; }, {passive:true});
    this.btnJump.addEventListener('touchend', ()=>{ this.mobileJump=false; this.btnJump.style.transform=''; }, {passive:true});
    this.btnAction.addEventListener('touchstart', ()=>{ this.mobileAction=true; this.btnAction.style.transform='scale(0.96)'; }, {passive:true});
    this.btnAction.addEventListener('touchend', ()=>{ this.mobileAction=false; this.btnAction.style.transform=''; }, {passive:true});
    this.btnPause.addEventListener('click', ()=> this._openPause());

    // Afficher bouton pause tout de suite
    this.mobileUI.classList.remove('hidden');
    this.btnPause.style.display='block';
    this.btnJump.style.display='none';
    this.btnAction.style.display='none';

    // SFX de départ (chute)
    AudioMgr.play('wind_whoosh',0.6);

    // Timer de fin de chute : si pas posé après 10s, on le place
    this.time.delayedCall(this.introFallDuration, ()=>{
      if(this.state==='intro_fall'){ this.player.setVelocityY(0); this.player.y = 0 - 30; } // proche du sol
    });

    // Colliders spécifiques combat (stomp / action)
    this.physics.add.overlap(this.player, this.enemies, (pl, en)=>{
      // Stomp si descend et contact par le haut
      if(pl.body.velocity.y > 100 && pl.body.bottom <= en.body.top + 10 && en.getData('type')==='basic'){
        en.setData('dead', true); en.setVelocity(0,0); en.disableBody(true,true);
        AudioMgr.play('stomp_hit');
        pl.setVelocityY(-320);
      }else{
        // Si helmet sinon, on blesse le joueur (si pas en action)
        if(this.actioning && en.getData('type')==='helmet'){
          en.setData('dead', true); en.disableBody(true,true);
          AudioMgr.play('enemy_hurt');
        }else{
          this._onPlayerHurt();
        }
      }
    });
  }

  /* ---- Update boucle ---- */
  update(time, delta){
    this.timeFromStart += delta;

    // Animer ciel (noir -> bleu sur ~3s puis léger cycle)
    const t = Math.min(1, this.timeFromStart/3000);
    this._drawSky(t);

    // Bouger nuages (parallax)
    this._tickClouds(this.cloudsFar,  10*delta/1000);
    this._tickClouds(this.cloudsMid,  20*delta/1000);
    this._tickClouds(this.cloudsNear, 35*delta/1000);

    // Intro states
    if(this.state==='intro_fall'){
      // rien de spécial, la gravité fait tomber
    }else if(this.state==='intro_land'){
      // Attendre petite anim "get up"
    }else if(this.state==='intro_getup'){
      // court délai déjà géré via timers
    }else if(this.state==='play'){
      this._handleInputs(delta);
      this._updateHints();
    }

    // Position du hint UI
    this.hint.setPosition(400, 80);
  }

  /* ---- Sky & clouds ---- */
  _drawSky(t){
    this.bg.clear();
    // lerp noir -> bleu graduel
    const top   = Phaser.Display.Color.Interpolate.ColorWithColor({r:11,g:11,b:15},{r:32,g:78,b:156},100,t*100);
    const mid   = Phaser.Display.Color.Interpolate.ColorWithColor({r:18,g:18,b:23},{r:76,g:140,b:210},100,t*100);
    const bot   = Phaser.Display.Color.Interpolate.ColorWithColor({r:10,g:10,b:13},{r:40,g:96,b:176},100,t*100);
    const g=this.bg;
    const w=this.scale.width, h=this.scale.height;
    // peindre 3 bandes verticales
    g.fillStyle(Phaser.Display.Color.GetColor(top.r,top.g,top.b),1); g.fillRect(0,0,w,h*0.4);
    g.fillStyle(Phaser.Display.Color.GetColor(mid.r,mid.g,mid.b),1); g.fillRect(0,h*0.4,w,h*0.35);
    g.fillStyle(Phaser.Display.Color.GetColor(bot.r,bot.g,bot.b),1); g.fillRect(0,h*0.75,w,h*0.25);
  }
  _spawnClouds(n,sf,color,alpha){
    const g = this.add.group();
    for(let i=0;i<n;i++){
      const c=this.add.graphics().setScrollFactor(0);
      c.fillStyle(color,alpha);
      const x=Phaser.Math.Between(0,800), y=Phaser.Math.Between(20,300);
      c.fillEllipse(x,y,Phaser.Math.Between(110,200),Phaser.Math.Between(40,80));
      c.fillEllipse(x+Phaser.Math.Between(40,90),y+Phaser.Math.Between(-10,20),Phaser.Math.Between(90,160),Phaser.Math.Between(35,70));
      c._speed = sf; c._x=x; c._y=y;
      g.add(c);
    }
    return g;
  }
  _tickClouds(group, spd){
    group.children.iterate(c=>{
      c._x -= spd*c._speed;
      if(c._x < -220) c._x = 800+220;
      c.setX(c._x);
    });
  }

  /* ---- Player / land / states ---- */
  _onLand = ()=>{
    if(this.landed) return;
    this.landed=true;
    AudioMgr.play('land_heavy',0.8);
    // Démarre musique à l’atterrissage
    AudioMgr.playMusic('level1_intro_theme', 0.28);
    this.state='intro_land';
    // petite anim "get up"
    this.time.delayedCall(800, ()=>{
      this.state='intro_getup';
      this.time.delayedCall(200, ()=>{
        this.state='play';
        this._showHint('Avance → / ←', true);
        // Dévoile bouton pause mobile, cache saut/action pour l’instant
        this.btnPause.style.display='block';
        this.btnJump.style.display='none';
        this.btnAction.style.display='none';
      });
    });
  }

  /* ---- Inputs & gameplay ---- */
  _handleInputs(delta){
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;

    const left = this.cursors.left.isDown;
    const right= this.cursors.right.isDown;
    const jumpKey = this.cursors.up.isDown || this.keyZ.isDown || this.keySpace.isDown || this.mobileJump;
    const actKey  = this.keyE.isDown || this.mobileAction;

    const speed = 200;
    if(left){ this.player.setVelocityX(-speed); }
    else if(right){ this.player.setVelocityX(speed); }
    else { this.player.setVelocityX(0); }

    if(jumpKey && onGround){
      this.player.setVelocityY(-420);
      AudioMgr.play('jump',0.8);
    }

    // Interaction (bouton sol / porte / coup de poing)
    this.actioning = false;
    if(actKey){
      this.actioning = true;
      // Bouton sol à portée ?
      const nearBtn = this._getNearbyButton(40);
      if(nearBtn){
        this._activateButton(nearBtn);
      }
      // Porte finale ?
      if(this._nearGoalDoor()){
        this._finishLevel();
      }
      // Coup de poing = géré dans overlap ennemis (helmet)
    }

    // Progression tutoriel (zones x)
    if(this.tutorialStage===0 && Math.abs(this.player.body.velocity.x)>0){
      this.tutorialStage=1;
      this._showHint('Saute (ESPACE / Z)', true);
      this.btnJump.style.display='block';
    }
    if(this.tutorialStage===1 && this.player.y<-200){ // a sauté / pris de la hauteur
      this.tutorialStage=2;
      this._showHint('Interagis (E)', true);
      this.btnAction.style.display='block';
    }
    // Puzzle spikes : une fois pics franchis, passer à combat
    if(this.tutorialStage===2 && this.player.x>2600){
      this.tutorialStage=3;
      this._showHint('Combat : saute sur ROUGE / Action sur BLEU', true);
    }
  }

  _getNearbyButton(dist){
    let found=null;
    this.buttons.children.iterate(b=>{
      if(found) return;
      const dx = Math.abs((b.x)-(this.player.x));
      const dy = Math.abs((b.y)-(this.player.y));
      if(dx<dist && dy<40) found=b;
    });
    return found;
  }
  _activateButton(btn){
    const data=btn.getData();
    const target=data.target;
    if(!target) return;
    // Désactive spikes
    if(target.getData('enabled')){
      target.setData('enabled',false);
      AudioMgr.play('spikes_toggle_off',0.7);
      // Timer ?
      if(data.mode==='timer'){
        let remain=data.duration||5;
        const tick = this.time.addEvent({delay:1000,repeat:remain-1,callback:()=>{ AudioMgr.play('timer_tick',0.7); }});
        this._showHint(`Ouvert (${remain}s)`, false);
        this.time.delayedCall(remain*1000, ()=>{
          target.setData('enabled',true);
          AudioMgr.play('spikes_toggle_on',0.7);
          this._showHint('Les pics sont revenus !', false);
        });
      }else{
        this._showHint('Passage ouvert', false);
      }
    }
  }

  _nearGoalDoor(){
    // Porte spéciale en fin de zone arène
    const x=this.player.x;
    return x>3700; // zone "porte"
  }
  _finishLevel(){
    // Narrateur + pop + sauvegarde
    this._showHint('« Tu es prêt. »', false);
    setSave({difficulty:getSettings().difficulty, level:'1-0', checkpoint:'end', settings:getSettings()});
    this.time.delayedCall(900, ()=>{
      this._openQuitConfirm(true); // renvoyer au menu / fin (ici on propose Quitter)
    });
  }

  _onPlayerHurt(){
    // simple knockback
    this.player.setVelocityY(-240);
    this.player.setVelocityX((Math.random()<0.5?-1:1)*180);
  }

  /* ---- Ennemis placeholders ---- */
  _spawnEnemy(x,y,type){
    const en=this.enemies.create(x,y,null);
    en.setData('type', type);
    en.setSize(32,32).setBounce(0.1).setCollideWorldBounds(true);
    en.setVelocityX( type==='basic' ? -40 : 40 );
    // teinte couleur
    en.setTintFill(type==='helmet' ? 0x2a7dff : 0xff2a2a);
    return en;
  }

  /* ---- UI / Hints ---- */
  _showHint(txt, blink){
    this.hint.setText(txt);
    this.tweens.killTweensOf(this.hint);
    this.hint.setAlpha(0);
    this.tweens.add({targets:this.hint, alpha:1, yoyo: blink?true:false, repeat: blink? -1:0, duration:900, ease:'sine.inOut'});
  }

  /* ---- Pause & Quit ---- */
  _openPause(){
    AudioMgr.play('pause_on',0.8);
    this.scene.pause();
    const overlay=document.createElement('div'); overlay.className='popup-overlay';
    const root=document.createElement('div'); root.className='popup';
    root.innerHTML=`
      <h3>PAUSE</h3>
      <div class="row">
        <button class="btn" data-act="resume">REPRENDRE</button>
        <button class="btn" data-act="music">${getSettings().music?'MUSIQUE: ON':'MUSIQUE: OFF'}</button>
        <button class="btn" data-act="sfx">${getSettings().sfx?'EFFETS: ON':'EFFETS: OFF'}</button>
        <button class="btn warning" data-act="quit">QUITTER</button>
      </div>
      <div class="caption">Toute progression non sauvegardée sera perdue</div>
    `;
    overlay.appendChild(root);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e)=>{
      const btn = e.target.closest('.btn');
      if(!btn) return;
      const act=btn.getAttribute('data-act');
      AudioMgr.play('click',0.9);
      if(act==='resume'){
        document.body.removeChild(overlay); this.scene.resume(); AudioMgr.play('pause_off',0.8);
      }
      if(act==='music'){ const s=getSettings(); s.music=!s.music; setSettings(s); btn.textContent=s.music?'MUSIQUE: ON':'MUSIQUE: OFF'; if(!s.music&&AudioMgr.music){AudioMgr.music.stop();} }
      if(act==='sfx'){ const s=getSettings(); s.sfx=!s.sfx; setSettings(s); btn.textContent=s.sfx?'EFFETS: ON':'EFFETS: OFF';}
      if(act==='quit'){ document.body.removeChild(overlay); this._openQuitConfirm(false); }
    }, {once:false});
  }

  _openQuitConfirm(fromFinish){
    const overlay=document.createElement('div'); overlay.className='popup-overlay';
    const root=document.createElement('div'); root.className='popup';
    root.innerHTML=`
      <h3 style="color:${COLORS.pink}">ATTENTION</h3>
      <p>Toute progression non sauvegardée sera supprimée.</p>
      <div class="row">
        <button class="btn" data-act="cancel">RETOUR</button>
        <button class="btn warning" data-act="confirm">QUITTER</button>
      </div>
    `;
    overlay.appendChild(root);
    document.body.appendChild(overlay);
    overlay.addEventListener('click',(e)=>{
      const btn=e.target.closest('.btn'); if(!btn) return;
      AudioMgr.play('click',0.9);
      if(btn.getAttribute('data-act')==='cancel'){ document.body.removeChild(overlay); if(!fromFinish) this.scene.resume(); }
      else{
        // Ici tu peux rediriger vers ton menu racine si tu le souhaites (document.location='../index.html')
        document.body.removeChild(overlay);
        // Reset et recharger la scène de difficulté
        this.scene.stop(); this.scene.start('DifficultyScene');
      }
    });
  }

  /* ---- Anims joueur ---- */
  _initBradAnims(){
    if(this.anims.exists('brad_idle')) return;
    this.anims.create({ key:'brad_idle', frames:this.anims.generateFrameNumbers('brad',{start:0,end:3}), frameRate:6, repeat:-1});
    this.anims.create({ key:'brad_walk', frames:this.anims.generateFrameNumbers('brad',{start:4,end:7}), frameRate:10, repeat:-1});
    this.anims.create({ key:'brad_jump', frames:this.anims.generateFrameNumbers('brad',{start:8,end:11}), frameRate:10, repeat:-1});
    this.player.play('brad_idle');
  }
}

/* ---------- Config Phaser ---------- */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent:'game-container',
  width: 800, height: 600,
  pixelArt: true, transparent:true,
  physics:{ default:'arcade', arcade:{ gravity:{y:0}, debug:false } },
  scale:{ mode:Phaser.Scale.FIT, autoCenter:Phaser.Scale.CENTER_BOTH },
  scene:[BootScene, DifficultyScene, GameIntroScene]
});
