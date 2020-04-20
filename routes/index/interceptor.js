module.exports = async function (req, res, next) {
    try {
        console.log('incoming user')
        
        if (!req.user || !req.user.sub) {
            return res.status(500).send('user not found')
        } else {
            console.log(req.user.sub)
            return next()
        }
    } catch (err) {
        console.log(err)
        return res.status(500).send('error intercepting user')
    }
}