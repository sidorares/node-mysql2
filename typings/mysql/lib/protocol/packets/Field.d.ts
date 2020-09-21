
declare interface Field {
    constructor: {
        name: 'Field'
    };
    db: string;
    table: string;
    name: string;
    type: string;
    length: number;
    string: Function;
    buffer: Function;
    geometry: Function;
}

export = Field;
