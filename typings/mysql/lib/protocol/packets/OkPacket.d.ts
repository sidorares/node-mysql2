
declare interface OkPacket {
    constructor: {
        name: 'OkPacket'
    };
    fieldCount: number;
    affectedRows: number;
    changedRows: number;
    insertId: number;
    serverStatus: number;
    warningCount: number;
    message: string;
    procotol41: boolean;
}

export = OkPacket;
