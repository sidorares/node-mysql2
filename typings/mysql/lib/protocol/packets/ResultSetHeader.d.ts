
declare interface ResultSetHeader {
    constructor: {
        name: 'ResultSetHeader'
    };
    affectedRows: number;
    fieldCount: number;
    info: string;
    insertId: number;
    serverStatus: number;
    warningStatus: number;
    changedRows?: number;
}

export = ResultSetHeader;
