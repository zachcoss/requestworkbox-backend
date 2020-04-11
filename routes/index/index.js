async function getIndex() {
    return 'OK'
}

module.exports = async function (req, res, next) {
    try {
        const response = await getIndex()
        return res.status(200).send(response)
    } catch(err) {
        console.log(err)
        return res.status(500).send('error on get index router')
    }
}