const { Events, ActivityType } = require("discord.js");
const axios = require("axios");
const { movieDbAPI } = process.env;
const fs = require("fs");
const path = require("path");
const { createStream } = require("table");
const tableConfig = require("../config & JSON/tableConfig.js");
const c = require("ansi-colors");
const { data } = require("../commands/get.js");

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		console.log(c.green("Ready!"));
		client.user.setPresence({
			activities: [
				{ name: `watching all the movies!!`, type: ActivityType.Competing },
			],
			status: "dnd"
		});

		// MOVIE DATA
		const movieStatus = [
			[
				`${c.bold("Total Movie Pages")}`, `${c.bold("Total Movie")}`,
				`${c.bold("Proccess Data")}`, `${c.bold("Status Data")}`,
				`${c.bold("Error Message")}`
			]
		];
		
		let MoviePages = "", MoviePagesRed = "", MoviePagesGray = "UnKnown";
		let TotalMovie = "", TotalMovieGray = "UnKnown";
		let StatusData = "", StatusDataRed = "", StatusDataGray = "UnKnown";
		let	ProcessData = "",	ProcessDataRed = "", ProcessDataGray = "UnKnown";
		let	ErrorMessageMovie = "", ErrorMessageMovieGreen = "Nothing ✔";

		const baseUrls = `https://api.themoviedb.org/3/discover/movie?api_key=${movieDbAPI}`;
		let allMovies = [];

		async function fetchMovies(page) {
			try {
				const response = await axios.get(`${baseUrls}&page=${page}`);
				const movies = response.data.results;
				allMovies.push(
					...movies.map((movie) => movie.original_title || movie.title),
				);
				if (page === 500) {
					MoviePages = `${page} ✔`;
				}
			} catch (error) {
				if (page === undefined) return;
				MoviePagesRed = "Failed ❌";
				ErrorMessageMovie = error.message;
			}
		}

		async function fetchAllMovies() {
			const totalPages = 500; // Ganti dengan jumlah halaman yang sesuai
			const promises = [];
			for (let page = 1; page <= totalPages; page++) {
				promises.push(fetchMovies(page));
				// Limit jumlah permintaan secara bersamaan
				if (promises.length === 10 || page === totalPages) {
					await Promise.all(promises);
					promises.length = 0; // Bersihkan array promises
				}
			}
			await saveData();
		}

		async function saveData() {
			const filePath = path.resolve(__dirname, "../config & JSON/movieNameList.json");
			try {
				let existingMovies = [];
				if (fs.existsSync(filePath)) {
					existingMovies = require(filePath).name;
				}

				const uniqueMovies = [...new Set(allMovies.concat(existingMovies))];
				const datajson = { name: uniqueMovies };
				TotalMovie = `${datajson.name.length} ✔`;
				// Menggunakan fs.promises.writeFile untuk menulis file
				await fs.promises.writeFile(filePath, JSON.stringify(datajson, null, 2));
				StatusData = "Saved ✔";
			} catch (error) {
				StatusDataRed = "Failed ❌";
				console.log(error)
				ErrorMessageMovie = error.message;
			}
		}

		try {
			ProcessData = "Success ✔";
			await fetchAllMovies();
		} catch (error) {
			ProcessDataRed = "Failed ❌";
			ErrorMessageMovie = error.message;
		}

		movieStatus.push([
			`${c.greenBright(MoviePages) || c.redBright(MoviePagesRed) || c.gray(MoviePagesGray)}`,
			`${c.greenBright(TotalMovie) || c.gray(TotalMovieGray)}`,
			`${c.greenBright(ProcessData) || c.redBright(ProcessDataRed) || c.gray(ProcessDataGray)}`,
			`${c.greenBright(StatusData) || c.redBright(StatusDataRed) || c.gray(StatusDataGray)}`,
			`${c.red(ErrorMessageMovie) || c.greenBright(ErrorMessageMovieGreen)}`
		])

		let stream = createStream(tableConfig);
		stream.write(movieStatus[0]);
		stream.write(movieStatus[1]);
		console.log(" ");

		setInterval(async () => {
			try {
				await fetchAllMovies();
				client.channels.cache.get("1256434346727051294").send(`〔 ${TotalMovie} Movies 〕➜ Updated!!`);
			} catch (error) {
				client.channels.cache.get("1256434346727051294").send(`<@675212142701576234>〔 ${TotalMovieGray} 〕➜ ${ErrorMessageMovie}!!`);
			}
		}, 20 * 60 * 1000); // 20 menit
	}
};