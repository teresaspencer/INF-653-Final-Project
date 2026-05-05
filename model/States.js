// Mongoose scheme with stateCode (string, required, unique) and funfacts (array of strings)
// stateCode: string, required, unique funfacts: array of strings

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const statesSchema = new Schema({
    stateCode: {
        type: String,
        required: true,
        unique: true
    },
    funfacts: {
        type: [String],
        default: []
    }
})

module.exports = mongoose.model('State', statesSchema)