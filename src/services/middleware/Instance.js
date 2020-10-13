const
    _ = require('lodash'),
    mongoose = require('mongoose'),
    IndexSchema = require('../schema/indexSchema'),
    instanceTools = require('../tools/instance'),
    moment = require('moment'),
    socketService = require('../tools/socket'),
    CronJob = require('cron').CronJob;

module.exports = {
    returnWorkflow: async (req, res, next) => {
        try {
            const workflow = await IndexSchema.Workflow.findById(req.params.workflowId)

            const payload = {
                sub: req.user.sub,
                project: workflow.project,
                workflow: workflow._id,
                workflowName: workflow.name,
            }

            const instance = new IndexSchema.Instance(payload)
            await instance.save()

            socketService.io.emit(req.user.sub, {
                eventDetail: 'Received...',
                instanceId: instance._id,
                workflowName: workflow.name,
                requestName: '',
                statusCode: '',
                duration: '',
                responseSize: '',
                message: '',
            });

            const workflowResult = await instanceTools.start(instance._id, req.body)

            return res.status(200).send(workflowResult)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    queueWorklow: async (req, res, next) => {
        try {
            const workflow = await IndexSchema.Workflow.findById(req.params.workflowId)

            const payload = {
                sub: req.user.sub,
                project: workflow.project,
                workflow: workflow._id,
                workflowName: workflow.name,
            }

            const instance = new IndexSchema.Instance(payload)
            await instance.save()

            socketService.io.emit(req.user.sub, {
                eventDetail: 'Received...',
                instanceId: instance._id,
                workflowName: workflow.name,
                requestName: '',
                statusCode: '',
                duration: '',
                responseSize: '',
                message: '',
            });

            const instanceJob = new CronJob({
                cronTime: moment().add(1, 'seconds'),
                onTick: () => {
                    instanceTools.start(instance._id, req.body)
                },
                start: true,
            })

            return res.status(200).send(instance._id)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
    scheduleWorkflow: async (req, res, next) => {
        try {
            const workflow = await IndexSchema.Workflow.findById(req.params.workflowId)

            const payload = {
                sub: req.user.sub,
                project: workflow.project,
                workflow: workflow._id,
                workflowName: workflow.name,
            }

            const instance = new IndexSchema.Instance(payload)
            await instance.save()

            socketService.io.emit(req.user.sub, {
                eventDetail: 'Received...',
                instanceId: instance._id,
                workflowName: workflow.name,
                requestName: '',
                statusCode: '',
                duration: '',
                responseSize: '',
                message: '',
            });

            const instanceJob = new CronJob({
                cronTime: moment().add(1, 'seconds'),
                onTick: () => {
                    instanceTools.start(instance._id, req.body)
                },
                start: true,
            })

            return res.status(200).send(instance._id)
        } catch (err) {
            console.log(err)
            return res.status(500).send(err)
        }
    },
}