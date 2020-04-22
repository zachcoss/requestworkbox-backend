class ExpressRequest {
    /**
     * Constructor
     * 
     * **/
    constructor(req) {
        this.body = req.body
        this.params = req.params
        this.query = req.query
        this.data = req.data
        this.sub = req.user.sub
        this.limit = 5
    }
}

module.exports = ExpressRequest