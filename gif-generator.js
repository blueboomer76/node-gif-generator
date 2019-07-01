const fs = require("fs"),
    Canvas = require("canvas"),
    GifEncoder = require("gif-encoder");

function fetchImage(url, canvasWidth, canvasHeight) {
	return new Promise((resolve, reject) => {
		const img = new Canvas.Image();
		img.onload = () => {
			resolve({
				canvas: Canvas.createCanvas(canvasWidth || img.width, canvasHeight || img.height),
				img: img
			});
		};
		img.onerror = err => reject(err);
		img.src = url;
	})
}

function canvasFillText(ctx, options) {
	for (const textOptions of options.texts) {
		if (textOptions.text.length == 0) continue;
		ctx.fillStyle = textOptions.color;
		ctx.font = textOptions.style + " " + textOptions.size + "px " + textOptions.font;
		if (textOptions.shadowColor != null) {
			ctx.shadowColor = textOptions.shadowColor;
			ctx.shadowOffsetX = ctx.shadowOffsetY = Math.ceil(textOptions.size / 20);
		} else {
			ctx.shadowColor = null;
			ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
		}
		ctx.fillText(textOptions.text, textOptions.xOffset, textOptions.yOffset);
	}
}

module.exports = async options => {
	let canvas, img, canvasWidth, canvasHeight, scaledWidth, scaledHeight;
	await fetchImage(options.url, options.width, options.height)
		.then(data => {
			canvas = data.canvas;
			img = data.img;
			canvasWidth = canvas.width;
			canvasHeight = canvas.height;
			scaledWidth = img.width * options.scale;
			scaledHeight = img.height * options.scale;
		})
	if (canvasWidth * canvasHeight > 1048576) return Promise.reject(413);

    const ctx = canvas.getContext("2d"),
        gif = new GifEncoder(canvasWidth, canvasHeight);

    gif.pipe(fs.createWriteStream("public/animation.gif"));

    gif.setDelay(options.delay);
    gif.setRepeat(0);

    gif.writeHeader();
    gif.on("readable", () => gif.read())

	const frames = options.frames;
	let xPerFrame = 0, yPerFrame = 0;
	if (options.direction) {
		const atanDegrees = Math.atan(canvasHeight / canvasWidth) * 180 / Math.PI;
		switch (options.direction) {
			case "n":
				options.degrees = 90;
				break;
			case "ne":
				options.degrees = atanDegrees;
				break;
			case "e":
				options.degrees = 0;
				break;
			case "se":
				options.degrees = 360 - atanDegrees;
				break;
			case "s":
				options.degrees = 270;
				break;
			case "sw":
				options.degrees = atanDegrees + 180;
				break;
			case "w":
				options.degrees = 180;
				break;
			case "nw":
				options.degrees = 180 - atanDegrees;
		}
		if (options.tileMove) {
			xPerFrame = Math.cos(options.degrees * Math.PI / 180) * options.tileMove;
			yPerFrame = Math.sin(options.degrees * Math.PI / 180) * options.tileMove * -1;
		} else {
			if (options.direction.includes("n")) {
				yPerFrame = canvasHeight / frames * -1;
			} else if (options.direction.includes("s")) {
				yPerFrame = canvasHeight / frames;
			}
			if (options.direction.includes("w")) {
				xPerFrame = canvasWidth / frames * -1;
			} else if (options.direction.includes("e")) {
				xPerFrame = canvasWidth / frames;
			}
		}
	} else {
		xPerFrame = Math.cos(options.degrees * Math.PI / 180) * (options.tileMove || canvasWidth / frames);
		yPerFrame = Math.sin(options.degrees * Math.PI / 180) * (options.tileMove || canvasHeight / frames) * -1;
	}

	const drawLimits = {
		xMin: 0,
		xMax: Math.ceil(canvasWidth / scaledWidth),
		yMin: 0,
		yMax: Math.ceil(canvasHeight / scaledHeight)
	};

	if (options.degrees > 0 && options.degrees < 180) {
		drawLimits.yMax++;
	} else if (options.degrees > 180) {
		drawLimits.yMin--;
	}
	if (options.degrees > 90 && options.degrees < 270) {
		drawLimits.xMax++;
	} else if (options.degrees < 90 || options.degrees > 270) {
		drawLimits.xMin--;
	}

	let xOffset = 0, yOffset = 0;
	for (let f = 0; f < frames; f++) {
		let currXOffset = xPerFrame * f + xOffset * scaledWidth,
			currYOffset = yPerFrame * f + yOffset * scaledHeight;

		if (currXOffset < -1 * scaledWidth) {
			xOffset++;
			currXOffset = xPerFrame * f + xOffset * scaledWidth;
		} else if (currXOffset > scaledWidth) {
			xOffset--;
			currXOffset = xPerFrame * f + xOffset * scaledWidth
		}
		if (currYOffset < -1 * scaledHeight) {
			yOffset++;
			currYOffset = yPerFrame * f + yOffset * scaledHeight
		} else if (currYOffset > scaledHeight) {
			yOffset--;
			currYOffset = yPerFrame * f + yOffset * scaledHeight
		}

		for (let i = drawLimits.xMin; i < drawLimits.xMax; i++) {
			for (let j = drawLimits.yMin; j < drawLimits.yMax; j++) {
				ctx.drawImage(
					img,
					Math.floor(currXOffset + i * scaledWidth),
					Math.floor(currYOffset + j * scaledHeight),
					scaledWidth,
					scaledHeight
				)
			}
		}

		canvasFillText(ctx, options);
		gif.addFrame(ctx.getImageData(0, 0, canvasWidth, canvasHeight).data);
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	}

	gif.finish();
	return;
}