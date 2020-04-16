module.exports = async function (req, res, next) {
    try {
        console.log('incoming user')
        console.log(req.user)
        return next()
    } catch (err) {
        console.log(err)
        return next()
    }
}