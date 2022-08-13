import Sequence = require('../sequences/Sequence');
import Query = require('../sequences/Query');
import {OkPacket, FieldPacket, RowDataPacket, ResultSetHeader} from '../packets';
import {Readable} from 'stream';

declare namespace Prepare {
	export class PrepareStatementInfo {
		close(): void;
		execute<T extends RowDataPacket[][] | RowDataPacket[] | OkPacket | OkPacket[] | ResultSetHeader>(
			paramaters: any | any[] | { [param: string]: any },
			callback?: (
				err: Query.QueryError | null,
				result: T,
				fields: FieldPacket[]
			) => any): Query;
	}
}

declare class Prepare extends Sequence {
	/**
	 * The SQL for a constructed query
	 */
	sql: string;

	/**
	 * Emits a query packet to start the query
	 */
	start(): void;

	/**
	 * Determines the packet class to use given the first byte of the packet.
	 *
	 * @param firstByte The first byte of the packet
	 * @param parser The packet parser
	 */
	determinePacket(firstByte: number, parser: any): any;

	/**
	 * Creates a Readable stream with the given options
	 *
	 * @param options The options for the stream.
	 */
	stream(options?: Query.StreamOptions): Readable;

	on(event: string, listener: Function): this;
	on(event: 'error', listener: (err: Query.QueryError) => any): this;
	on(event: 'fields', listener: (fields: FieldPacket, index: number) => any): this;
	on(event: 'result', listener: (result: RowDataPacket | OkPacket, index: number) => any): this;
	on(event: 'end', listener: () => any): this;
}

export = Prepare;