function stars() {
    function init() {
        const state = {
            alpha: 0.4,
            lastFrameRenderedAt: null
        };

        initCanvas(state);
        initStars(state);

        window.addEventListener("resize", onResize.bind(null, state));
        requestAnimationFrame(update.bind(null, state));
    }

    function initCanvas(state) {
        const element = document.createElement("canvas");

        state.canvas = {
            element: element,
            context: element.getContext("2d"),
            height: 0,
            width: 0
        };

        onResize(state);

        document.body.appendChild(state.canvas.element);
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
    }

    function initStars(state) {
        let i = 500;
        const stars = [];
        while (i--) {
            stars.push(createStar(state.canvas));
        }
        state.stars = stars;
    }

    function createStar(canvas) {
        function makeVelocity() {
            const maxVelocity = 400;
            return (Math.random() * maxVelocity + 1) - (maxVelocity / 2);
        }

        return {
            x: canvas.centreX,
            y: canvas.centreY,
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

            if (star.x > state.canvas.width || star.x < 0 ||
                star.y > state.canvas.height || star.y < 0) {
                state.stars[i] = createStar(state.canvas, true);
            }
        }
    }

    function draw(state) {
        let i = state.stars.length;
        const context = state.canvas.context;

        context.save();

        clearCanvas(state);

        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = state.alpha;

        while(i--) {
            let star = state.stars[i];
            context.fillStyle = `hsl(${star.hue},100%,60%)`;
            context.fillRect(star.x, star.y, star.size, star.size);
        }

        context.restore();
    }

    function clearCanvas(state) {
        state.canvas.context.fillStyle = "rgba(0,0,0,0.2)";
        state.canvas.context.fillRect(0, 0, state.canvas.width, state.canvas.height);
    }

    function update(state, timestamp) {
        requestAnimationFrame(update.bind(null, state));
        updateState(state, timestamp);
        draw(state);
    }

    init();
};

window.onload = stars;
