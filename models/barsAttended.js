var mongoose = require('mongoose');
var Schema = mongoose.Schema; 

var BarsAttended = new Schema({
	bar_id: String,
	attendees: [String],
	count: Number,
	date: Date
});

module.exports = mongoose.model('BarsAttended', BarsAttended);