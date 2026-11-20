/**
 * VORLAGE 2D – "Sternen-Jäger" mit Phaser 4
 *
 * Zeigt die wichtigsten Bausteine eines 2D-Spiels:
 *  - Spielfigur mit Tastatursteuerung (Arcade-Physik)
 *  - Einsammeln (overlap) und Gegner, die abprallen
 *  - Punkte, Highscore, Game Over, Neustart
 *  - Partikel, Kamera-Wackeln, Sounds
 *
 * Für ein neues Spiel: diesen Ordner kopieren und dann umbauen.
 */
import Phaser from "phaser";
import "../../src/styles.css";
import { emojiTexture } from "../../src/lib/emoji.ts";
import { getHighscore, saveHighscore } from "../../src/lib/highscore.ts";
import { addBackLink } from "../../src/lib/page.ts";
import { sfx } from "../../src/lib/sfx.ts";

const GAME_ID = "sternen-jaeger";
const WIDTH = 960;
const HEIGHT = 640;
const PLAYER_SPEED = 320;

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private star!: Phaser.Physics.Arcade.Image;
  private enemies!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private sparkles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private scoreText!: Phaser.GameObjects.Text;
  private score = 0;
  private gameOver = false;

  constructor() {
    super("main");
  }

  create() {
    this.score = 0;
    this.gameOver = false;

    // Grafiken aus Emojis – keine Bilddateien nötig.
    emojiTexture(this, "player", "🚀", 56);
    emojiTexture(this, "star", "⭐", 40);
    emojiTexture(this, "enemy", "👾", 48);
    emojiTexture(this, "sparkle", "✨", 24);

    this.createStarfield();

    this.player = this.physics.add.sprite(WIDTH / 2, HEIGHT / 2, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setCircle(24, 11, 11);

    this.star = this.physics.add.image(0, 0, "star");
    this.moveStarToRandomPlace();
    this.tweens.add({ targets: this.star, scale: 1.2, yoyo: true, repeat: -1, duration: 400 });

    this.enemies = this.physics.add.group();
    this.spawnEnemy();

    this.sparkles = this.add.particles(0, 0, "sparkle", {
      speed: { min: 80, max: 260 },
      lifespan: 600,
      scale: { start: 1, end: 0 },
      emitting: false,
    });

    // overlap = nur erkennen, dass sich zwei Dinge berühren (ohne sie wegzuschieben)
    this.physics.add.overlap(this.player, this.star, () => this.collectStar());
    this.physics.add.overlap(this.player, this.enemies, () => this.hitEnemy());

    this.scoreText = this.add.text(WIDTH - 20, 16, "", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#ffffff",
    });
    this.scoreText.setOrigin(1, 0);
    this.updateScoreText();

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.input.keyboard!.on("keydown-SPACE", () => {
      if (this.gameOver) this.scene.restart();
    });
  }

  /** Wird ca. 60-mal pro Sekunde aufgerufen – das ist der "Game Loop". */
  update() {
    if (this.gameOver) return;

    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left.isDown) velocity.x = -1;
    if (this.cursors.right.isDown) velocity.x = 1;
    if (this.cursors.up.isDown) velocity.y = -1;
    if (this.cursors.down.isDown) velocity.y = 1;

    velocity.normalize().scale(PLAYER_SPEED);
    this.player.setVelocity(velocity.x, velocity.y);

    // Rakete in Flugrichtung drehen (das Emoji zeigt von Haus aus nach rechts oben → +45°).
    if (velocity.lengthSq() > 0) {
      this.player.setAngle(Phaser.Math.RadToDeg(velocity.angle()) + 45);
    }
  }

  private collectStar() {
    this.score += 1;
    this.updateScoreText();
    sfx.coin();
    this.sparkles.explode(16, this.star.x, this.star.y);
    this.moveStarToRandomPlace();

    // Alle 3 Sterne kommt ein neuer Gegner dazu → das Spiel wird schwerer.
    if (this.score % 3 === 0) this.spawnEnemy();
  }

  private hitEnemy() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.physics.pause();
    this.player.setTint(0xff4444);
    this.cameras.main.shake(300, 0.02);
    sfx.hit();
    sfx.gameOver();

    const isRecord = saveHighscore(GAME_ID, this.score);
    const message = isRecord
      ? `NEUER REKORD: ${this.score}! 🏆`
      : `Game Over – ${this.score} Sterne`;
    this.add
      .text(WIDTH / 2, HEIGHT / 2, `${message}\n\nLeertaste für neues Spiel`, {
        fontSize: "40px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);
  }

  private spawnEnemy() {
    // Gegner weit weg vom Spieler erscheinen lassen, damit es fair bleibt.
    const x = this.player.x < WIDTH / 2 ? WIDTH - 60 : 60;
    const y = Phaser.Math.Between(60, HEIGHT - 60);
    const enemy = this.enemies.create(x, y, "enemy") as Phaser.Physics.Arcade.Sprite;
    enemy.setCircle(20, 10, 10);
    enemy.setBounce(1);
    enemy.setCollideWorldBounds(true);
    const speed = 140 + this.score * 8;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private moveStarToRandomPlace() {
    this.star.setPosition(
      Phaser.Math.Between(60, WIDTH - 60),
      Phaser.Math.Between(80, HEIGHT - 60),
    );
  }

  private updateScoreText() {
    this.scoreText.setText(`⭐ ${this.score}   🏆 ${getHighscore(GAME_ID)}`);
  }

  private createStarfield() {
    for (let i = 0; i < 120; i++) {
      const dot = this.add.circle(
        Phaser.Math.Between(0, WIDTH),
        Phaser.Math.Between(0, HEIGHT),
        Phaser.Math.FloatBetween(0.5, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.9),
      );
      this.tweens.add({
        targets: dot,
        alpha: 0.1,
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(800, 2400),
      });
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#0b1026",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: WIDTH,
    height: HEIGHT,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: MainScene,
});

addBackLink();
