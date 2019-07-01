const express = require("express"),
	bodyParser = require("body-parser"),
	path = require("path");
const createGif = require("./gif-generator.js");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/", (request, response) => {
	response.sendFile(path.join(__dirname, "index.html"))
})

app.post("/generate", (request, response) => {
	createGif(request.body)
		.then(() => response.sendStatus(200))
		.catch(err => {
			if (!isNaN(Number(err))) {
				response.sendStatus(err);
			} else {
				console.error(err);
				response.sendStatus(500)
			}
		});
})

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Express app is listening on port " + listener.address().port);
});