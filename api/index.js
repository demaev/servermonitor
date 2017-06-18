import express from 'express';
import { MongoClient } from 'mongodb';
import assert from 'assert';
import moment from 'moment';
import config from '../config';


let mdb;
MongoClient.connect(config.mongodbUri, (err, db) => {
    assert.equal(null, err);

    mdb = db;
});

var getServersLastStatus = function (query, callback) {
    let servers = {};
    mdb.collection('XYZ_Servers').aggregate([
        { '$sort': { 'time': -1 } },
        {'$match' : query},
        {"$group" : {
            '_id' : "$serverName",
             'servers': { '$push': '$$ROOT' }}},
        {"$project" : { _id:0, top1: { "$slice" : ['$servers', 1]}}},
        {"$project" : { serverName: {$arrayElemAt: ["$top1.serverName", 0]},
                        time:{$arrayElemAt: ["$top1.time", 0]},
                        status: {$arrayElemAt: ["$top1.status", 0]},
                        id : {$arrayElemAt: ["$top1.id", 0]}}}
    ])
    .each((err, serverInfo) => {
        assert.equal(null, err);
        console.log(serverInfo);

        if (!serverInfo) {
            console.log(`sending result1`);
            callback(servers);
            return;
        }
        servers[serverInfo.id] = serverInfo;
    });
};

var getServersStatusByDateRange = function (dateFrom, dateTo, callback) {
    console.log(`Dates From:${dateFrom} ; DateTo:${dateTo}`);
    let servers = {};
    mdb.collection('XYZ_Servers').find( {
        time: { '$gte' : dateFrom, '$lte' : dateTo}})
        .sort({time:-1})
    .limit(config.maxRecords)
    .each((err, serverInfo) => {
        assert.equal(null, err);
        console.log(serverInfo);

        if (!serverInfo) {
            callback(servers);
            return;
        }
        servers[serverInfo.id] = serverInfo;
    });
};

const router = express.Router();

router.get('/XYZ/servers/last', (req, res) =>{
    getServersLastStatus({}, (servers) => res.send(servers));
});

router.get('/XYZ/servers', (req, res) =>{
    let {dateFrom, dateTo} = req.query;
    if (!dateFrom 
        || !dateTo 
        || !moment(dateFrom, config.dateFormat, true).isValid()
        || !moment(dateTo, config.dateFormat, true).isValid()){
            getServersLastStatus({}, (servers) => res.send(servers));
        }
        else {
            dateFrom = moment(dateFrom, config.DateFormat, true).toDate();
            dateTo = moment(dateTo, config.DateFormat, true).toDate();
            console.log(`From ${dateFrom} To ${dateTo}`);
            getServersStatusByDateRange(dateFrom,
                                dateTo,
                                (servers) => res.send(servers));
        }

    
});

router.get('/XYZ/servers/:serverName', (req, res) =>{
    getServersLastStatus({serverName:req.params.serverName}, (servers) => res.send(servers));
});

export default router;