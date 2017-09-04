function stars() {
    const fragmentShaderSource = `#version 300 es
        precision mediump float;

        out vec4 outColor;

        void main() {
            outColor = vec4(1, 0, 0.5, 1);
        }`;
    const vertexShaderSource = `#version 300 es
            in vec2 a_position;

            // all shaders have a main function
            void main() {
                // gl_Position is a special variable a vertex shader
                // is responsible for setting
                gl_Position = vec4(a_position, 1, 1);
            }`;

    function init() {
        const state = {
            alpha: 0.4,
            lastFrameRenderedAt: null
        };

        initCanvas(state);
        initGL(state);
        initStars(state);

        window.addEventListener("resize", onResize.bind(null, state));
        requestAnimationFrame(update.bind(null, state));
    }

    function initCanvas(state) {
        const element = document.createElement("canvas");

        state.canvas = {
            element: element,
            context: element.getContext("webgl2"),
            height: 0,
            width: 0
        };

        document.body.appendChild(state.canvas.element);
    }

    function initGL(state) {
        function createShader(gl, type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (success) {
                return shader;
            }

            console.log(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

				let gl = state.canvas.context;

				const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
				const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

				const program = gl.createProgram();
				gl.attachShader(program, vertexShader);
				gl.attachShader(program, fragmentShader);
				gl.linkProgram(program);

				gl.useProgram(program);

				gl.clearColor(0.0, 0.0, 0.0, 1.0);
				gl.clearDepth(1.0);
				gl.enable(gl.BLEND);
				gl.disable(gl.DEPTH_TEST);
				gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(positionAttributeLocation);

				const positionsBuffer = gl.createBuffer();

        state.gl = gl;
        state.program = program;
        state.positions = positionsBuffer;
        state.positionAttributeLocation = positionAttributeLocation;

        onResize(state);
			}

    function onResize(state) {
        const height = window.innerHeight;
        const width = window.innerWidth;

        state.canvas.height = height;
        state.canvas.width = width;
        state.canvas.centreX = Math.round(width / 2);
        state.canvas.centreY = Math.round(height / 2);
        state.canvas.element.width = width;
        state.canvas.element.height = height;
				state.gl.viewport(0, 0, width, height);
    }

    function initStars(state) {
        let i = 5000;
        const stars = [];
        while (i--) {
            stars.push(createStar(state.canvas));
        }
        state.stars = stars;
    }

    function createStar(canvas) {
        function makeVelocity() {
            const maxVelocity = 0.6;
            return (Math.random() * maxVelocity) - (maxVelocity / 2);
        }

        return {
            x: 0,
            y: 0,
            velocityX: makeVelocity(),
            velocityY: makeVelocity(),
            size: Math.random() * 20 + 1,
            hue: Math.round(Math.random() * 360)
        };
    }

    function updateState(state, timestamp) {
        if (!state.lastFrameRenderedAt) {
            state.lastFrameRenderedAt = timestamp;
        }

        let progress = timestamp - state.lastFrameRenderedAt;
        state.lastFrameRenderedAt = timestamp;

        let i = state.stars.length;
        while(i--) {
            let star = state.stars[i];

            star.x += star.velocityX * progress / 1000;
            star.y += star.velocityY * progress / 1000;

            if (star.x > 1 || star.x < -1 ||
                star.y > 1 || star.y < -1) {
                state.stars[i] = createStar(state.canvas, true);
            }
        }
    }

    function draw(state) {
        const gl = state.gl,
              positions = state.positions,
              positionAttributeLocation = state.positionAttributeLocation;

        const size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(
            positionAttributeLocation, size, type, normalize, stride, offset);

        let i = state.stars.length;
        const points = [];
        while(i--) {
            let star = state.stars[i];
            points.push(star.x);
            points.push(star.y);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, positions);
				gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);

				gl.drawArrays(gl.POINTS, 0, state.stars.length);
				gl.flush();
    }

    function clearCanvas(state) {
        const gl = state.gl;
        gl.clearColor(0, 0, 0, 0);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    function update(state, timestamp) {
        requestAnimationFrame(update.bind(null, state));
        updateState(state, timestamp);
        draw(state);
    }

    init();
};

window.onload = stars;
