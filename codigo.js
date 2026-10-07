/* =========================================================
   DIBUJA MÚSICA
   JavaScript
   ========================================================= */


/* =========================================================
   COLORES Y SONIDOS

   Puedes modificar esta sección fácilmente.

   hue  = apariencia del color
   sound = sonido que produce

   IMPORTANTE:
   lightness NO modifica sound.

   Por ejemplo:

   rosa claro  → melodía
   rosa oscuro → melodía

   El sonido siempre será melodía.
   ========================================================= */

const COLOR_FAMILIES = {

    red: {
        name: "Rojo",
        hue: 0,
        sound: "violin"
    },

    coral: {
        name: "Coral",
        hue: 15,
        sound: "strings"
    },

    orange: {
        name: "Naranja",
        hue: 30,
        sound: "guitar"
    },

    yellow: {
        name: "Amarillo",
        hue: 55,
        sound: "percussion"
    },

    lime: {
        name: "Lima",
        hue: 80,
        sound: "pluck"
    },

    green: {
        name: "Verde",
        hue: 120,
        sound: "bass"
    },

    turquoise: {
        name: "Turquesa",
        hue: 170,
        sound: "bell"
    },

    cyan: {
        name: "Cian",
        hue: 190,
        sound: "choir"
    },

    blue: {
        name: "Azul",
        hue: 220,
        sound: "piano"
    },

    indigo: {
        name: "Índigo",
        hue: 245,
        sound: "organ"
    },

    purple: {
        name: "Violeta",
        hue: 275,
        sound: "synth"
    },

    pink: {
        name: "Rosa",
        hue: 330,

        /* ROSA = MELODÍA */
        sound: "melody"
    }

};


/* =========================================================
   ELEMENTOS HTML
   ========================================================= */

const canvas =
    document.getElementById(
        "musicCanvas"
    );

const ctx =
    canvas.getContext("2d");


const palette =
    document.getElementById(
        "palette"
    );


const lightnessSlider =
    document.getElementById(
        "lightness"
    );


const lightnessValue =
    document.getElementById(
        "lightnessValue"
    );


const selectedColorName =
    document.getElementById(
        "selectedColorName"
    );


const playButton =
    document.getElementById(
        "playButton"
    );


const stopButton =
    document.getElementById(
        "stopButton"
    );


const clearButton =
    document.getElementById(
        "clearButton"
    );


/* =========================================================
   VARIABLES
   ========================================================= */

let selectedColor = "pink";

let lightness =
    Number(
        lightnessSlider.value
    );

let strokes = [];

let currentStroke = null;

let isDrawing = false;


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

let masterGain = null;

let activeNodes = [];


/* =========================================================
   NOTAS MUSICALES
   ========================================================= */

const NOTES = [

    130.81,
    146.83,
    164.81,
    174.61,
    196.00,
    220.00,
    246.94,
    261.63,
    293.66,
    329.63,
    349.23,
    392.00,
    440.00,
    493.88,
    523.25,
    587.33,
    659.25,
    698.46,
    783.99,
    880.00

];


/* =========================================================
   PALETA
   ========================================================= */

function createPalette() {

    palette.innerHTML = "";


    Object.entries(
        COLOR_FAMILIES
    ).forEach(
        ([key, color]) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "color-button";


            if (
                key === selectedColor
            ) {

                button.classList.add(
                    "selected"
                );
            }


            const circle =
                document.createElement(
                    "div"
                );


            circle.className =
                "color-circle";


            circle.style.background =
                getColor(
                    color.hue
                );


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "color-name";


            name.textContent =
                color.name;


            button.appendChild(
                circle
            );

            button.appendChild(
                name
            );


            button.addEventListener(
                "click",
                () => {

                    selectedColor =
                        key;

                    updatePalette();

                    updateSelectedText();

                }
            );


            palette.appendChild(
                button
            );

        }
    );
}


/* =========================================================
   ACTUALIZAR PALETA
   ========================================================= */

function updatePalette() {

    const buttons =
        document.querySelectorAll(
            ".color-button"
        );


    const entries =
        Object.keys(
            COLOR_FAMILIES
        );


    buttons.forEach(
        (button, index) => {

            button.classList.toggle(
                "selected",
                entries[index] ===
                selectedColor
            );


            const circle =
                button.querySelector(
                    ".color-circle"
                );


            const color =
                COLOR_FAMILIES[
                    entries[index]
                ];


            circle.style.background =
                getColor(
                    color.hue
                );

        }
    );
}


/* =========================================================
   TEXTO DEL COLOR
   ========================================================= */

function updateSelectedText() {

    const color =
        COLOR_FAMILIES[
            selectedColor
        ];


    selectedColorName.textContent =
        `${color.name} — ${getSoundName(color.sound)}`;
}


/* =========================================================
   NOMBRES DE SONIDOS
   ========================================================= */

function getSoundName(sound) {

    const names = {

        violin: "Violín",

        strings: "Cuerdas",

        guitar: "Guitarra",

        percussion: "Percusión",

        pluck: "Punteo",

        bass: "Bajo",

        bell: "Campana",

        choir: "Coro",

        piano: "Piano",

        organ: "Órgano",

        synth: "Sintetizador",

        melody: "Melodía"

    };


    return names[sound] || sound;
}


/* =========================================================
   COLOR VISUAL

   Solo modifica la apariencia.
   ========================================================= */

function getColor(hue) {

    return `
        hsl(
            ${hue},
            80%,
            ${lightness}%
        )
    `;
}


/* =========================================================
   CANVAS RESPONSIVE
   ========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        rect.width * dpr;


    canvas.height =
        rect.height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    redraw();
}


window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================================================
   POSICIÓN DEL PUNTERO
   ========================================================= */

function getPointerPosition(event) {

    const rect =
        canvas.getBoundingClientRect();


    return {

        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top

    };
}


/* =========================================================
   EVENTOS PARA DIBUJAR

   pointer events permiten:

   - Mouse
   - Dedo
   - Stylus
   ========================================================= */

canvas.addEventListener(
    "pointerdown",
    startDrawing
);


canvas.addEventListener(
    "pointermove",
    draw
);


canvas.addEventListener(
    "pointerup",
    stopDrawing
);


canvas.addEventListener(
    "pointercancel",
    stopDrawing
);


/* =========================================================
   COMENZAR DIBUJO
   ========================================================= */

function startDrawing(event) {

    event.preventDefault();


    isDrawing = true;


    canvas.setPointerCapture(
        event.pointerId
    );


    const point =
        getPointerPosition(
            event
        );


    const color =
        COLOR_FAMILIES[
            selectedColor
        ];


    currentStroke = {

        colorKey:
            selectedColor,

        sound:
            color.sound,

        color:
            getColor(color.hue),

        points:
            [point]

    };
}


/* =========================================================
   DIBUJAR
   ========================================================= */

function draw(event) {

    if (!isDrawing) {
        return;
    }


    event.preventDefault();


    const point =
        getPointerPosition(
            event
        );


    currentStroke.points.push(
        point
    );


    redraw();
}


/* =========================================================
   TERMINAR DIBUJO
   ========================================================= */

function stopDrawing(event) {

    if (!isDrawing) {
        return;
    }


    isDrawing = false;


    if (
        currentStroke &&
        currentStroke.points.length > 0
    ) {

        strokes.push(
            currentStroke
        );
    }


    currentStroke = null;


    redraw();
}


/* =========================================================
   REDIBUJAR
   ========================================================= */

function redraw() {

    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    drawGrid();


    strokes.forEach(
        drawStroke
    );


    if (currentStroke) {

        drawStroke(
            currentStroke
        );
    }
}


/* =========================================================
   CUADRÍCULA
   ========================================================= */

function drawGrid() {

    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    ctx.save();


    ctx.strokeStyle =
        "rgba(255,255,255,0.07)";


    ctx.lineWidth = 1;


    for (
        let y = 0;
        y < height;
        y += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();
    }


    for (
        let x = 0;
        x < width;
        x += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            height
        );

        ctx.stroke();
    }


    ctx.restore();
}


/* =========================================================
   DIBUJAR UNA LÍNEA
   ========================================================= */

function drawStroke(stroke) {

    if (
        !stroke.points ||
        stroke.points.length === 0
    ) {

        return;
    }


    ctx.save();


    ctx.strokeStyle =
        stroke.color;


    ctx.lineWidth = 5;


    ctx.lineCap =
        "round";


    ctx.lineJoin =
        "round";


    ctx.shadowColor =
        stroke.color;


    ctx.shadowBlur = 8;


    ctx.beginPath();


    const first =
        stroke.points[0];


    ctx.moveTo(
        first.x,
        first.y
    );


    for (
        let i = 1;
        i < stroke.points.length;
        i++
    ) {

        const point =
            stroke.points[i];


        ctx.lineTo(
            point.x,
            point.y
        );
    }


    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   LUMINOSIDAD
   ========================================================= */

lightnessSlider.addEventListener(
    "input",
    () => {

        lightness =
            Number(
                lightnessSlider.value
            );


        lightnessValue.textContent =
            `${lightness}%`;


        updatePalette();
    }
);


/* =========================================================
   CREAR AUDIO
   ========================================================= */

function createAudioContext() {

    if (audioContext) {

        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();
        }

        return;
    }


    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        alert(
            "Tu navegador no soporta Web Audio."
        );

        return;
    }


    audioContext =
        new AudioContext();


    masterGain =
        audioContext.createGain();


    masterGain.gain.value =
        0.18;


    masterGain.connect(
        audioContext.destination
    );
}


/* =========================================================
   REGISTRAR SONIDOS ACTIVOS
   ========================================================= */

function trackNode(node) {

    activeNodes.push(
        node
    );


    node.addEventListener(
        "ended",
        () => {

            const index =
                activeNodes.indexOf(
                    node
                );


            if (index >= 0) {

                activeNodes.splice(
                    index,
                    1
                );
            }
        }
    );
}


/* =========================================================
   OSCILADOR
   ========================================================= */

function createOscillator(
    type,
    frequency,
    when,
    duration,
    volume,
    destination = masterGain
) {

    const osc =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    osc.type =
        type;


    osc.frequency.setValueAtTime(
        frequency,
        when
    );


    gain.gain.setValueAtTime(
        0.0001,
        when
    );


    gain.gain.exponentialRampToValueAtTime(
        volume,
        when + 0.015
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        when + duration
    );


    osc.connect(gain);

    gain.connect(destination);


    osc.start(
        when
    );


    osc.stop(
        when + duration + 0.03
    );


    trackNode(
        osc
    );


    return osc;
}


/* =========================================================
   VIOLÍN
   ========================================================= */

function playViolin(
    frequency,
    when,
    duration,
    volume
) {

    const osc =
        createOscillator(
            "sawtooth",
            frequency,
            when,
            duration,
            volume
        );


    const vibrato =
        audioContext.createOscillator();


    const vibratoGain =
        audioContext.createGain();


    vibrato.frequency.value =
        5;


    vibratoGain.gain.value =
        frequency * 0.015;


    vibrato.connect(
        vibratoGain
    );


    vibratoGain.connect(
        osc.frequency
    );


    vibrato.start(
        when
    );


    vibrato.stop(
        when + duration
    );


    trackNode(
        vibrato
    );
}


/* =========================================================
   CUERDAS
   ========================================================= */

function playStrings(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "sawtooth",
        frequency,
        when,
        duration,
        volume * 0.6
    );


    createOscillator(
        "triangle",
        frequency * 2,
        when,
        duration,
        volume * 0.25
    );
}


/* =========================================================
   GUITARRA
   ========================================================= */

function playGuitar(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "triangle",
        frequency,
        when,
        duration * 0.7,
        volume
    );


    createOscillator(
        "sine",
        frequency * 2,
        when,
        duration * 0.35,
        volume * 0.25
    );
}


/* =========================================================
   PUNTEO
   ========================================================= */

function playPluck(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "triangle",
        frequency,
        when,
        duration * 0.45,
        volume
    );
}


/* =========================================================
   BAJO
   ========================================================= */

function playBass(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "sine",
        frequency / 2,
        when,
        duration,
        volume * 1.2
    );
}


/* =========================================================
   CAMPANA
   ========================================================= */

function playBell(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "sine",
        frequency,
        when,
        duration,
        volume
    );


    createOscillator(
        "sine",
        frequency * 2.4,
        when,
        duration * 0.7,
        volume * 0.35
    );


    createOscillator(
        "sine",
        frequency * 4.8,
        when,
        duration * 0.45,
        volume * 0.15
    );
}


/* =========================================================
   CORO
   ========================================================= */

function playChoir(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "sine",
        frequency * 0.997,
        when,
        duration,
        volume * 0.6
    );


    createOscillator(
        "sine",
        frequency * 1.003,
        when,
        duration,
        volume * 0.6
    );


    createOscillator(
        "triangle",
        frequency * 2,
        when,
        duration,
        volume * 0.15
    );
}


/* =========================================================
   PIANO
   ========================================================= */

function playPiano(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "triangle",
        frequency,
        when,
        duration * 0.8,
        volume
    );


    createOscillator(
        "sine",
        frequency * 2,
        when,
        duration * 0.45,
        volume * 0.25
    );
}


/* =========================================================
   ÓRGANO
   ========================================================= */

function playOrgan(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "sine",
        frequency,
        when,
        duration,
        volume * 0.7
    );


    createOscillator(
        "sine",
        frequency * 2,
        when,
        duration,
        volume * 0.3
    );


    createOscillator(
        "sine",
        frequency * 3,
        when,
        duration,
        volume * 0.12
    );
}


/* =========================================================
   SINTETIZADOR
   ========================================================= */

function playSynth(
    frequency,
    when,
    duration,
    volume
) {

    createOscillator(
        "square",
        frequency,
        when,
        duration,
        volume * 0.45
    );


    createOscillator(
        "sawtooth",
        frequency * 1.01,
        when,
        duration,
        volume * 0.25
    );
}


/* =========================================================
   MELODÍA

   ROSA = MELODÍA
   ========================================================= */

function playMelody(
    frequency,
    when,
    duration,
    volume
) {

    const osc =
        createOscillator(
            "triangle",
            frequency,
            when,
            duration,
            volume
        );


    const vibrato =
        audioContext.createOscillator();


    const vibratoGain =
        audioContext.createGain();


    vibrato.frequency.value =
        5.5;


    vibratoGain.gain.value =
        frequency * 0.01;


    vibrato.connect(
        vibratoGain
    );


    vibratoGain.connect(
        osc.frequency
    );


    vibrato.start(
        when
    );


    vibrato.stop(
        when + duration
    );


    trackNode(
        vibrato
    );
}


/* =========================================================
   PERCUSIÓN
   ========================================================= */

function playPercussion(
    frequency,
    when,
    duration,
    volume
) {

    const buffer =
        audioContext.createBuffer(
            1,
            audioContext.sampleRate * 0.15,
            audioContext.sampleRate
        );


    const data =
        buffer.getChannelData(0);


    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        data[i] =
            Math.random() * 2 - 1;
    }


    const source =
        audioContext.createBufferSource();


    source.buffer =
        buffer;


    const filter =
        audioContext.createBiquadFilter();


    filter.type =
        "bandpass";


    filter.frequency.value =
        Math.max(
            100,
            frequency
        );


    const gain =
        audioContext.createGain();


    gain.gain.setValueAtTime(
        volume,
        when
    );


    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        when + 0.15
    );


    source.connect(
        filter
    );


    filter.connect(
        gain
    );


    gain.connect(
        masterGain
    );


    source.start(
        when
    );


    source.stop(
        when + 0.16
    );


    trackNode(
        source
    );
}


/* =========================================================
   ELEGIR EL INSTRUMENTO
   ========================================================= */

function playSound(
    sound,
    frequency,
    when,
    duration,
    volume
) {

    switch (sound) {

        case "violin":

            playViolin(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "strings":

            playStrings(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "guitar":

            playGuitar(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "percussion":

            playPercussion(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "pluck":

            playPluck(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "bass":

            playBass(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "bell":

            playBell(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "choir":

            playChoir(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "piano":

            playPiano(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "organ":

            playOrgan(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "synth":

            playSynth(
                frequency,
                when,
                duration,
                volume
            );

            break;


        case "melody":

            playMelody(
                frequency,
                when,
                duration,
                volume
            );

            break;
    }
}


/* =========================================================
   REPRODUCIR
   ========================================================= */

playButton.addEventListener(
    "click",
    async () => {

        if (
            strokes.length === 0
        ) {

            alert(
                "Primero dibuja algo en el lienzo."
            );

            return;
        }


        createAudioContext();


        if (
            audioContext.state ===
            "suspended"
        ) {

            await audioContext.resume();
        }


        stopPlayback();


        const canvasWidth =
            canvas.clientWidth;


        const canvasHeight =
            canvas.clientHeight;


        const startTime =
            audioContext.currentTime +
            0.15;


        const TOTAL_TIME = 5;


        strokes.forEach(
            stroke => {

                if (
                    stroke.points.length === 0
                ) {

                    return;
                }


                /*
                 Reducimos los puntos
                 para que no haya demasiadas notas.
                */

                const step =
                    Math.max(
                        1,
                        Math.floor(
                            stroke.points.length /
                            18
                        )
                    );


                for (
                    let i = 0;
                    i < stroke.points.length;
                    i += step
                ) {

                    const point =
                        stroke.points[i];


                    /*
                     X = TIEMPO
                     */

                    const normalizedX =
                        Math.max(
                            0,
                            Math.min(
                                1,
                                point.x /
                                canvasWidth
                            )
                        );


                    const time =
                        normalizedX *
                        TOTAL_TIME;


                    /*
                     Y = NOTA
                     */

                    const normalizedY =
                        1 -
                        Math.max(
                            0,
                            Math.min(
                                1,
                                point.y /
                                canvasHeight
                            )
                        );


                    const noteIndex =
                        Math.round(
                            normalizedY *
                            (
                                NOTES.length -
                                1
                            )
                        );


                    const frequency =
                        NOTES[
                            noteIndex
                        ];


                    const when =
                        startTime +
                        time;


                    /*
                     El sonido viene del
                     COLOR ORIGINAL.

                     La luminosidad no
                     interviene aquí.
                     */

                    playSound(
                        stroke.sound,
                        frequency,
                        when,
                        0.28,
                        0.20
                    );
                }
            }
        );
    }
);


/* =========================================================
   DETENER
   ========================================================= */

stopButton.addEventListener(
    "click",
    stopPlayback
);


function stopPlayback() {

    activeNodes.forEach(
        node => {

            try {

                node.stop();

            } catch (error) {

                // Ya estaba detenido.
            }
        }
    );


    activeNodes = [];
}


/* =========================================================
   LIMPIAR
   ========================================================= */

clearButton.addEventListener(
    "click",
    () => {

        stopPlayback();

        strokes = [];

        redraw();
    }
);


/* =========================================================
   INICIAR
   ========================================================= */

createPalette();

updateSelectedText();

resizeCanvas();