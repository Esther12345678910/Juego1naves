var juego = new Phaser.Game(370,600, Phaser.CANVAS, 'bloque_juego');
var fondoJuego;
var personaje;
var teclaDerecha;
var teclaIzquierda;
var enemigos;
var balas;
var tiempoBala = 0;
var botonDisparo;
var vida = 3;
var textoVida;
var balasEnemigos;
var tiempoBalaEnemigo = 0;
var score = 0;
var textoScore;
var gameOver = false; // Variable global para saber si fue por perder
var nivelActual = 1; // Variable global para el nivel


//Estado Inicio
var estadoInicio = {
    preload: function() {
        juego.load.image('fondo', 'img/img1.png');
    },
    create: function() {
        fondoJuego = juego.add.tileSprite(0, 0, 370, 600, 'fondo');

        var style = { font: "20px Arial", fill: "#fff", align: "center" };
        var mensaje = gameOver ? "GAME OVER" : "BIENVENIDO"; // Cambia el mensaje

        var texto = juego.add.text(juego.world.centerX, juego.world.centerY - 80, 
            mensaje, style);
        texto.anchor.setTo(0.5);

        var bmd = juego.add.bitmapData(100, 50);
        bmd.ctx.fillStyle = "#340856";
        bmd.ctx.fillRect(0, 0, 150, 50);

        var boton = juego.add.button(
            juego.world.centerX, 
            juego.world.centerY, 
            bmd, 
            this.iniciarJuego, 
            this
        );
        boton.anchor.setTo(0.5);

        var textoBoton = juego.add.text(0, 0, "EMPEZAR", { 
            font: "15px Arial", 
            fill: "#fff", 
            align: "center" 
        });
        textoBoton.anchor.setTo(0.5);
        boton.addChild(textoBoton);

        var style = { font: "20px Arial", fill: "#fff", align: "center" };
        var texto = juego.add.text(juego.world.centerX, juego.world.centerY + 80, 
            "Esther Bendezu de la Cruz", style);
        texto.anchor.setTo(0.5);  
    },

    iniciarJuego: function() {
        gameOver = false; // Reinicia la variable al empezar
        juego.state.start('principal');
    }
};

var estadoPrincipal = {
    preload: function() {
        juego.load.image('fondo', 'img/img1.png');
        juego.load.image('personaje', 'img/img/sprites.png');
        juego.load.spritesheet('enemigo', 'img/img/enemigo1.png');
        juego.load.image('laser', 'img/laser.png');
        juego.load.audio('sonidoDisparo', 'sounds/laser.wav'); 
        juego.load.audio('sonidoExplosion', 'sounds/explosion.wav');
    },
    create: function(){
        fondoJuego = juego.add.tileSprite(0,0,370,600,'fondo');
        personaje = juego.add.sprite(80, 380, 'personaje');
        personaje.scale.setTo(0.5, 0.5); 
        juego.physics.arcade.enable(personaje); // <-- Habilita física

        this.sonidoDisparo = juego.add.audio('sonidoDisparo');
        this.sonidoExplosion = juego.add.audio('sonidoExplosion');

        teclaDerecha = juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        teclaIzquierda = juego.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        botonDisparo = juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        //enemigos nivel 1
        enemigos = juego.add.group();
        enemigos.enableBody = true;
        enemigos.physicsBodyType = Phaser.Physics.ARCADE;
        for (var y = 0; y < 3; y++) {
            for (var x = 0; x < 3; x++) {
                var enemig = enemigos.create(x * 50, y * 50, 'enemigo');
                enemig.anchor.setTo(0.5);
            }
        }
        enemigos.x = 100;
        enemigos.y = 150;
        var animacion = juego.add.tween(enemigos).to(
            { x: 200 },
            1000, Phaser.Easing.Linear.None, true, 0, 1000, true
        );
        // Grupo de balas
        balas = juego.add.group();
        balas.enableBody = true;
        balas.physicsBodyType = Phaser.Physics.ARCADE;
        balas.createMultiple(20, 'laser');
        balas.setAll('anchor.x', 0.5);
        balas.setAll('anchor.y', 1);
        balas.setAll('outOfBoundsKill', true);
        balas.setAll('checkWorldBounds', true);

        vida = 3;
        score = 0;
        textoVida = juego.add.text(10, 10, "Vida: " + vida, { font: "20px Arial", fill: "#fff" });
        textoScore = juego.add.text(10, 35, "Score: " + score, { font: "20px Arial", fill: "#fff" });
        textoNivel = juego.add.text(300, 10, "Nivel: " + nivelActual, { font: "20px Arial", fill: "#fff" });

        // Grupo de balas de enemigos
        balasEnemigos = juego.add.group();
        balasEnemigos.enableBody = true;
        balasEnemigos.physicsBodyType = Phaser.Physics.ARCADE;
        balasEnemigos.createMultiple(30, 'laser');
        balasEnemigos.setAll('anchor.x', 0.5);
        balasEnemigos.setAll('anchor.y', 1);
        balasEnemigos.setAll('outOfBoundsKill', true);
        balasEnemigos.setAll('checkWorldBounds', true);
    },
    update: function(){
        fondoJuego.tilePosition.x -= 1;
        if (teclaDerecha.isDown){
            personaje.x += 4; // velocidad aumentada
        } else if(teclaIzquierda.isDown){
            personaje.x -= 4; // velocidad aumentada
        }
        // Disparo
        if (botonDisparo.isDown) {
            this.disparar();
        }
        this.dispararEnemigos();
        // Colisión bala-enemigo
        juego.physics.arcade.overlap(balas, enemigos, this.colision, null, this);
        // Colisión bala-enemigo con personaje
        juego.physics.arcade.overlap(balasEnemigos, personaje, this.quitarVida, null, this);

        // Si no quedan enemigos, pasa al nivel 2
        if (enemigos.countLiving() === 0) {
            juego.state.start('nivel2');
        }
    },
    disparar: function() {
        if (juego.time.now > tiempoBala) {
            var bala = balas.getFirstExists(false);
            if (bala) {
                bala.reset(personaje.x + personaje.width/2, personaje.y);
                bala.body.velocity.y = -400;
                tiempoBala = juego.time.now + 300;
                this.sonidoDisparo.play();
            }
        }
    },
    colision: function(bala, enemigo) {
        bala.kill();
        enemigo.kill();
        score += 10;
        textoScore.text = "Score: " + score;
        this.sonidoExplosion.play();
    },
    dispararEnemigos: function() {
        if (juego.time.now > tiempoBalaEnemigo) {
            var enemigoVivo = enemigos.getFirstAlive();
            if (enemigoVivo) {
                var bala = balasEnemigos.getFirstExists(false);
                if (bala) {
                    bala.reset(enemigoVivo.x + enemigos.x, enemigoVivo.y + enemigos.y);
                    bala.body.velocity.y = 200;
                    tiempoBalaEnemigo = juego.time.now + 800; // cada 0.8 segundos
                }
            }
        }
    },
    quitarVida: function(personaje, balaEnemigo) {
        balaEnemigo.kill();
        vida--;
        textoVida.text = "Vida: " + vida;
        this.sonidoExplosion.play();
        if (vida <= 0) {
            personaje.kill();
            gameOver = true; 
            juego.state.start('inicio');
        }
    }
};

// Nuevo estado: nivel2
var nivel2 = {
    preload: function() {
        juego.load.image('fondo', 'img/img1.png');
        juego.load.image('personaje', 'img/img/sprites.png');
        juego.load.spritesheet('enemigo2', 'img/img/enemigo2.png');
        juego.load.image('laser', 'img/laser.png');
        juego.load.audio('sonidoDisparo', 'sounds/laser.wav'); 
        juego.load.audio('sonidoExplosion', 'sounds/explosion.wav');
    },
    create: function(){
        fondoJuego = juego.add.tileSprite(0,0,370,600,'fondo');
        personaje = juego.add.sprite(80, 380, 'personaje');
        personaje.scale.setTo(0.5, 0.5); 
        juego.physics.arcade.enable(personaje);

        this.sonidoDisparo = juego.add.audio('sonidoDisparo');
        this.sonidoExplosion = juego.add.audio('sonidoExplosion');

        teclaDerecha = juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        teclaIzquierda = juego.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        botonDisparo = juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        //enemigos nivel 2
        enemigos = juego.add.group();
        enemigos.enableBody = true;
        enemigos.physicsBodyType = Phaser.Physics.ARCADE;
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 5; x++) {
                var enemig = enemigos.create(x * 40, y * 40, 'enemigo2');
                enemig.anchor.setTo(0.5);
            }
        }
        enemigos.x = 50;
        enemigos.y = 100;
        var animacion = juego.add.tween(enemigos).to(
            { x: 200 },
            900, Phaser.Easing.Linear.None, true, 0, 1000, true
        );
        // Grupo de balas
        balas = juego.add.group();
        balas.enableBody = true;
        balas.physicsBodyType = Phaser.Physics.ARCADE;
        balas.createMultiple(20, 'laser');
        balas.setAll('anchor.x', 0.5);
        balas.setAll('anchor.y', 1);
        balas.setAll('outOfBoundsKill', true);
        balas.setAll('checkWorldBounds', true);

        textoVida = juego.add.text(10, 10, "Vida: " + vida, { font: "20px Arial", fill: "#fff" });
        textoScore = juego.add.text(10, 35, "Score: " + score, { font: "20px Arial", fill: "#fff" });

        nivelActual = 2; 
        textoNivel = juego.add.text(300, 10, "Nivel: " + nivelActual, { font: "20px Arial", fill: "#fff" });

        // Grupo de balas de enemigos
        balasEnemigos = juego.add.group();
        balasEnemigos.enableBody = true;
        balasEnemigos.physicsBodyType = Phaser.Physics.ARCADE;
        balasEnemigos.createMultiple(30, 'laser');
        balasEnemigos.setAll('anchor.x', 0.5);
        balasEnemigos.setAll('anchor.y', 1);
        balasEnemigos.setAll('outOfBoundsKill', true);
        balasEnemigos.setAll('checkWorldBounds', true);
    },
    update: function(){
        fondoJuego.tilePosition.x -= 1;
        if (teclaDerecha.isDown){
            personaje.x += 4; // velocidad aumentada
        } else if(teclaIzquierda.isDown){
            personaje.x -= 4; // velocidad aumentada
        }
        // Disparo
        if (botonDisparo.isDown) {
            this.disparar();
        }
        this.dispararEnemigos();
        // Colisión bala-enemigo
        juego.physics.arcade.overlap(balas, enemigos, this.colision, null, this);
        // Colisión bala-enemigo con personaje
        juego.physics.arcade.overlap(balasEnemigos, personaje, this.quitarVida, null, this);

        // Si no quedan enemigos, muestra mensaje de victoria
        if (enemigos.countLiving() === 0) {
            juego.state.start('ganaste');
        }
    },
    disparar: function() {
        if (juego.time.now > tiempoBala) {
            var bala = balas.getFirstExists(false);
            if (bala) {
                bala.reset(personaje.x + personaje.width/2, personaje.y);
                bala.body.velocity.y = -400;
                tiempoBala = juego.time.now + 300;
                this.sonidoDisparo.play();
            }
        }
    },
    colision: function(bala, enemigo) {
        bala.kill();
        enemigo.kill();
        score += 10;
        textoScore.text = "Score: " + score;
        this.sonidoExplosion.play();
    },
    dispararEnemigos: function() {
        if (juego.time.now > tiempoBalaEnemigo) {
            var enemigoVivo = enemigos.getFirstAlive();
            if (enemigoVivo) {
                var bala = balasEnemigos.getFirstExists(false);
                if (bala) {
                    bala.reset(enemigoVivo.x + enemigos.x, enemigoVivo.y + enemigos.y);
                    bala.body.velocity.y = 200;
                    tiempoBalaEnemigo = juego.time.now + 800; // cada 0.8 segundos
                }
            }
        }
    },
    quitarVida: function(personaje, balaEnemigo) {
        balaEnemigo.kill();
        vida--;
        textoVida.text = "Vida: " + vida;
        this.sonidoExplosion.play(); // <-- Agrega el sonido aquí
        if (vida <= 0) {
            personaje.kill();
            gameOver = true; // <-- Marca que fue por perder
            juego.state.start('inicio');
        }
    }
};

// Estado final: Ganaste
var ganaste = {
    create: function() {
        fondoJuego = juego.add.tileSprite(0, 0, 370, 600, 'fondo');
        var style = { font: "30px Arial", fill: "#fff", align: "center" };
        var texto = juego.add.text(juego.world.centerX, juego.world.centerY, 
            "¡Ganaste el juego!", style);
        texto.anchor.setTo(0.5);
    }
};

juego.state.add('inicio', estadoInicio);
juego.state.add('principal', estadoPrincipal);
juego.state.add('nivel2', nivel2);
juego.state.add('ganaste', ganaste);
juego.state.start('inicio');