class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // ----- Titre -----
        this.add.text(400, 120, 'BRAD BITT', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '32px',
            color: '#FFD700'
        }).setOrigin(0.5);

        // ----- Boutons -----
        const newGame = this.add.text(400, 300, 'NOUVELLE PARTIE', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#FFFFFF'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const continueGame = this.add.text(400, 360, 'CONTINUER', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        // ----- Vérification sauvegarde -----
        const hasSave = localStorage.getItem('bradBittSave');
        if (hasSave) {
            continueGame.setColor('#FFFFFF');
            continueGame.setInteractive({ useHandCursor: true });
        }

        // ----- Animation d’entrée -----
        this.tweens.add({
            targets: [newGame, continueGame],
            alpha: { from: 0, to: 1 },
            y: '+=10',
            ease: 'Power2',
            duration: 1000,
            delay: this.tweens.stagger(200)
        });

        // ----- Actions -----
        newGame.on('pointerdown', () => {
            localStorage.removeItem('bradBittSave'); // reset sauvegarde
            alert('Nouvelle partie lancée ! (ici on chargera le niveau 1)');
        });

        continueGame.on('pointerdown', () => {
            if (hasSave) {
                alert('Chargement de la partie sauvegardée...');
            }
        });

        // ----- Version -----
        this.add.text(20, 570, 'Version Alpha 1.0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#888'
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    parent: 'game-container',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene]
};

const game = new Phaser.Game(config);
