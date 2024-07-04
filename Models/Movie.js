const  { mongoose, Schema, ObjectId } = require("../node_modules/mongoose");

const Movie = Schema({
	id: ObjectId,
	primaryKey: { type: String, unique: true },
	guildID: { type: String, index: true },
	movieID: String,
	imdbID: String,
	adult: Boolean,
	name: String,
	revenue: String,
	posterURL: String,
	homepage: String,
	overview: String,
	tagline: String,
	genres: String,
	from: String,
	language: String,
	spoken_languages: String,
	releaseDate: Date,
	runtime: Number,
	budget: String,
	rating: Number,
	ratingCount: String,
	popularity: Number,
	production_companies: String,
	submittedBy: String,
	submitted: { type: Date, default: Date.now },
	viewed: { type: Boolean, default: false },
	viewedDate: { type: Date, default: null },
});

module.exports = mongoose.model("Movie", Movie);