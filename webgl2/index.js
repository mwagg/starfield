const vertexShaderSource = `#version 300 es
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec2 a_position;

    uniform mat3 u_matrix;

    // all shaders have a main function
    void main() {
        // gl_Position is a special variable a vertex shader
        // is responsible for setting
        gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
    }`;

const fragmentShaderSource = `#version 300 es
    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default. It means "medium precision"
    precision mediump float;

    uniform vec4 u_color;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    void main() {
      // Just set the output to a constant redish-purple
      outColor = u_color;
    }`;

const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) { return shader; }
    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
};

const createProgram = (gl, vertexShader, fragmentShader) => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) { return program; }
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
};

const initWebGL = () => {
    let state = {};
    state.rotation = 0;

    const canvas = document.createElement("canvas");
    state.canvas = canvas;
    document.body.appendChild(canvas);

    gl = canvas.getContext("webgl2");
    state.gl = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = createProgram(gl, vertexShader, fragmentShader);
    state.program = program;

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();

    const colorLocation = gl.getUniformLocation(program, "u_color");
    state.colorLocation = colorLocation;

    const matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");
    state.matrixUniformLocation = matrixUniformLocation;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    let vertexArray = gl.createVertexArray();
    state.vertexArray = vertexArray;

    gl.bindVertexArray(vertexArray);
    gl.enableVertexAttribArray(positionAttributeLocation);

    const size = 2;          // 2 components per iteration
    const type = gl.FLOAT;   // the data is 32bit floats
    const normalize = false; // don't normalize the data
    const stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    const offset = 0;        // squaret at the beginning of the buffer
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

    window.onresize = onResize.bind(null, state);
    onResize(state);

    initSquares(state);

    state.lastFrameRenderedAt = 0;
    requestAnimationFrame(tick.bind(null, state));
};

const initSquares = (state) => {
    let i = 500;
    const squares = [];
    while (i--) {
        squares.push(createSquare(state));
    }
    state.squares = squares;
};

const createSquare = (state) => {
    function makeVelocity() {
        const maxVelocity = 500;
        return (Math.random() * maxVelocity) - (maxVelocity / 2);
    }

    return {
        x: state.centreX,
        y: state.centreY,
        velocityX: makeVelocity(),
        velocityY: makeVelocity(),
        size: Math.random() * 20 + 1,
        colour: [Math.random(), Math.random(), Math.random()]
    };
};

const onResize = (state) => {
    const height = window.innerHeight;
    const width = window.innerWidth;

    state.height = height;
    state.width = width;
    state.centreX = Math.round(width / 2);
    state.centreY = Math.round(height / 2);
    state.canvas.width = width;
    state.canvas.height = height;
};

const tick = (state, timestamp) => {
    let progress = timestamp - state.lastFrameRenderedAt;
    state.lastFrameRenderedAt = timestamp;

    requestAnimationFrame(tick.bind(null, state));
    updateState(state, progress);
    draw(state);
};

const updateState = (state, progress) => {
    state.rotation = (state.rotation + (progress / 1000 * 360)) % 360;
    let i = state.squares.length;
    while(i--) {
        let square = state.squares[i];

        square.x += square.velocityX * progress / 1000;
        square.y += square.velocityY * progress / 1000;

        if (square.x > state.width || square.x < 0 ||
            square.y > state.height || square.y < 0) {
            state.squares[i] = createSquare(state);
        }
    }

};

const draw = (state) => {
    const { gl,
            program,
            vertexArray,
            matrixUniformLocation,
            colorLocation,
            squares,
            rotation,
            width,
            height } = state;

		gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.bindVertexArray(vertexArray);
    setRectangle(gl, 0, 0, 20, 20);

    drawSquares(gl, squares, width, height, colorLocation, matrixUniformLocation, rotation);
};

const drawSquares = (gl, squares, width, height, colorLocation, matrixUniformLocation, rotation) => {
    let i = squares.length;
    while(i--) {
        let square = squares[i];
        let matrix = mat3.create();
        mat3.projection(matrix, width, height);
        mat3.translate(matrix, matrix, vec2.fromValues(square.x, square.y));
        // mat3.rotate(matrix, matrix, glMatrix.toRadian(rotation));
        // mat3.translate(matrix, matrix, vec2.fromValues(-10, -10));

        gl.uniform4f(colorLocation, square.colour[0], square.colour[1], square.colour[2], 1);
        gl.uniformMatrix3fv(matrixUniformLocation, false, matrix);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
};

const randomInt = (range) => { return Math.floor(Math.random() * range); };

const setRectangle = (gl, x, y, width, height) => {
    const x1 = x;
    const x2 = x + width;
    const y1 = y;
    const y2 = y + height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1,
        x2, y2]), gl.STATIC_DRAW);
};

window.onload = initWebGL;
