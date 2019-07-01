const img = document.getElementById("img");
let imageLoaded = false;

function showImage() {
	const url = document.getElementById("imgInput").value;
	if (!/https?:\/\/.+\.(gif|jpe?g|png)/.test(url)) return;
	img.src = document.getElementById("imgInput").value;
	imageLoaded = false;
}

function generateGif() {
	if (!/https?:\/\/.+\.(gif|jpe?g|png)/.test(document.getElementById("imgInput").value)) {
		document.getElementById("status").innerHTML = "Invalid input!";
		return;
	}

	const xhttp = new XMLHttpRequest(), begin = Date.now();
	xhttp.onreadystatechange = () => {
		if (xhttp.readyState != 4) return;

		let xhttpExecTime = "! Execution time: " + ((Date.now() - begin) / 1000).toFixed(1) + " seconds.";
		if (xhttp.status == 0 || xhttp.status >= 400) {
			document.getElementById("status").innerHTML = "Request failed" + xhttpExecTime;
		} else {
			window.setTimeout(() => {
				document.getElementById("status").innerHTML = "Success" + xhttpExecTime;
				document.getElementById("animation").src = "animation.gif?t=" + Date.now();
			}, 1000)
		}
	}
	xhttp.open("POST", "/generate", true);
	xhttp.setRequestHeader("Content-Type", "application/json")

	const texts = Array.from(document.getElementsByClassName("textInput")).map(elem => elem.value),
		textColors = Array.from(document.getElementsByClassName("textColorInput")).map(elem => elem.value),
		textFonts = Array.from(document.getElementsByClassName("textFontInput")).map(elem => elem.value),
		textSizes = Array.from(document.getElementsByClassName("textSizeInput")).map(elem => elem.value),
		shadowColorElements = Array.from(document.getElementsByClassName("shadowColorInput")),
		shadowColors = shadowColorElements.map(elem => elem.disabled ? null : elem.value),
		textStyles = Array.from(document.getElementsByClassName("textStyleInput")).map(elem => elem.value),
		textXOffsets = Array.from(document.getElementsByClassName("textXInput")).map(elem => parseInt(elem.value)),
		textYOffsets = Array.from(document.getElementsByClassName("textYInput")).map(elem => parseInt(elem.value));

	const textBlocks = [];
	for (let i = 0; i < texts.length; i++) {
		textBlocks.push({
			text: texts[i],
			color: textColors[i],
			font: textFonts[i],
			size: textSizes[i],
			shadowColor: shadowColors && shadowColors[i],
			style: textStyles[i],
			xOffset: textXOffsets[i],
			yOffset: textYOffsets[i]
		})
	}

	xhttp.send(JSON.stringify({
		url: document.getElementById("imgInput").value,
		texts: textBlocks,
		delay: parseInt(document.getElementById("delayInput").value),
		degrees: document.getElementById("degreesInput").disabled ? null : parseInt(document.getElementById("degreesInput").value),
		direction: document.getElementById("degreesInput").disabled ? document.getElementById("directionInput").value : null,
		frames: parseInt(document.getElementById("frameInput").value),
		scale: parseFloat(document.getElementById("scaleInput").value),
		width: document.getElementById("widthInput").disabled ? null : parseInt(document.getElementById("widthInput").value),
		height: document.getElementById("heightInput").disabled ? null : parseInt(document.getElementById("heightInput").value),
		tileMove: document.getElementById("tileMoveInput").disabled ? null : parseFloat(document.getElementById("tileMoveInput").value)
	}));

	document.getElementById("status").innerHTML = "Generating GIF...";
}

// Functions relating to text blocks
function addTextBlock() {
	const newElement = document.createElement("div"), i = document.getElementsByClassName("textBlockInput").length;
	newElement.setAttribute("class", "textBlockInput");
	newElement.innerHTML = `Text: <input type="text" class="textInput" size="50"><br>
	Text Color: <input type="color" class="textColorInput"><br>
	Text Font:
	<select class="textFontInput">
		<option>Arial</option>
		<option>Times New Roman</option>
		<option>Sans-Serif</option>
		<option>Serif</option>
		<option>Monospace</option>
	</select><br>
	Text Size: <input type="number" class="textSizeInput" min="1" max="240" value="12"><br>
	Text Shadow Color:
	<input type="checkbox" class="textShadowInput" onchange="changeShadowDisabled(${i})">
	<input type="color" class="shadowColorInput"><br>
	Text Style:
	<select class="textStyleInput">
		<option>Normal</option>
		<option>Bold</option>
		<option>Italic</option>
		<option>Bold Italic</option>
	</select><br>
	Text X Offset: <input type="number" class="textXInput" min="0" max="4096" value="0"><br>
	Text Y Offset: <input type="number" class="textYInput" min="0" max="4096" value="0">`

	document.getElementById("textBlocks").appendChild(newElement);
	changeShadowDisabled(i)
}

function deleteTextBlock() {
	Array.from(document.getElementsByClassName("textBlockInput")).pop().remove()
}

// Functions with "disable" functionality
function changeShadowDisabled(i) {
	document.getElementsByClassName("shadowColorInput")[i].disabled = !document.getElementsByClassName("textShadowInput")[i].checked;
}

function changeDirectionDisabled(newValue) {
	document.getElementById("degreesInput").disabled = newValue;
}

function changeImageSizeDisabled(newValue) {
	document.getElementById("widthInput").disabled = newValue;
	document.getElementById("heightInput").disabled = newValue;
}

function changeTileMoveDisabled(newValue) {
	document.getElementById("tileMoveInput").disabled = newValue;
}

img.onload = () => {
	imageLoaded = true;
	document.getElementById("status").innerHTML = "Image loaded!";
}
img.onerror = () => document.getElementById("status").innerHTML = "Image failed to load.";

changeDirectionDisabled(true);
changeImageSizeDisabled(true);
changeShadowDisabled(0);
changeTileMoveDisabled(true);