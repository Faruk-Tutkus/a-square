import React, { useRef, useEffect } from 'react';
import Phaser from 'phaser';
import { GAME_DATA } from '../constants';
import { LevelConfig } from '../types';

interface GameCanvasProps {
    currentLevelId: number;
    levelDataOverride?: LevelConfig; // Support for custom level data from Editor
    isPaused: boolean;
    activeInputs: Set<string>;
    currentAmmo: number;
    onLevelComplete: (nextLevelId: number) => void;
    onPlayerDeath: () => void;
    onInfoTrigger: (text: string | null) => void;
    onAmmoConsumed: () => void;
    onKeyCollected: () => void;
    hasKey: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
    currentLevelId,
    levelDataOverride,
    isPaused, 
    activeInputs,
    currentAmmo,
    hasKey,
    onLevelComplete, 
    onPlayerDeath, 
    onInfoTrigger,
    onAmmoConsumed,
    onKeyCollected
}) => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<Phaser.Scene | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const inputsRef = useRef(activeInputs);
    const pausedRef = useRef(isPaused);
    const ammoRef = useRef(currentAmmo);
    const hasKeyRef = useRef(hasKey);

    useEffect(() => { inputsRef.current = activeInputs; }, [activeInputs]);
    useEffect(() => { ammoRef.current = currentAmmo; }, [currentAmmo]);
    useEffect(() => { hasKeyRef.current = hasKey; }, [hasKey]);
    
    useEffect(() => { 
        pausedRef.current = isPaused; 
        if (sceneRef.current) {
            if (isPaused) sceneRef.current.scene.pause();
            else sceneRef.current.scene.resume();
        }
    }, [isPaused]);

    useEffect(() => {
        if (!containerRef.current) return;

        class MainScene extends Phaser.Scene {
            add!: Phaser.GameObjects.GameObjectFactory;
            make!: Phaser.GameObjects.GameObjectCreator;
            physics!: Phaser.Physics.Arcade.ArcadePhysics;
            cameras!: Phaser.Cameras.Scene2D.CameraManager;
            input!: Phaser.Input.InputPlugin;
            tweens!: Phaser.Tweens.TweenManager;
            time!: Phaser.Time.Clock;
            scene!: Phaser.Scenes.ScenePlugin;

            player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            playerGraphics!: Phaser.GameObjects.Graphics;
            lightGraphics!: Phaser.GameObjects.Graphics;
            
            platforms!: Phaser.Physics.Arcade.StaticGroup;
            enemies!: Phaser.Physics.Arcade.Group;
            enemyBullets!: Phaser.Physics.Arcade.Group;
            
            boxes!: Phaser.Physics.Arcade.Group;
            buttons!: Phaser.Physics.Arcade.Group;
            doors!: Phaser.Physics.Arcade.StaticGroup;
            
            keys!: Phaser.Physics.Arcade.Group;
            bullets!: Phaser.Physics.Arcade.Group;
            particles!: Phaser.GameObjects.Particles.ParticleEmitter;
            
            portalParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
            portalGlow!: Phaser.GameObjects.Image;
            
            levelData: any;
            isDead: boolean = false;
            hasWeapon: boolean = false;
            isPortalLocked: boolean = false;
            
            cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
            keyZ!: Phaser.Input.Keyboard.Key;
            keySpace!: Phaser.Input.Keyboard.Key;
            
            jumpCount: number = 0;
            lastFired: number = 0;
            eyeOffset: number = 0;
            blinkTimer: number = 0;
            isBlinking: boolean = false;
            facingRight: boolean = true;
            
            coyoteTimer: number = 0;
            jumpBufferTimer: number = 0;
            
            playerScaleX: number = 1;
            playerScaleY: number = 1;
            wasOnFloor: boolean = false;
            
            lastInfoText: string | null = null;
            
            constructor() {
                super('MainScene');
            }

            preload() {
                this.generateTextures();
            }

            generateTextures() {
                // Platform Texture
                const g = this.make.graphics({x: 0, y: 0});
                g.fillStyle(0x111111);
                g.fillRect(0, 0, 32, 32);
                g.fillStyle(0x333333);
                g.fillRect(0, 0, 32, 2); 
                g.generateTexture('platform', 32, 32);

                // ENEMY BASIC
                g.clear();
                g.fillStyle(0x222222);
                g.beginPath();
                g.moveTo(16, 0);
                g.lineTo(32, 32);
                g.lineTo(0, 32);
                g.closePath();
                g.fillPath();
                g.generateTexture('enemy_basic', 32, 32);

                // ENEMY RANGED
                g.clear();
                g.fillStyle(0x222222); 
                g.beginPath();
                g.moveTo(16, 0);
                g.lineTo(32, 32);
                g.lineTo(0, 32);
                g.closePath();
                g.fillPath();
                g.fillStyle(0x00FFFF); // Cyan Eye
                g.fillCircle(16, 16, 5); 
                g.generateTexture('enemy_ranged', 32, 32);

                // ENEMY RAPID (Orange)
                g.clear();
                g.fillStyle(0x222222);
                g.beginPath();
                g.moveTo(16, 0);
                g.lineTo(32, 32);
                g.lineTo(0, 32);
                g.closePath();
                g.fillPath();
                g.fillStyle(0xFFA500); // Orange Eye
                g.fillCircle(16, 16, 5);
                g.lineStyle(2, 0xFFA500);
                g.beginPath();
                g.moveTo(16, 0);
                g.lineTo(16, 10); // Antenna
                g.strokePath();
                g.generateTexture('enemy_rapid', 32, 32);

                // ENEMY HUNTER
                g.clear();
                g.fillStyle(0x222222);
                g.beginPath();
                g.moveTo(16, 0);
                g.lineTo(32, 32);
                g.lineTo(0, 32);
                g.closePath();
                g.fillPath();
                g.fillStyle(0xFFFFFF);
                g.fillCircle(16, 18, 6);
                g.fillStyle(0xFF0000); 
                g.fillCircle(16, 18, 2);
                g.generateTexture('enemy_hunter', 32, 32);

                // ENEMY HEAVY
                g.clear();
                g.fillStyle(0x0a0a0a);
                g.beginPath();
                g.moveTo(24, 0); 
                g.lineTo(48, 48);
                g.lineTo(0, 48);
                g.closePath();
                g.fillPath();
                g.generateTexture('enemy_heavy', 48, 48);

                // BOX
                g.clear();
                g.fillStyle(0x222222);
                g.fillRect(0, 0, 32, 32);
                g.lineStyle(2, 0x666666);
                g.strokeRect(1, 1, 30, 30);
                g.lineStyle(2, 0x333333);
                g.beginPath();
                g.moveTo(4, 4);
                g.lineTo(28, 28);
                g.moveTo(28, 4);
                g.lineTo(4, 28);
                g.strokePath();
                g.generateTexture('box_push', 32, 32);

                // BUTTON
                g.clear();
                g.fillStyle(0xff0000, 0); 
                g.fillRect(0, 0, 32, 32); 
                g.fillStyle(0x666666);
                g.fillRect(0, 24, 32, 8); 
                g.fillStyle(0xAA3333);
                g.fillRect(4, 18, 24, 6); 
                g.generateTexture('button_up', 32, 32);

                // DOOR
                g.clear();
                g.fillStyle(0x222222);
                g.fillRect(0, 0, 32, 32);
                g.lineStyle(2, 0x555555);
                g.strokeRect(4, 4, 24, 24);
                g.generateTexture('door_closed', 32, 32);

                // KEY
                g.clear();
                g.fillStyle(0xFFFFFF);
                g.beginPath();
                g.moveTo(16, 4);
                g.lineTo(28, 16);
                g.lineTo(16, 28);
                g.lineTo(4, 16);
                g.closePath();
                g.fillPath();
                g.fillStyle(0x111111);
                g.fillCircle(16, 16, 4);
                g.generateTexture('key_item', 32, 32);

                // Bullet Player
                g.clear();
                g.fillStyle(0x000000);
                g.fillRect(0, 0, 12, 6);
                g.generateTexture('bullet', 12, 6);

                // Bullet Enemy (Cyan for Ranged, Red for others)
                g.clear();
                g.fillStyle(0xFF0000);
                g.fillCircle(5, 5, 5);
                g.generateTexture('enemy_bullet', 10, 10);
                
                g.clear();
                g.fillStyle(0x00FFFF);
                g.fillCircle(5, 5, 5);
                g.generateTexture('enemy_bullet_ranged', 10, 10);
                
                // Bullet Rapid
                g.clear();
                g.fillStyle(0xFFA500);
                g.fillRect(0, 0, 8, 4);
                g.generateTexture('enemy_bullet_rapid', 8, 4);

                // Dust
                g.clear();
                g.fillStyle(0x333333);
                g.fillRect(0, 0, 4, 4);
                g.generateTexture('dust', 4, 4);

                // Spark
                g.clear();
                g.fillStyle(0xFFFFFF);
                g.fillRect(0, 0, 3, 3);
                g.generateTexture('spark', 3, 3);

                // Glow
                g.clear();
                g.fillStyle(0xFFFFFF, 1);
                g.fillCircle(32, 32, 32);
                g.generateTexture('glow', 64, 64);
            }

            create() {
                this.physics.world.fixedStep = false;
                
                this.isDead = false;
                this.lastInfoText = null;
                this.playerScaleX = 1;
                this.playerScaleY = 1;
                this.wasOnFloor = true;
                this.coyoteTimer = 0;
                this.jumpBufferTimer = 0;

                // Use override if provided, else find by ID
                if (levelDataOverride) {
                    this.levelData = levelDataOverride;
                } else {
                    this.levelData = GAME_DATA.levels.find(l => l.id === currentLevelId);
                }

                this.hasWeapon = this.levelData.items?.some((i: any) => i.weapon === 'light_gun') || false;
                this.isPortalLocked = this.levelData.hasKey === true;

                const mapWidth = (this.levelData.map.size.w * 32) + 400; 
                const mapHeight = this.levelData.map.size.h * 32;
                this.physics.world.setBounds(0, 0, mapWidth, mapHeight + 200);

                this.cameras.main.setBounds(0, 0, mapWidth, mapHeight + 200);
                this.cameras.main.setZoom(0.60); 
                this.cameras.main.setBackgroundColor('#E8E8E8');
                this.cameras.main.setRoundPixels(false); 

                this.platforms = this.physics.add.staticGroup();
                this.levelData.map.platforms.forEach((p: any) => {
                    const w = p.w * 32;
                    const h = (p.h || 1) * 32; // Updated to use variable height (default 1 block)
                    const x = (p.x * 32) + (w / 2);
                    const y = (p.y * 32) + (h / 2);
                    
                    const plat = this.platforms.create(x, y, 'platform');
                    plat.setDisplaySize(w, h);
                    plat.refreshBody();
                });

                // DOORS
                this.doors = this.physics.add.staticGroup();
                if (this.levelData.doors) {
                    this.levelData.doors.forEach((d: any) => {
                        const h = (d.h || 3) * 32;
                        const w = 16;
                        const x = d.x * 32;
                        // Added +32 to align the door bottom with the bottom of the grid cell
                        // This ensures it sits flush on top of platforms placed on the row below
                        const topY = ((d.y + 1) * 32) - h; 
                        
                        const door = this.doors.create(x, topY, 'door_closed');
                        door.setOrigin(0.5, 0); 
                        door.setDisplaySize(w, h);
                        door.refreshBody();

                        door.setData('id', d.id);
                        door.setData('maxHeight', h);
                        door.setData('currentHeight', h);
                        door.setData('width', w);
                    });
                }

                // BUTTONS
                this.buttons = this.physics.add.group({
                    allowGravity: false,
                    immovable: true
                });
                if (this.levelData.buttons) {
                    this.levelData.buttons.forEach((b: any) => {
                        // FIXED: Button sits at bottom of grid cell to match editor visual
                        const btnY = (b.y * 32) + 32; 
                        const btn = this.buttons.create(b.x * 32, btnY, 'button_up');
                        btn.setOrigin(0.5, 1); 
                        
                        btn.setSize(24, 10);
                        btn.setOffset(4, 22);
                        
                        btn.setData('id', b.id);
                        btn.setData('linkTo', b.linkToDoorId);
                        btn.setData('behavior', b.behavior || 'hold');
                        btn.setData('isPressed', false);
                        btn.setData('permanentState', false);
                    });
                }

                // PORTAL
                let exitX, exitY;
                if (this.levelData.portalPos) {
                     // Custom portal position from editor
                     exitX = (this.levelData.portalPos.x * 32); 
                     exitY = (this.levelData.portalPos.y * 32);
                } else {
                     // Auto-calc fallback
                     exitX = (this.levelData.map.size.w - 2) * 32;
                     const lastPlat = this.levelData.map.platforms[this.levelData.map.platforms.length - 1];
                     exitY = (lastPlat ? lastPlat.y * 32 : 300) - 50;
                }
                
                this.portalGlow = this.add.image(exitX, exitY, 'glow');
                this.portalGlow.setScale(2.5);
                this.portalGlow.setAlpha(0.15);
                this.portalGlow.setBlendMode(Phaser.BlendModes.ADD);
                this.portalGlow.setTint(this.isPortalLocked ? 0xFF0000 : 0xFFFFFF);

                this.tweens.add({
                    targets: this.portalGlow,
                    scale: 3,
                    alpha: 0.25,
                    duration: 2000,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });

                const r1 = this.add.rectangle(exitX, exitY, 48, 48);
                r1.setStrokeStyle(2, 0x111111);
                this.tweens.add({ targets: r1, angle: 360, duration: 8000, repeat: -1 });

                const r2 = this.add.rectangle(exitX, exitY, 32, 32);
                r2.setStrokeStyle(2, 0x333333);
                this.tweens.add({ targets: r2, angle: -360, duration: 5000, repeat: -1 });

                const r3 = this.add.rectangle(exitX, exitY, 16, 16);
                r3.setFillStyle(0x000000);
                this.tweens.add({ targets: r3, angle: 360, duration: 3000, repeat: -1 });

                this.portalParticles = this.add.particles(exitX, exitY, 'spark', {
                    speed: 0, 
                    lifespan: 800,
                    scale: { start: 1, end: 0 },
                    quantity: 1,
                    frequency: 50,
                    tint: this.isPortalLocked ? 0xFF0000 : 0xFFFFFF,
                    blendMode: 'NORMAL',
                    emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
                        const angle = Phaser.Math.Between(0, 360);
                        const radius = Phaser.Math.Between(40, 60);
                        particle.x = exitX + Math.cos(angle) * radius;
                        particle.y = exitY + Math.sin(angle) * radius;
                        
                        const angleToCenter = Phaser.Math.Angle.Between(particle.x, particle.y, exitX, exitY);
                        const speed = 60;
                        particle.velocityX = Math.cos(angleToCenter) * speed;
                        particle.velocityY = Math.sin(angleToCenter) * speed;
                    }
                });

                const portalZone = this.add.zone(exitX, exitY, 40, 60);
                this.physics.add.existing(portalZone, true);

                const GRAVITY = GAME_DATA.player.physics.gravity;

                // BOXES
                this.boxes = this.physics.add.group({
                    collideWorldBounds: false, 
                    allowGravity: true
                });

                if (this.levelData.boxes) {
                    this.levelData.boxes.forEach((b: any) => {
                        const box = this.boxes.create(b.x * 32, b.y * 32, 'box_push');
                        box.setSize(30, 30);
                        box.setDrag(10000, 0); 
                        box.setBounce(0);
                        box.setMass(1000); 
                        box.setPushable(false);
                        box.setGravityY(GRAVITY);
                        box.setData('startX', b.x * 32);
                        box.setData('startY', b.y * 32);
                    });
                }

                // KEYS
                this.keys = this.physics.add.group({
                    allowGravity: false,
                    immovable: true
                });

                if (this.levelData.hasKey && this.levelData.keyPos) {
                    const k = this.levelData.keyPos;
                    const keyItem = this.keys.create(k.x * 32, k.y * 32, 'key_item');
                    this.tweens.add({
                        targets: keyItem,
                        y: '-=10',
                        duration: 1500,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    this.tweens.add({
                        targets: keyItem,
                        scaleX: 0.8,
                        duration: 1000,
                        yoyo: true,
                        repeat: -1,
                    });
                }

                // Player
                const startX = (this.levelData.checkpoints ? this.levelData.checkpoints[0].x : 5) * 32;
                const startY = (this.levelData.checkpoints ? this.levelData.checkpoints[0].y : 10) * 32;
                
                this.player = this.physics.add.sprite(startX, startY, undefined); 
                this.player.setSize(30, 30); 
                this.player.setVisible(false); 
                this.player.setCollideWorldBounds(false);
                this.player.setGravityY(GRAVITY); 
                this.player.setDragX(2000); 
                this.player.setMaxVelocity(400, 1500);
                
                this.playerGraphics = this.add.graphics();
                this.playerGraphics.setDepth(10); 
                
                this.lightGraphics = this.add.graphics();
                this.lightGraphics.setDepth(20); 

                // Enemies
                this.enemies = this.physics.add.group({
                    allowGravity: true,
                    collideWorldBounds: true
                });
                
                this.enemyBullets = this.physics.add.group({
                    defaultKey: 'enemy_bullet',
                    maxSize: 50
                });

                if (this.levelData.enemies) {
                    this.levelData.enemies.forEach((e: any) => {
                        let spawnY = 0;
                        const platform = this.levelData.map.platforms.find((p: any) => {
                             return e.x >= p.x && e.x <= (p.x + p.w);
                        });

                        if (platform) {
                            spawnY = (platform.y * 32) - 48; 
                        } else {
                            spawnY = 5 * 32;
                        }

                        let typeKey = 'enemy_basic';
                        let width = 32;
                        let height = 32;
                        let hp = 1;
                        let speed = 100;

                        if (e.type === 'triangle_hunter') {
                             typeKey = 'enemy_hunter';
                             speed = 220;
                        }
                        if (e.type === 'triangle_ranged') {
                             typeKey = 'enemy_ranged';
                             speed = 180; 
                        }
                        if (e.type === 'triangle_heavy') {
                            typeKey = 'enemy_heavy';
                            width = 48;
                            height = 48;
                            hp = 5; 
                            speed = 80; 
                        }
                        if (e.type === 'triangle_rapid') {
                            typeKey = 'enemy_rapid';
                            hp = 3;
                            speed = 140;
                        }

                        // Override with JSON data if present
                        if (e.hp !== undefined) hp = e.hp;
                        if (e.speed !== undefined) speed = e.speed;

                        const enemy = this.enemies.create(e.x * 32, spawnY - (height - 32), typeKey);
                        
                        enemy.setSize(width - 4, height - 4);
                        if (e.type !== 'triangle_heavy') enemy.setOffset(2, 4);
                        
                        enemy.setBounce(0);
                        enemy.setGravityY(GRAVITY);
                        enemy.setPushable(false); 
                        
                        enemy.setData('type', e.type);
                        enemy.setData('hp', hp);
                        enemy.setData('baseSpeed', speed);
                        enemy.setData('speed', speed);
                        enemy.setData('dir', 1); 
                        enemy.setData('alerted', false);
                        enemy.setData('lastFired', 0);
                        enemy.setVelocityX(speed); 
                    });
                }

                this.bullets = this.physics.add.group({
                    defaultKey: 'bullet',
                    maxSize: 20
                });

                this.particles = this.add.particles(0, 0, 'dust', {
                    speed: { min: -50, max: 50 },
                    angle: { min: 200, max: 340 },
                    scale: { start: 1, end: 0 },
                    lifespan: 250, 
                    gravityY: 100,
                    emitting: false
                });

                // Collisions
                this.physics.add.collider(this.player, this.platforms, this.handleLand, undefined, this);
                this.physics.add.collider(this.enemies, this.platforms);
                this.physics.add.collider(this.boxes, this.platforms);
                this.physics.add.collider(this.boxes, this.enemies); 
                this.physics.add.collider(this.player, this.doors); 
                this.physics.add.collider(this.boxes, this.doors); 
                this.physics.add.collider(this.enemies, this.doors);

                this.physics.add.overlap(this.player, this.buttons, (p, b) => {
                    (b as Phaser.Physics.Arcade.Sprite).setData('isPressed', true);
                });
                this.physics.add.overlap(this.boxes, this.buttons, (box, b) => {
                     (b as Phaser.Physics.Arcade.Sprite).setData('isPressed', true);
                });

                this.physics.add.collider(this.player, this.boxes, (player, box) => {
                    const p = player as Phaser.Physics.Arcade.Sprite;
                    const b = box as Phaser.Physics.Arcade.Sprite;
                    
                    if (p.body.touching.down && b.body.touching.up) return;

                    const pushSpeed = GAME_DATA.player.physics.speed; 
                    const isRightInput = inputsRef.current.has('RIGHT') || (this.cursors && this.cursors.right.isDown);
                    const isLeftInput = inputsRef.current.has('LEFT') || (this.cursors && this.cursors.left.isDown);

                    if (p.body.touching.right && b.body.touching.left) {
                        if (isRightInput) {
                            b.setVelocityX(pushSpeed);
                            if (Math.random() > 0.8) this.particles.emitParticleAt(b.x - 16, b.y + 16, 1);
                        }
                    } 
                    else if (p.body.touching.left && b.body.touching.right) {
                        if (isLeftInput) {
                            b.setVelocityX(-pushSpeed);
                            if (Math.random() > 0.8) this.particles.emitParticleAt(b.x + 16, b.y + 16, 1);
                        }
                    }
                });
                
                this.physics.add.collider(this.player, this.enemies, this.handlePlayerHit, undefined, this);
                this.physics.add.overlap(this.player, portalZone, this.handleLevelWin, undefined, this);
                
                this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, undefined, this);
                this.physics.add.collider(this.bullets, this.boxes, (bullet) => (bullet as Phaser.GameObjects.GameObject).destroy());
                this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
                    const b = bullet as Phaser.Physics.Arcade.Sprite;
                    if (b.body) {
                        this.particles.emitParticleAt(b.body.position.x, b.body.position.y, 3);
                    }
                    b.destroy();
                });
                this.physics.add.collider(this.bullets, this.doors, (bullet) => (bullet as Phaser.GameObjects.GameObject).destroy());

                // Enemy Bullets
                this.physics.add.collider(this.player, this.enemyBullets, (p, bullet) => {
                    bullet.destroy();
                    this.handlePlayerHit();
                });
                this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => bullet.destroy());
                this.physics.add.collider(this.enemyBullets, this.boxes, (bullet) => bullet.destroy());
                this.physics.add.collider(this.enemyBullets, this.doors, (bullet) => bullet.destroy());

                this.physics.add.overlap(this.player, this.keys, this.handleKeyCollect, undefined, this);

                // CAMERA FOLLOW CONFIG
                // Added offset to show more of the level in front of the player
                this.cameras.main.startFollow(this.player, true, 0.08, 0.08, 0, 50);

                if(this.input.keyboard) {
                    this.cursors = this.input.keyboard.createCursorKeys();
                    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
                    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
                }
            }

            handleLand() { }

            handleKeyCollect(player: any, key: any) {
                key.destroy();
                onKeyCollected();
                this.isPortalLocked = false;
                
                this.particles.emitParticleAt(key.x, key.y, 20);
                this.cameras.main.flash(200, 255, 255, 255);
                
                if (this.portalGlow) this.portalGlow.setTint(0xFFFFFF);
                if (this.portalParticles) {
                    (this.portalParticles as any).particleTint = 0xFFFFFF; 
                }
            }

            handlePlayerHit() {
                if (this.isDead) return;
                this.die();
            }

            handleLevelWin() {
                if (this.isDead) return;
                
                if (this.isPortalLocked) {
                     onInfoTrigger("LOCKED. Find the Key.");
                    return; 
                }

                this.scene.pause();
                onLevelComplete(this.levelData.exit.to);
            }

            handleBulletHit(bullet: any, enemy: any) {
                bullet.setActive(false).setVisible(false);
                bullet.body.stop(); 
                bullet.setPosition(-100, -100);
                
                let hp = enemy.getData('hp');
                const eType = enemy.getData('type');
                
                hp--;
                enemy.setData('hp', hp);

                this.particles.emitParticleAt(enemy.x, enemy.y, 5);
                this.cameras.main.shake(50, 0.005);

                if (hp <= 0) {
                    this.particles.emitParticleAt(enemy.x, enemy.y, 20);
                    enemy.destroy();
                } else {
                    enemy.setTint(0xFF0000); 
                    this.time.delayedCall(100, () => enemy.clearTint());
                    
                    if (eType === 'triangle_heavy') {
                        enemy.setData('alerted', true);
                        const newScale = enemy.scaleX * 1.15;
                        
                        enemy.y -= 10; 
                        enemy.setScale(newScale);
                        enemy.refreshBody();
                        
                        const currentSpeed = enemy.getData('speed');
                        enemy.setData('speed', currentSpeed + 30);
                        this.cameras.main.shake(100, 0.01);
                    }
                    if (eType === 'triangle_ranged' || eType === 'triangle_rapid') {
                        enemy.setData('alerted', true);
                    }
                }
            }

            die() {
                this.isDead = true;
                this.player.setVelocity(0, -400);
                this.physics.world.removeCollider(this.physics.world.colliders.getActive().find((c: any) => c.object1 === this.player || c.object2 === this.player) as Phaser.Physics.Arcade.Collider);
                this.cameras.main.shake(200, 0.02);
                this.particles.emitParticleAt(this.player.x, this.player.y, 30);
                this.time.delayedCall(1000, () => onPlayerDeath());
            }

            drawPlayer() {
                this.playerGraphics.clear();
                const x = this.player.x;
                const y = this.player.y;
                const w = 32 * this.playerScaleX;
                const h = 32 * this.playerScaleY;
                const drawY = y + (32 - h) / 2;

                this.playerGraphics.fillStyle(0x000000, 0.3);
                this.playerGraphics.fillRect(x - 16 + 2, y - 16 + 2, 32, 32);

                if (this.isDead) {
                    this.playerGraphics.fillStyle(0xAA0000); 
                } else {
                    this.playerGraphics.fillStyle(0x111111);
                }
                this.playerGraphics.fillRect(x - (w / 2), drawY - (h / 2), w, h);

                if (!this.isDead) {
                    this.playerGraphics.fillStyle(0xFFFFFF);
                    const targetOffset = this.facingRight ? 4 : -4;
                    this.eyeOffset += (targetOffset - this.eyeOffset) * 0.2;
                    const eyeY = drawY - 6 * this.playerScaleY;
                    const leftEyeX = x - (8 * this.playerScaleX) + this.eyeOffset;
                    const rightEyeX = x + (8 * this.playerScaleX) + this.eyeOffset;
                    
                    if (this.blinkTimer > 0) this.blinkTimer--;
                    else {
                        if (this.isBlinking) {
                            this.isBlinking = false;
                            this.blinkTimer = Phaser.Math.Between(120, 300); 
                        } else {
                            this.isBlinking = true;
                            this.blinkTimer = 8; 
                        }
                    }

                    if (this.isBlinking) {
                        this.playerGraphics.fillRect(leftEyeX - 3, eyeY, 6, 2);
                        this.playerGraphics.fillRect(rightEyeX - 3, eyeY, 6, 2);
                    } else {
                        this.playerGraphics.fillRect(leftEyeX - 3, eyeY - 3, 6, 6);
                        this.playerGraphics.fillRect(rightEyeX - 3, eyeY - 3, 6, 6);
                        this.playerGraphics.fillStyle(0x000000);
                        const pupilOffset = this.facingRight ? 1 : -1;
                        this.playerGraphics.fillRect(leftEyeX - 1 + pupilOffset, eyeY - 1, 2, 2);
                        this.playerGraphics.fillRect(rightEyeX - 1 + pupilOffset, eyeY - 1, 2, 2);
                    }
                }
            }

            update(time: number, delta: number) {
                // PLAYER BULLET RANGE CHECK
                this.bullets.getChildren().forEach((b: any) => {
                    if (b.getData('expiresAt') && time > b.getData('expiresAt')) {
                        b.destroy();
                    }
                });

                // BUTTON AND DOOR LOGIC
                this.buttons.getChildren().forEach((child: any) => {
                    const btn = child as Phaser.Physics.Arcade.Sprite;
                    const isPressed = btn.getData('isPressed');
                    const behavior = btn.getData('behavior');
                    const linkId = btn.getData('linkTo');
                    let isActive = isPressed;

                    if (behavior === 'once') {
                        if (isPressed && !btn.getData('permanentState')) {
                            btn.setData('permanentState', true);
                            this.cameras.main.shake(20, 0.005); 
                            this.particles.emitParticleAt(btn.x, btn.y, 5);
                        }
                        isActive = btn.getData('permanentState');
                    }

                    if (isActive) {
                        btn.setTint(0x66FF66);
                        btn.scaleY = 0.5; 
                    } else {
                        btn.clearTint();
                        btn.scaleY = 1.0;
                    }

                    if (this.doors) {
                        this.doors.getChildren().forEach((dChild: any) => {
                            const door = dChild as Phaser.Physics.Arcade.Sprite;
                            if (door.getData('id') === linkId) {
                                const maxH = door.getData('maxHeight');
                                const w = door.getData('width');
                                let currentH = door.getData('currentHeight');

                                if (isActive) {
                                    if (currentH > 0) {
                                        currentH -= 6;
                                        if (currentH < 0) currentH = 0;
                                        
                                        door.setData('currentHeight', currentH);
                                        door.setDisplaySize(w, currentH);
                                        door.refreshBody();
                                    }

                                    if (currentH === 0 && door.body.enable) {
                                        door.disableBody(true, true);
                                        door.setVisible(false);
                                    }
                                } else {
                                    if (!door.body.enable) {
                                        door.enableBody(true, door.x, door.y, true, true);
                                        door.setVisible(true);
                                    }
                                    
                                    if (currentH < maxH) {
                                        currentH += 6;
                                        if (currentH > maxH) currentH = maxH;
                                        
                                        door.setData('currentHeight', currentH);
                                        door.setDisplaySize(w, currentH);
                                        door.refreshBody();
                                    }
                                }
                            }
                        });
                    }
                    
                    btn.setData('isPressed', false);
                });

                // INFO TEXT CHECK
                let activeInfoNow: string | null = null;
                if (this.levelData.infoPoints) {
                    this.levelData.infoPoints.forEach((info: any) => {
                        const px = info.x * 32;
                        const pw = info.w * 32;
                        if (this.player.x > px && this.player.x < px + pw) {
                            activeInfoNow = info.text;
                        }
                    });
                }
                
                if (activeInfoNow !== this.lastInfoText) {
                    this.lastInfoText = activeInfoNow;
                    onInfoTrigger(activeInfoNow);
                }


                this.playerScaleX = Phaser.Math.Linear(this.playerScaleX, 1, 0.15);
                this.playerScaleY = Phaser.Math.Linear(this.playerScaleY, 1, 0.15);

                const onFloor = this.player.body.touching.down;
                
                if (onFloor) {
                    this.coyoteTimer = 6; 
                    this.jumpCount = 0;
                } else if (this.coyoteTimer > 0) {
                    this.coyoteTimer--;
                }

                if (this.jumpBufferTimer > 0) {
                    this.jumpBufferTimer--;
                }

                if (!this.wasOnFloor && onFloor) {
                    this.playerScaleX = 1.4;
                    this.playerScaleY = 0.6;
                    this.spawnDust(0, 4);
                }
                this.wasOnFloor = onFloor;

                this.drawPlayer();
                this.lightGraphics.clear();

                if (this.isDead) {
                    this.player.rotation += 0.15;
                    return;
                }

                const inputs = inputsRef.current;
                const currentAmmo = ammoRef.current;
                const speed = GAME_DATA.player.physics.speed; 
                const JUMP_FORCE = GAME_DATA.player.physics.jumpForce;

                // MOVEMENT
                let isMoving = false;
                if (inputs.has('LEFT') || (this.cursors && this.cursors.left.isDown)) {
                    this.player.setVelocityX(-speed);
                    this.facingRight = false;
                    isMoving = true;
                } else if (inputs.has('RIGHT') || (this.cursors && this.cursors.right.isDown)) {
                    this.player.setVelocityX(speed);
                    this.facingRight = true;
                    isMoving = true;
                } 

                if (isMoving && onFloor) {
                    if (Math.random() > 0.8) { 
                        const offset = this.facingRight ? -14 : 14;
                        this.spawnDust(offset, 1);
                    }
                }

                // JUMP
                const isJumpPressed = inputs.has('JUMP') || (this.cursors && this.cursors.up.isDown) || (this.keySpace && this.keySpace.isDown);
                const jumpJustPressed = isJumpPressed && !this.player.getData('jumpLocked');

                if (jumpJustPressed) {
                    this.jumpBufferTimer = 8; 
                    this.player.setData('jumpLocked', true);
                }

                if (this.jumpBufferTimer > 0) {
                    if (this.coyoteTimer > 0) {
                        this.player.setVelocityY(-JUMP_FORCE);
                        this.spawnDust(0, 8);
                        this.playerScaleX = 0.6;
                        this.playerScaleY = 1.4;
                        this.coyoteTimer = 0; 
                        this.jumpBufferTimer = 0; 
                        this.jumpCount = 1;
                    } 
                    else if (this.jumpCount < 2) {
                        this.player.setVelocityY(-JUMP_FORCE * 0.9);
                        this.spawnDust(0, 5);
                        this.playerScaleX = 0.7;
                        this.playerScaleY = 1.3;
                        this.jumpCount++;
                        this.jumpBufferTimer = 0;
                    }
                }

                if (!isJumpPressed) {
                    this.player.setData('jumpLocked', false);
                    if (this.player.body.velocity.y < -50) {
                        this.player.setVelocityY(this.player.body.velocity.y * 0.5); 
                    }
                }

                // SHOOT
                const isFireDown = inputs.has('FIRE') || (this.keyZ && this.keyZ.isDown);
                
                if (isFireDown && this.hasWeapon && time > this.lastFired && currentAmmo > 0) {
                    const bullet = this.bullets.get(this.player.x, this.player.y);
                    if (bullet) {
                        bullet.setActive(true).setVisible(true);
                        const dir = this.facingRight ? 1 : -1;
                        const spawnX = this.player.x + (dir * 20);
                        bullet.setPosition(spawnX, this.player.y);
                        bullet.body.reset(spawnX, this.player.y);
                        bullet.setVelocityX(dir * 800);
                        bullet.body.allowGravity = false;
                        bullet.setData('expiresAt', time + 600); // 600ms range
                        
                        this.lastFired = time + 250; 
                        this.cameras.main.shake(40, 0.005); 
                        
                        onAmmoConsumed();
                    }
                }

                if (this.player.y > this.physics.world.bounds.height) {
                    this.die();
                }

                // CHECK BOX BOUNDS
                this.boxes.getChildren().forEach((child: any) => {
                    const box = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                    if (box.y > this.physics.world.bounds.height + 50) {
                         box.destroy();
                    }
                });

                // AI UPDATE
                this.enemies.getChildren().forEach((child: any) => {
                    const enemy = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
                    const distToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    
                    if (distToPlayer > 1000) {
                        enemy.setVelocityX(0);
                        return;
                    }

                    const eType = enemy.getData('type');
                    let currentDir = enemy.getData('dir');
                    let currentSpeed = enemy.getData('speed');
                    
                    const checkFloorAhead = (direction: number) => {
                        const lookAheadDist = (enemy.width / 2) + 10 + (currentSpeed * 0.2);
                        const lookAheadX = enemy.x + (direction * lookAheadDist);
                        const lookAheadY = enemy.y + (eType === 'triangle_heavy' ? 32 : 20); 
                        return this.levelData.map.platforms.some((p: any) => {
                             const pLeft = p.x * 32;
                             const pRight = (p.x + p.w) * 32;
                             const pTop = p.y * 32;
                             return lookAheadX > pLeft && lookAheadX < pRight && Math.abs(lookAheadY - pTop) < 40;
                        });
                    };

                    if (eType === 'triangle_basic') {
                        if (enemy.body.blocked.left || enemy.body.blocked.right || !checkFloorAhead(currentDir)) {
                            currentDir *= -1; 
                            enemy.setData('dir', currentDir);
                        }
                        enemy.setVelocityX(currentSpeed * currentDir);

                    } else if (eType === 'triangle_ranged') {
                        let isAlerted = enemy.getData('alerted');
                        const distX = this.player.x - enemy.x;
                        const distY = this.player.y - enemy.y;
                        const detectionRange = 600; 

                        if (Math.abs(distX) < detectionRange && Math.abs(distY) < 60) {
                            if (!isAlerted) enemy.setData('alerted', true);
                            isAlerted = true;
                        }

                        // Alignment check (Vertical)
                        const alignedY = Math.abs(distY) < 20; 
                        let canShoot = false;

                        if (isAlerted && alignedY && !this.isDead) {
                            // If aligned vertically, FORCE turn to player
                            const targetDir = distX > 0 ? 1 : -1;
                            if (currentDir !== targetDir) {
                                currentDir = targetDir;
                                enemy.setData('dir', currentDir);
                            }
                            canShoot = true;
                        }

                        if (canShoot) {
                            enemy.setVelocityX(0);
                            
                            const lastShot = enemy.getData('lastFired');
                            const fireCooldown = 1500;
                            if (time > lastShot + fireCooldown) {
                                const bullet = this.enemyBullets.get(enemy.x, enemy.y);
                                if (bullet) {
                                    bullet.setTexture('enemy_bullet_ranged');
                                    bullet.setActive(true).setVisible(true);
                                    bullet.setPosition(enemy.x + (currentDir * 20), enemy.y);
                                    bullet.body.reset(enemy.x + (currentDir * 20), enemy.y);
                                    bullet.setVelocityX(currentDir * 500); 
                                    bullet.body.allowGravity = false;
                                    enemy.setData('lastFired', time);
                                    this.cameras.main.shake(20, 0.002);
                                }
                            }

                        } else if (isAlerted) {
                            const chaseDir = distX > 0 ? 1 : -1;
                            if (Math.abs(distX) > 50) { 
                                if (checkFloorAhead(chaseDir)) {
                                    enemy.setVelocityX(currentSpeed * 1.5 * chaseDir);
                                    enemy.setData('dir', chaseDir); 
                                } else {
                                    enemy.setVelocityX(0);
                                    enemy.setData('dir', chaseDir);
                                }
                            } else {
                                enemy.setVelocityX(0);
                            }

                        } else {
                            // PATROL
                            if (enemy.body.blocked.left || enemy.body.blocked.right || !checkFloorAhead(currentDir)) {
                                currentDir *= -1; 
                                enemy.setData('dir', currentDir);
                            }
                            enemy.setVelocityX(currentSpeed * currentDir);
                        }

                    } else if (eType === 'triangle_rapid') {
                        let isAlerted = enemy.getData('alerted');
                        const distX = this.player.x - enemy.x;
                        const distY = this.player.y - enemy.y;
                        const detectionRange = 400;

                        if (Math.abs(distX) < detectionRange && Math.abs(distY) < 60) {
                            if (!isAlerted) enemy.setData('alerted', true);
                            isAlerted = true;
                        }

                        const facingPlayer = (currentDir === 1 && distX > 0) || (currentDir === -1 && distX < 0);
                        const alignedY = Math.abs(distY) < 40;
                        const canShoot = isAlerted && alignedY && facingPlayer && !this.isDead;

                        if (canShoot) {
                            enemy.setVelocityX(0);
                            
                            const lastShot = enemy.getData('lastFired');
                            const fireCooldown = 2500; 
                            
                            if (time > lastShot + fireCooldown) {
                                enemy.setData('lastFired', time);
                                for(let i=0; i<3; i++) {
                                    this.time.delayedCall(i * 150, () => {
                                        if(!enemy.active) return;
                                        const bullet = this.enemyBullets.get(enemy.x, enemy.y);
                                        if (bullet) {
                                            bullet.setTexture('enemy_bullet_rapid');
                                            bullet.setActive(true).setVisible(true);
                                            bullet.setPosition(enemy.x + (currentDir * 20), enemy.y);
                                            bullet.body.reset(enemy.x + (currentDir * 20), enemy.y);
                                            bullet.setVelocityX(currentDir * 550);
                                            bullet.body.allowGravity = false;
                                            this.cameras.main.shake(10, 0.001);
                                        }
                                    });
                                }
                            }

                        } else if (isAlerted) {
                            const chaseDir = distX > 0 ? 1 : -1;
                             if (Math.abs(distX) > 100) { 
                                if (checkFloorAhead(chaseDir)) {
                                    enemy.setVelocityX(currentSpeed * 1.5 * chaseDir);
                                    enemy.setData('dir', chaseDir); 
                                } else {
                                    enemy.setVelocityX(0);
                                }
                            } else if (Math.abs(distX) < 50) {
                                enemy.setVelocityX(-currentSpeed * chaseDir);
                            } else {
                                enemy.setVelocityX(0);
                            }
                        } else {
                            if (enemy.body.blocked.left || enemy.body.blocked.right || !checkFloorAhead(currentDir)) {
                                currentDir *= -1; 
                                enemy.setData('dir', currentDir);
                            }
                            enemy.setVelocityX(currentSpeed * currentDir);
                        }

                    } else if (eType === 'triangle_heavy') {
                        let isAlerted = enemy.getData('alerted');
                        const distX = this.player.x - enemy.x;
                        const distY = this.player.y - enemy.y;
                        
                        if (!isAlerted && Math.abs(distX) < 300 && Math.abs(distY) < 80) {
                            const facingPlayer = (currentDir === 1 && distX > 0) || (currentDir === -1 && distX < 0);
                            if (facingPlayer && !this.isDead) {
                                isAlerted = true;
                                enemy.setData('alerted', true);
                                this.tweens.add({ targets: enemy, scaleX: 1.1, scaleY: 1.1, duration: 100, yoyo: true }); 
                            }
                        }

                        if (isAlerted) {
                            if (Math.abs(distX) < 10) {
                                enemy.setVelocityX(0);
                            } else {
                                const chaseDir = distX > 0 ? 1 : -1;
                                let finalSpeed = currentSpeed;
                                let isCharging = false;
                                
                                if (Math.abs(distY) < 30) {
                                    finalSpeed = currentSpeed * 2.5;
                                    isCharging = true;
                                } else {
                                    finalSpeed = currentSpeed * 1.2;
                                }

                                if (!checkFloorAhead(chaseDir)) {
                                    enemy.setVelocityX(0);
                                } else {
                                    enemy.setVelocityX(finalSpeed * chaseDir);
                                }
                                
                                if (isCharging) {
                                    this.lightGraphics.fillStyle(0xFF0000, 0.4);
                                    this.lightGraphics.fillCircle(enemy.x + (chaseDir*12), enemy.y - 10, 5);
                                }
                            }
                            
                        } else {
                            if (enemy.body.blocked.left || enemy.body.blocked.right || !checkFloorAhead(currentDir)) {
                                currentDir *= -1; 
                                enemy.setData('dir', currentDir);
                            }
                            enemy.setVelocityX(currentSpeed * currentDir);
                        }

                    } else if (eType === 'triangle_hunter') {
                        let isAlerted = enemy.getData('alerted');
                        const distX = this.player.x - enemy.x;
                        const distY = this.player.y - enemy.y;
                        const detectionRange = 320;
                        const detectionWidth = 50; 

                        const coneLen = 220;
                        const coneWidth = 90;
                        const lx = enemy.x + (currentDir * 5);
                        const ly = enemy.y - 5;
                        
                        const inRange = Math.abs(distX) < detectionRange && Math.abs(distY) < detectionWidth;
                        const facingPlayer = (currentDir === 1 && distX > 0) || (currentDir === -1 && distX < 0);
                        const playerInCone = inRange && facingPlayer && !this.isDead;

                        if (playerInCone) {
                            if (!isAlerted) enemy.setData('alerted', true);
                            isAlerted = true;
                        } else {
                            if (isAlerted) enemy.setData('alerted', false);
                            isAlerted = false;
                        }

                        if (isAlerted) {
                            this.lightGraphics.fillStyle(0xFF0000, 0.2 + (Math.sin(time * 0.02) * 0.1));
                        } else {
                            this.lightGraphics.fillStyle(0xFFFF00, 0.12);
                        }
                        
                        this.lightGraphics.beginPath();
                        this.lightGraphics.moveTo(lx, ly);
                        this.lightGraphics.lineTo(lx + (currentDir * coneLen), ly - (coneWidth/2));
                        this.lightGraphics.lineTo(lx + (currentDir * coneLen), ly + (coneWidth/2));
                        this.lightGraphics.closePath();
                        this.lightGraphics.fill();

                        if (isAlerted) {
                            const chaseDir = distX > 0 ? 1 : -1;
                            if (Math.abs(distX) > 10) {
                                if (checkFloorAhead(chaseDir)) {
                                    enemy.setVelocityX(currentSpeed * 1.6 * chaseDir);
                                    enemy.setFlipX(chaseDir < 0);
                                    enemy.setData('dir', chaseDir); 
                                } else {
                                    enemy.setVelocityX(0);
                                    enemy.setFlipX(chaseDir < 0);
                                    enemy.setData('dir', chaseDir);
                                }
                            }
                        } else {
                            if (enemy.body.blocked.left || enemy.body.blocked.right || !checkFloorAhead(currentDir)) {
                                currentDir *= -1; 
                                enemy.setData('dir', currentDir);
                                enemy.setFlipX(currentDir < 0);
                            }
                            enemy.setVelocityX(currentSpeed * currentDir);
                            enemy.setFlipX(currentDir < 0);
                        }
                    }
                });
            }

            spawnDust(offsetX: number = 0, count: number = 1) {
                this.particles.emitParticleAt(this.player.x + offsetX, this.player.y + 16, count);
            }
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO, 
            parent: containerRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            powerPreference: 'high-performance', 
            desynchronized: true,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false,
                    tileBias: 16
                }
            },
            scene: MainScene,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            backgroundColor: '#E8E8E8',
            pixelArt: false,
            antialias: true,
            roundPixels: false 
        };

        const game = new Phaser.Game(config);
        gameRef.current = game;
        sceneRef.current = null;
        
        game.events.on('ready', () => {
             const scene = game.scene.getScene('MainScene') as Phaser.Scene;
             sceneRef.current = scene;
        });

        return () => {
            game.destroy(true);
        };
    }, [currentLevelId, levelDataOverride]); 

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
    );
};