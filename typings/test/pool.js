"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const portfinder = require('portfinder');
const index_1 = require("../../index");
const chai_1 = require("chai");
portfinder.getPort((err, port) => __awaiter(void 0, void 0, void 0, function* () {
    const pool = (0, index_1.createPool)({
        user: 'test_user',
        password: 'test',
        database: 'test_database',
        port: port,
    }).promise();
    describe('Pool.promise()', () => {
        it('exposes escape', () => {
            (0, chai_1.expect)(pool.escape(123)).to.equal('123');
        });
        it('exposes escapeId', () => {
            (0, chai_1.expect)(pool.escapeId('table name')).to.equal('`table name`');
        });
        it('exposes format', () => {
            const params = ['table name', 'thing'];
            (0, chai_1.expect)(pool.format('SELECT a FROM ?? WHERE b = ?', params)).to.equal("SELECT a FROM `table name` WHERE b = 'thing'");
        });
        it('promise connection config', (done) => {
            pool.getConnection().then((connection) => {
                (0, chai_1.expect)(connection.config.user).to.equal('test_user');
                done();
            }).catch(done);
        });
    });
    describe('Pool.getConnection', () => {
        it('get a pool connection', (done) => {
            pool.getConnection().then((connection) => {
                (0, chai_1.expect)(connection.config.user).to.equal('test_user');
                done();
            }).catch(done);
        });
    });
}));
//# sourceMappingURL=pool.js.map