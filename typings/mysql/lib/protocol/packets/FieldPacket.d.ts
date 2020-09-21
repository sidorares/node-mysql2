
declare interface FieldPacket {
    constructor: {
        name: 'FieldPacket'
    };
    catalog: string;
    charsetNr: number;
    db: string;
    decimals: number;
    default: any;
    flags: number;
    length: number;
    name: string;
    orgName: string;
    orgTable: string;
    protocol41: boolean;
    table: string;
    type: number;
    zerofill: boolean;
}

export = FieldPacket;
