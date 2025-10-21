class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // ----- Titre -----
        this.add.text(400, 100, 'BRAD BITT', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '32px',
            color: '#FFD700'
        }).setOrigin(0.5);

        this.add.text(400, 150, 'mais le jeu', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: '#CCCCCC'
        }).setOrigin(0.5);

        // ----- Boutons -----
        const newGame = this.createMenuItem(400, 250, 'NOUVELLE PARTIE');
        const continueGame = this.createMenuItem(400, 300, 'CONTINUER', '#888888');
        const options = this.createMenuItem(400, 350, 'OPTIONS');
        const credits = this.createMenuItem(400, 400, 'CREDITS');

        // ----- Vérification sauvegarde -----
        const hasSave = localStorage.getItem('bradBittSave');
        if (hasSave) {
            continueGame.setColor('#FFFFFF');
            continueGame.setInteractive({ useHandCursor: true });
        }

        // ----- Animation d’entrée -----
        this.tweens.add({
            targets: [newGame, continueGame, options, credits],
            alpha: { from: 0, to: 1 },
            y: '+=10',
            ease: 'Power2',
            duration: 1000,
            delay: this.tweens.stagger(150)
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

        options.on('pointerdown', () => {
            alert('Menu Options à venir...');
        });

        credits.on('pointerdown', () => {
            alert('Crédits : Site imaginé par Brad Bitt. Musique : Mixvibes & Lilyo.');
        });

        // ----- Version + Studio -----
        this.add.text(20, 570, 'Version Alpha 1.0', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#888'
        });

        this.add.text(630, 570, 'by IMAGINe Studio', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#888'
        });
    }

    // Petite fonction utilitaire pour créer des boutons homogènes
    createMenuItem(x, y, label, color = '#FFFFFF') {
        const item = this.add.text(x, y, label, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '14px',
            color: color
        }).setOrigin(0.5);

        if (color !== '#888888') {
            item.setInteractive({ useHandCursor: true });
            item.on('pointerover', () => item.setColor('#FFD700'));
            item.on('pointerout', () => item.setColor('#FFFFFF'));
        }

        return item;
    }
}

// ----- Configuration Phaser -----
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
