"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const Server = require('../../lib/server');
describe('Server', () => {
    it('createServer', (done) => {
        const server = new Server();
        server.on('connection', (arg) => {
            (0, chai_1.expect)(arg).to.equal(1);
            done();
        });
        server.emit('connection', 1);
    });
});
//# sourceMappingURL=server.js.map