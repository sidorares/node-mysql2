
import Sequence = require('./Sequence');
import {OkPacket, RowDataPacket, FieldPacket} from '../packets/index';
import {Readable} from 'stream';

declare namespace Query {

    export interface QueryOptions {
        /**
         * The SQL for the query
         */
        sql: string;

        /**
         * The values for the query
         */
        values?: any | any[] | { [param: string]: any };

        /**
         * Every operation takes an optional inactivity timeout option. This allows you to specify appropriate timeouts for
         * operations. It is important to note that these timeouts are not part of the MySQL protocol, and rather timeout
         * operations through the client. This means that when a timeout is reached, the connection it occurred on will be
         * destroyed and no further operations can be performed.
         */
        timeout?: number;

        /**
         * Either a boolean or string. If true, tables will be nested objects. If string (e.g. '_'), tables will be
         * nested as tableName_fieldName
         */
        nestTables?: any;

        /**
         * Determines if column values should be converted to native JavaScript types. It is not recommended (and may go away / change in the future)
         * to disable type casting, but you can currently do so on either the connection or query level. (Default: true)
         *
         * You can also specify a function (field: any, next: () => void) => {} to do the type casting yourself.
         *
         * WARNING: YOU MUST INVOKE the parser using one of these three field functions in your custom typeCast callback. They can only be called once.
         *
         * field.string()
         * field.buffer()
         * field.geometry()
         *
         * are aliases for
         *
         * parser.parseLengthCodedString()
         * parser.parseLengthCodedBuffer()
         * parser.parseGeometryValue()
         *
         * You can find which field function you need to use by looking at: RowDataPacket.prototype._typeCast
         */
        typeCast?: any;
    }

    export interface StreamOptions {
        /**
         * Sets the max buffer size in objects of a stream
         */
        highWaterMark?: number;

        /**
         * The object mode of the stream (Default: true)
         */
        objectMode?: any;
    }

    export interface QueryError extends NodeJS.ErrnoException {
        /**
         * Either a MySQL server error (e.g. 'ER_ACCESS_DENIED_ERROR'),
         * a node.js error (e.g. 'ECONNREFUSED') or an internal error
         * (e.g. 'PROTOCOL_CONNECTION_LOST').
         */
        code: string;

        /**
         * The sql state marker
         */
        sqlStateMarker?: string;

        /**
         * The sql state
         */
        sqlState?: string;

        /**
         * The field count
         */
        fieldCount?: number;

        /**
         * Boolean, indicating if this error is terminal to the connection object.
         */
        fatal: boolean;
    }
}

declare class Query extends Sequence {

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
    stream(options: Query.StreamOptions): Readable;

    on(event: string, listener: Function): this;
    on(event: 'error', listener: (err: Query.QueryError) => any): this;
    on(event: 'fields', listener: (fields: FieldPacket, index: number) => any): this;
    on(event: 'result', listener: (result: RowDataPacket | OkPacket, index: number) => any): this;
    on(event: 'end', listener: () => any): this;
}

export = Query;
