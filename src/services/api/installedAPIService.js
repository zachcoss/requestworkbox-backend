const
    axios = require('axios'),
    schema = require('../schema/apiSchema'),
    ExpressRequest = require('../../shared/plugins/network/expressRequest');

class InstalledService extends ExpressRequest {

    constructor(req) {
        super(req)
        if (this.body.api_id) this.api_id = this.body.api_id
        if (this.body.authCode) this.authCode = this.body.authCode
        this.oauthMethod = 'POST'
    }

    async installedAPI() {
        // confirm sub exists
        if (!this.sub) return Promise.reject('missing sub')
        // filter by sub
        const filter = {}
        filter.sub = this.sub
        // find and return docs
        const docs = await schema.installed.find(filter).exec()
        return docs
    }

    async install() {
        // confirm sub and api_id exists
        if (!this.sub) return Promise.reject('missing sub')
        if (!this.api_id) return Promise.reject('missing api_id')
        // return api document
        const api = await this.findSpecificAvailableAPI()
        // confirm there are no pending (all active) installations
        const pendingAPI = await this.findSpecificInstalledAPI()
        // grab redirect url based on api oauth register details
        const redirectURL = await this.registerOAuth(api)
        // return redirect url and pendingAPI
        return { pendingAPI, redirectURL }
    }

    async authorize() {
        // confirm sub and api_code suband authCode exists
        if (!this.sub) return Promise.reject('missing sub')
        if (!this.api_id) return Promise.reject('missing api_id')
        if (!this.authCode) return Promise.reject('missing authcode')
        // return api document
        const api = await this.findSpecificAvailableAPI()
        console.log('found api')
        // confirm there are is only 1 pending installation
        const pendingAPI = await this.findSpecificInstalledAPI()
        console.log('found pending api')
        // authorize installation based on api oauth authorization details
        const token = await this.authorizeOAuth(api)
        console.log('token', token)
        // update install document and mark status as active (aka installed)
        const authorizedAPI = await this.authorizeSpecificPendingAPI(pendingAPI)
        console.log(authorizedAPI)

        return { authorizedAPI, token }
    }

    async findSpecificAvailableAPI() {
        // filter one by api_id
        // filter one by active: true
        const filter = {}
        filter._id = this.api_id
        filter.active = true

        // find document
        const doc = await schema.available.findOne(filter).exec()
        if (!doc._id) return Promise.reject('specific available api not found')
        
        // return document
        return doc
    }

    async findSpecificInstalledAPI() {
        // filter by sub
        // filter by status: pending
        const filter = {}
        filter.sub = this.sub
        filter.status = 'pending'

        // confirm no more than one document exists
        const count = await schema.installed.countDocuments(filter).exec()
        if (count > 1) return Promise.reject('more than one pending installed apis found')

        if (count === 1) {
            // find document and confirm api_id
            const doc = await schema.installed.findOne(filter).exec()
            if (doc.api_id.toString() !== this.api_id) return Promise.reject('there is already a pending installation')

            return doc
        } else {
            // update filter
            filter.api_id = this.api_id

            // find and return newly created document
            const doc = await schema.installed.findOneAndUpdate(filter, {}, { upsert: true, new: true }).exec()
            return doc
        }
        
    }

    async authorizeSpecificPendingAPI(pendingAPI) {
        // confirm pending api is passed
        if (!pendingAPI) Promise.reject('missing pending api document')
        // mark as status: active
        pendingAPI.status = 'active'
        // update document
        await pendingAPI.save()
        // return document
        return pendingAPI
    }

    async registerOAuth(api) {
        // gather oauth data
        const oauthData = this.oauthData(api)
        // gather redirect url
        const { data } = await axios({
            url: oauthData.register.url,
            method: this.oauthMethod,
            data: {
                sub: this.sub,
            }
        })
        // return redirect url
        return data
    }

    async authorizeOAuth(api) {
        // gather oauth data
        const oauthData = this.oauthData(api)
        // gather token
        const { data } = await axios({
            url: oauthData.authorize.url,
            method: this.oauthMethod,
            data: {
                sub: this.sub,
                authCode: this.authCode,
            }
        })
        // return token
        return data
    }

    oauthData(api) {
        // gather base url
        const baseURL = (process.env.NODE_ENV === 'production') ? api.config.baseURLs.prod : api.config.baseURLs.local

        // create oauthDataObject
        const oauthDataObject = {
            register: {
                url: baseURL + api.config.oauth.register.path,
            },
            authorize: {
                url: baseURL + api.config.oauth.authorize.path,
            },
        }
        // return oauthDataObject
        return oauthDataObject
    }

}

module.exports = InstalledService