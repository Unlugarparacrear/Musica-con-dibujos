/* =========================================================
   DIBUJA MÚSICA
   ========================================================= */


/* =========================================================
   CANVAS
   ========================================================= */

const canvas = document.getElementById("musicCanvas");
const ctx = canvas.getContext("2d");


/* =========================================================
   CONTROLES
   ========================================================= */

const paletteElement =
    document.getElementById("palette");

const lightnessSlider =
    document.getElementById("lightness");

const lightnessValue =
    document.getElementById("lightnessValue");

const selectedColorName =
    document.getElementById("selectedColorName");

const brushSizeSlider =
    document.getElementById("brushSize");

const brushSizeValue =
    document.getElementById("brushSizeValue");

const toolButtons =
    document.querySelectorAll(".tool-button");

const playButton =
    document.getElementById("playButton");

const stopButton =
    document.getElementById("stopButton");

const clearButton =
    document.getElementById("clearButton");


/* =========================================================
   COLORES
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
        sound: "melody"
    }

};


/* =========================================================
   ESTADO
   ========================================================= */

let selectedColor = "pink";

let lightness =
    Number(lightnessSlider.value);

let currentTool = "brush";

let brushSize =
    Number(brushSizeSlider.value);

let strokes = [];

let currentStroke = null;

let isDrawing = false;

let lastPointerPoint = null;


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

let masterGain = null;

let activeNodes = [];


/* =========================================================
   NOTAS
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
   UTILIDADES DE COLOR
   ========================================================= */

function getColor(hue) {

    return `hsl(${hue}, 80%, ${lightness}%)`;

}


/* =========================================================
   PALETA
   ========================================================= */

function createPalette() {

    paletteElement.innerHTML = "";

    Object.entries(COLOR_FAMILIES).forEach(
        ([key, color]) => {

            const button =
                document.createElement("button");

            button.className =
                "color-button";

            if (key === selectedColor) {
                button.classList.add("selected");
            }


            button.title =
                `${color.name} — ${color.sound}`;


            const circle =
                document.createElement("span");

            circle.className =
                "color-circle";

            circle.style.background =
                getColor(color.hue);

            circle.style.color =
                getColor(color.hue);


            button.appendChild(circle);


            button.addEventListener(
                "click",
                () => {

                    selectedColor = key;

                    selectedColorName.textContent =
                        color.name;

                    createPalette();

                }
            );


            paletteElement.appendChild(button);

        }
    );

}


createPalette();


/* =========================================================
   LUMINOSIDAD
   ========================================================= */

lightnessSlider.addEventListener(
    "input",
    () => {

        lightness =
            Number(lightnessSlider.value);

        lightnessValue.textContent =
            `${lightness}%`;

        createPalette();

    }
);


/* =========================================================
   TAMAÑO DEL PINCEL
   ========================================================= */

brushSizeSlider.addEventListener(
    "input",
    () => {

        brushSize =
            Number(brushSizeSlider.value);

        brushSizeValue.textContent =
            `${brushSize} px`;

    }
);


/* =========================================================
   HERRAMIENTAS
   ========================================================= */

toolButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            currentTool =
                button.dataset.tool;


            toolButtons.forEach(
                otherButton => {

                    otherButton.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add("active");


            updateCursor();

        }
    );

});


function updateCursor() {

    if (currentTool === "eraser") {

        canvas.style.cursor = "cell";

    } else {

        canvas.style.cursor = "crosshair";

    }

}


/* =========================================================
   RESIZE DEL CANVAS
   ========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        Math.round(rect.width * dpr);

    canvas.height =
        Math.round(rect.height * dpr);


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

function getCanvasPoint(event) {

    const rect =
        canvas.getBoundingClientRect();


    return {

        x: event.clientX - rect.left,

        y: event.clientY - rect.top

    };

}


/* =========================================================
   POINTER DOWN
   ========================================================= */

canvas.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        canvas.setPointerCapture(
            event.pointerId
        );


        const point =
            getCanvasPoint(event);


        isDrawing = true;

        lastPointerPoint = point;


        /* BORRADOR */

        if (currentTool === "eraser") {

            eraseAt(point);

            return;

        }


        /* COLOR */

        const color =
            COLOR_FAMILIES[selectedColor];


        currentStroke = {

            colorKey: selectedColor,

            sound: color.sound,

            color: getColor(color.hue),

            size: brushSize,

            brushType: currentTool,

            points: [point]

        };


        strokes.push(currentStroke);


        redraw();

    }
);


/* =========================================================
   POINTER MOVE
   ========================================================= */

canvas.addEventListener(
    "pointermove",
    event => {

        if (!isDrawing) {
            return;
        }


        event.preventDefault();


        const point =
            getCanvasPoint(event);


        /* BORRADOR */

        if (currentTool === "eraser") {

            eraseBetween(
                lastPointerPoint,
                point
            );

            lastPointerPoint =
                point;

            return;

        }


        /* PINCEL */

        if (currentStroke) {

            const previous =
                currentStroke.points[
                    currentStroke.points.length - 1
                ];


            const distance =
                Math.hypot(
                    point.x - previous.x,
                    point.y - previous.y
                );


            /*
                Guardamos bastantes puntos para que
                el borrador y los pinceles sean suaves.
            */

            if (distance >= 1.5) {

                currentStroke.points.push(
                    point
                );

                redraw();

            }

        }


        lastPointerPoint =
            point;

    }
);


/* =========================================================
   POINTER UP
   ========================================================= */

canvas.addEventListener(
    "pointerup",
    finishDrawing
);


canvas.addEventListener(
    "pointercancel",
    finishDrawing
);


function finishDrawing() {

    isDrawing = false;

    currentStroke = null;

    lastPointerPoint = null;

    redraw();

}


/* =========================================================
   DISTANCIA
   ========================================================= */

function distanceBetween(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


/* =========================================================
   BORRADOR
   ========================================================= */

/*
    El borrador no pinta encima del canvas.
    Elimina partes de los trazos existentes.

    De esta manera los dibujos siguen siendo vectores
    y continúan teniendo su sonido original.
*/

function eraseAt(point) {

    const radius =
        Math.max(brushSize / 2, 3);


    const newStrokes = [];


    strokes.forEach(stroke => {

        let segment = [];


        stroke.points.forEach(p => {

            const distance =
                distanceBetween(
                    p,
                    point
                );


            if (distance <= radius) {

                /*
                    Terminamos el segmento
                    que estaba siendo dibujado.
                */

                if (segment.length >= 2) {

                    newStrokes.push({

                        ...stroke,

                        points: segment

                    });

                }


                segment = [];

            } else {

                segment.push(p);

            }

        });


        /*
            Guardamos el último segmento.
        */

        if (segment.length >= 2) {

            newStrokes.push({

                ...stroke,

                points: segment

            });

        }

    });


    strokes = newStrokes;

    redraw();

}


/* =========================================================
   BORRAR ENTRE DOS PUNTOS
   ========================================================= */

function eraseBetween(from, to) {

    const distance =
        distanceBetween(
            from,
            to
        );


    const stepSize =
        Math.max(
            2,
            brushSize * 0.35
        );


    const steps =
        Math.max(
            1,
            Math.ceil(distance / stepSize)
        );


    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;


        const point = {

            x:
                from.x +
                (to.x - from.x) * t,

            y:
                from.y +
                (to.y - from.y) * t

        };


        eraseAtWithoutRedraw(point);

    }


    redraw();

}


/* =========================================================
   BORRADOR INTERNO
   ========================================================= */

function eraseAtWithoutRedraw(point) {

    const radius =
        Math.max(brushSize / 2, 3);


    const newStrokes = [];


    strokes.forEach(stroke => {

        let segment = [];


        stroke.points.forEach(p => {

            const distance =
                distanceBetween(
                    p,
                    point
                );


            if (distance <= radius) {

                if (segment.length >= 2) {

                    newStrokes.push({

                        ...stroke,

                        points: segment

                    });

                }


                segment = [];

            } else {

                segment.push(p);

            }

        });


        if (segment.length >= 2) {

            newStrokes.push({

                ...stroke,

                points: segment

            });

        }

    });


    strokes = newStrokes;

}


/* =========================================================
   REDIBUJAR TODO
   ========================================================= */

function redraw() {

    const rect =
        canvas.getBoundingClientRect();


    ctx.clearRect(
        0,
        0,
        rect.width,
        rect.height
    );


    drawBackground();


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
   FONDO / CUADRÍCULA
   ========================================================= */

function drawBackground() {

    const rect =
        canvas.getBoundingClientRect();


    ctx.fillStyle =
        "#101625";


    ctx.fillRect(
        0,
        0,
        rect.width,
        rect.height
    );


    const gridSize = 40;


    ctx.strokeStyle =
        "rgba(255,255,255,0.055)";


    ctx.lineWidth = 1;


    for (
        let x = 0;
        x <= rect.width;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            rect.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= rect.height;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            rect.width,
            y
        );

        ctx.stroke();

    }


    /*
        Líneas principales
    */

    ctx.strokeStyle =
        "rgba(255,255,255,0.10)";


    for (
        let x = 0;
        x <= rect.width;
        x += gridSize * 4
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x,
            rect.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y <= rect.height;
        y += gridSize * 4
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(
            rect.width,
            y
        );

        ctx.stroke();

    }

}


/* =========================================================
   DIBUJAR TRAZO
   ========================================================= */

function drawStroke(stroke) {

    const points =
        stroke.points;


    if (!points.length) {
        return;
    }


    /*
        PUNTO ÚNICO
    */

    if (points.length === 1) {

        ctx.beginPath();

        ctx.fillStyle =
            stroke.color;

        ctx.arc(
            points[0].x,
            points[0].y,
            stroke.size / 2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        return;

    }


    /*
        PINCEL REDONDO
    */

    if (stroke.brushType === "brush") {

        drawRoundStroke(stroke);

        return;

    }


    /*
        PINCEL CON PUNTA
    */

    if (stroke.brushType === "pointed") {

        drawPointedStroke(stroke);

        return;

    }


    /*
        PINCEL SUAVE
    */

    if (stroke.brushType === "soft") {

        drawSoftStroke(stroke);

        return;

    }

}


/* =========================================================
   PINCEL REDONDO
   ========================================================= */

function drawRoundStroke(stroke) {

    const points =
        stroke.points;


    ctx.save();


    ctx.strokeStyle =
        stroke.color;

    ctx.lineWidth =
        stroke.size;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    ctx.shadowColor =
        stroke.color;

    ctx.shadowBlur =
        Math.max(
            2,
            stroke.size * 0.35
        );


    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );


    for (
        let i = 1;
        i < points.length;
        i++
    ) {

        ctx.lineTo(
            points[i].x,
            points[i].y
        );

    }


    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   PINCEL CON PUNTA
   ========================================================= */

/*
    Este pincel comienza fino y aumenta
    progresivamente de grosor.

    Por eso genera un extremo "puntiagudo".
*/

function drawPointedStroke(stroke) {

    const points =
        stroke.points;


    if (points.length < 2) {
        return;
    }


    ctx.save();

    ctx.strokeStyle =
        stroke.color;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";


    ctx.shadowColor =
        stroke.color;

    ctx.shadowBlur =
        Math.max(
            1,
            stroke.size * 0.25
        );


    const totalSegments =
        points.length - 1;


    for (
        let i = 1;
        i < points.length;
        i++
    ) {

        const start =
            points[i - 1];

        const end =
            points[i];


        const progress =
            i / totalSegments;


        /*
            Empieza muy fino y aumenta.
        */

        const width =
            Math.max(
                1,
                stroke.size *
                (
                    0.08 +
                    progress * 0.92
                )
            );


        ctx.lineWidth =
            width;


        ctx.beginPath();

        ctx.moveTo(
            start.x,
            start.y
        );

        ctx.lineTo(
            end.x,
            end.y
        );

        ctx.stroke();

    }


    ctx.restore();

}


/* =========================================================
   PINCEL SUAVE
   ========================================================= */

function drawSoftStroke(stroke) {

    const points =
        stroke.points;


    ctx.save();


    /*
        Primera capa
    */

    ctx.globalAlpha = 0.18;

    ctx.strokeStyle =
        stroke.color;

    ctx.lineWidth =
        stroke.size * 2.2;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.shadowColor =
        stroke.color;

    ctx.shadowBlur =
        stroke.size * 2;


    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );


    for (
        let i = 1;
        i < points.length;
        i++
    ) {

        ctx.lineTo(
            points[i].x,
            points[i].y
        );

    }


    ctx.stroke();


    /*
        Segunda capa más definida
    */

    ctx.globalAlpha = 0.65;

    ctx.lineWidth =
        stroke.size * 0.75;

    ctx.shadowBlur = 0;


    ctx.beginPath();

    ctx.moveTo(
        points[0].x,
        points[0].y
    );


    for (
        let i = 1;
        i < points.length;
        i++
    ) {

        ctx.lineTo(
            points[i].x,
            points[i].y
        );

    }


    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   AUDIO CONTEXT
   ========================================================= */

function setupAudio() {

    if (audioContext) {
        return;
    }


    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();


    masterGain =
        audioContext.createGain();


    masterGain.gain.value =
        0.18;


    masterGain.connect(
        audioContext.destination
    );

}


/* =========================================================
   DETENER SONIDOS
   ========================================================= */

function stopActiveNodes() {

    activeNodes.forEach(
        node => {

            try {

                node.stop();

            } catch (error) {

                /* Ya estaba detenido */

            }

        }
    );


    activeNodes = [];

}


/* =========================================================
   FRECUENCIA SEGÚN Y
   ========================================================= */

function getFrequencyFromY(y) {

    const rect =
        canvas.getBoundingClientRect();


    const normalized =
        1 -
        Math.max(
            0,
            Math.min(
                1,
                y / rect.height
            )
        );


    const index =
        Math.round(
            normalized *
            (NOTES.length - 1)
        );


    return NOTES[index];

}


/* =========================================================
   OSCILADOR BASE
   ========================================================= */

function createOscillatorSound(
    frequency,
    duration,
    type,
    volume,
    startTime
) {

    const oscillator =
        audioContext.createOscillator();


    const gain =
        audioContext.createGain();


    oscillator.type =
        type;


    oscillator.frequency.setValueAtTime(
        frequency,
        startTime
    );


    gain.gain.setValueAtTime(
        0,
        startTime
    );


    gain.gain.linearRampToValueAtTime(
        volume,
        startTime + 0.015
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        startTime + duration
    );


    oscillator.connect(gain);

    gain.connect(masterGain);


    oscillator.start(startTime);

    oscillator.stop(
        startTime + duration
    );


    activeNodes.push(
        oscillator
    );

}


/* =========================================================
   SONIDOS
   ========================================================= */

function playViolin(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        duration,
        "sawtooth",
        0.08,
        time
    );

}


function playStrings(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        duration,
        "sawtooth",
        0.06,
        time
    );

}


function playGuitar(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        duration,
        "triangle",
        0.12,
        time
    );

}


function playPercussion(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        Math.min(
            duration,
            0.12
        ),
        "square",
        0.07,
        time
    );

}


function playPluck(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        Math.min(
            duration,
            0.45
        ),
        "triangle",
        0.12,
        time
    );

}


function playBass(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency / 2,
        duration,
        "sine",
        0.14,
        time
    );

}


function playBell(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency * 2,
        Math.min(
            duration,
            1
        ),
        "sine",
        0.08,
        time
    );

}


function playChoir(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        duration,
        "sine",
        0.07,
        time
    );


    createOscillatorSound(
        frequency * 1.5,
        duration,
        "sine",
        0.035,
        time
    );

}


function playPiano(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        Math.min(
            duration,
            1.5
        ),
        "triangle",
        0.12,
        time
    );

}


function playOrgan(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        duration,
        "sine",
        0.08,
        time
    );


    createOscillatorSound(
        frequency * 2,
        duration,
        "sine",
        0.035,
        time
    );

}


function playSynth(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        duration,
        "sawtooth",
        0.055,
        time
    );

}


function playMelody(
    frequency,
    duration,
    time
) {

    createOscillatorSound(
        frequency,
        Math.min(
            duration,
            0.8
        ),
        "triangle",
        0.13,
        time
    );

}


/* =========================================================
   REPRODUCIR UN SONIDO
   ========================================================= */

function playSound(
    sound,
    frequency,
    duration,
    time
) {

    switch (sound) {

        case "violin":
            playViolin(
                frequency,
                duration,
                time
            );
            break;


        case "strings":
            playStrings(
                frequency,
                duration,
                time
            );
            break;


        case "guitar":
            playGuitar(
                frequency,
                duration,
                time
            );
            break;


        case "percussion":
            playPercussion(
                frequency,
                duration,
                time
            );
            break;


        case "pluck":
            playPluck(
                frequency,
                duration,
                time
            );
            break;


        case "bass":
            playBass(
                frequency,
                duration,
                time
            );
            break;


        case "bell":
            playBell(
                frequency,
                duration,
                time
            );
            break;


        case "choir":
            playChoir(
                frequency,
                duration,
                time
            );
            break;


        case "piano":
            playPiano(
                frequency,
                duration,
                time
            );
            break;


        case "organ":
            playOrgan(
                frequency,
                duration,
                time
            );
            break;


        case "synth":
            playSynth(
                frequency,
                duration,
                time
            );
            break;


        case "melody":
            playMelody(
                frequency,
                duration,
                time
            );
            break;

    }

}


/* =========================================================
   REPRODUCIR DIBUJO
   ========================================================= */

function playDrawing() {

    setupAudio();


    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }


    stopActiveNodes();


    if (!strokes.length) {
        return;
    }


    const rect =
        canvas.getBoundingClientRect();


    const totalDuration =
        5;


    const now =
        audioContext.currentTime;


    /*
        Cada punto de cada trazo se convierte
        en una nota.

        X = momento en el tiempo.
        Y = altura de la nota.
        Color = instrumento.
    */

    strokes.forEach(stroke => {

        stroke.points.forEach(
            point => {

                const normalizedX =
                    Math.max(
                        0,
                        Math.min(
                            1,
                            point.x /
                            rect.width
                        )
                    );


                const time =
                    now +
                    normalizedX *
                    totalDuration;


                const frequency =
                    getFrequencyFromY(
                        point.y
                    );


                const noteDuration =
                    0.16;


                playSound(
                    stroke.sound,
                    frequency,
                    noteDuration,
                    time
                );

            }
        );

    });

}


/* =========================================================
   BOTÓN REPRODUCIR
   ========================================================= */

playButton.addEventListener(
    "click",
    playDrawing
);


/* =========================================================
   BOTÓN DETENER
   ========================================================= */

stopButton.addEventListener(
    "click",
    () => {

        stopActiveNodes();

    }
);


/* =========================================================
   BOTÓN LIMPIAR
   ========================================================= */

clearButton.addEventListener(
    "click",
    () => {

        stopActiveNodes();

        strokes = [];

        currentStroke = null;

        redraw();

    }
);


/* =========================================================
   INICIO
   ========================================================= */

window.addEventListener(
    "load",
    () => {

        resizeCanvas();

        updateCursor();

    }
);