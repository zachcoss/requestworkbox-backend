const mongoose = require('mongoose')
const name = 'connection'
const schema = new mongoose.Schema({
    name: String
})
const model = mongoose.model(name, schema)

export default model