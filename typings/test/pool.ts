'use strict';

const portfinder = require('portfinder');
import { createPool } from '../../index';
import { Pool, PoolOptions, PromisePoolConnection } from '../../promise';
import { expect } from 'chai'

portfinder.getPort(async (err: any, port: number) => {
	const pool: Pool = createPool({
		user: 'test_user',
		password: 'test',
		database: 'test_database',
		port: port,
	} as PoolOptions).promise();

	describe('Pool.promise()', () => {

		it('exposes escape', () => {
			expect(pool.escape(123)).to.equal('123')
		})

		it('exposes escapeId', () => {
			expect(pool.escapeId('table name')).to.equal('`table name`')
		})

		it('exposes format', () => {
			const params = ['table name', 'thing'];
			expect(pool.format('SELECT a FROM ?? WHERE b = ?', params)).to.equal("SELECT a FROM `table name` WHERE b = 'thing'")
		})

		it('promise connection config', (done) => {
			pool.getConnection().then((connection: PromisePoolConnection) => {
				expect(connection.config.user).to.equal('test_user');
				done();
			}).catch(done);
		})
	});
});
