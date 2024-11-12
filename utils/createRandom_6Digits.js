// Generates a random 6-digit number and returns it as a string.
exports.createRandom = ()=>Math.floor(100000 + Math.random() * 900000).toString()