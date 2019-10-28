'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _account = require('../models/account');

var _account2 = _interopRequireDefault(_account);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

/*
    ACCOUNT SIGNUP : POST /api/account/signup
    BODY SAMPLE : { "username" : "test", "password" : "test" }
    ERROR CODE :
        1 : BAD USERNAME
        2 : BAD PASSWORD
        3 : USERNAME EXISTS
*/
router.post('/signup', function (req, res) {
    var usernameRegex = /^[a-z0-9]+$/;
    var p_username = req.body.username;
    var p_password = req.body.password;

    if (!usernameRegex.test(p_username)) {
        return res.status(400).json({
            error: "BAD USERNAME",
            code: 1
        });
    }

    if (p_password.length < 4 || typeof p_password !== "string") {
        return res.status(400).json({
            error: "BAD PASSWORD",
            code: 2
        });
    }

    _account2.default.findOne({ username: p_username }, function (err, exists) {
        if (err) throw err;
        if (exists) {
            return res.status(409).json({
                error: "USERNAME EXISTS",
                code: 3
            });
        }

        // CREATE ACCOUNT
        var account = new _account2.default({
            username: p_username,
            password: p_password
        });

        account.password = account.generateHash(account.password);

        // SAVE IN THE DB
        account.save(function (err) {
            if (err) throw err;
            return res.json({
                success: true
            });
        });
    });
});

/*
    ACCOUNT SIGNIN : POST /api/account/signin
    BODY SAMPLE : { "username" : "test", "password" : "test" }
    ERROR CODES  :
        1 : LOGIN FAILED
*/

router.post('/signin', function (req, res) {
    var p_username = req.body.username;
    var p_password = req.body.password;

    if (typeof p_password !== "string") {
        return res.status(401).json({
            error: "LOGIN FAILED",
            code: 1
        });
    }

    _account2.default.findOne({ username: p_username }, function (err, account) {
        if (err) throw err;
        if (!account) {
            return res.status(401).json({
                error: "LOGIN FAILED",
                code: 1
            });
        }

        if (!account.validateHash(p_password)) {
            return res.status(401).json({
                error: "LOGIN FAILED",
                code: 1
            });
        }

        var session = req.session;
        session.loginInfo = {
            _id: account._id,
            username: account.username
        };

        return res.json({
            success: true
        });
    });
});

/*
    GET CURRENT USER INFO GET /api/account/getInfo
*/
router.get('/getInfo', function (req, res) {
    if (typeof req.session.loginInfo === "undefined") {
        return res.status(401).json({
            error: 1
        });
    }

    res.json({ info: req.session.loginInfo });
});

/*
    LOGOUT : POST /api/account/logout
*/
router.post('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw err;
    });
    return res.json({ success: true });
});

/**
 *  SEARCH USER : GET /api/account/search/:username
 */
router.get('/search/:username', function (req, res) {
    var re = new RegExp('^' + req.params.username);
    _account2.default.find({ username: { $regex: re } }, { _id: false, username: true }).limit(5).sort({ username: 1 }).exec(function (err, accounts) {
        if (err) throw err;
        res.json(accounts);
    });
});

router.get('/search', function (req, res) {
    res.json([]);
});

exports.default = router;