import { mysql, mysqlp } from '../index.test.js';
import { access } from '../mysql/baseConnection.test.js';
import { isResultSetHeader } from '../helpers.test.js';

const dropProcedure = {
  select: 'DROP PROCEDURE IF EXISTS selectProcedure',
  update: 'DROP PROCEDURE IF EXISTS updateProcedure',
};

const createProcedure = {
  select: `
    CREATE PROCEDURE selectProcedure()
    BEGIN
      SELECT 1 as id;
    END
  `,
  update: `
    CREATE PROCEDURE updateProcedure()
    BEGIN
      SET @a = 1;
    END
  `,
};

const procedureCall = {
  select: 'CALL selectProcedure()',
  update: 'CALL updateProcedure()',
};

// Callback
(() => {
  interface User extends mysql.RowDataPacket {
    id: number;
  }

  const conn = mysql.createConnection(access);

  // Checking `RowDataPacket[]` Procedure Calls
  conn.query(dropProcedure.select, () => {
    conn.query(createProcedure.select, () => {
      conn.query<mysql.ProcedureCallPacket<User[]>>(
        procedureCall.select,
        [],
        (_err, procedureResult) => {
          procedureResult.forEach((users) => {
            if (isResultSetHeader(users)) {
              console.log(users);

              return;
            }

            // Strict checking the `RowDataPacket[]`
            users.forEach((user) => {
              const id: number = user.id;

              console.log(id);
            });
          });
        },
      );
    });
  });

  // Checking `ResultSetHeader | OkPacket` Procedure Calls
  conn.query(dropProcedure.update, () => {
    conn.query(createProcedure.update, () => {
      conn.query<
        mysql.ProcedureCallPacket<mysql.ResultSetHeader | mysql.OkPacket>
      >(
        procedureCall.update,
        [],
        // Strict checking the `ResultSetHeader`
        (_err, procedureResult: mysql.ResultSetHeader) => {
          console.log(procedureResult);
        },
      );
    });
  });
})();

// Promise
(async () => {
  interface User extends mysqlp.RowDataPacket {
    id: number;
  }

  const conn = await mysqlp.createConnection(access);

  // Checking `RowDataPacket[]` Procedure Calls
  {
    await conn.query(dropProcedure.select);
    await conn.query(createProcedure.select);

    const [procedureResult] = await conn.query<
      mysqlp.ProcedureCallPacket<User[]>
    >(procedureCall.select, []);

    procedureResult.forEach((users) => {
      if (isResultSetHeader(users)) {
        console.log(users);

        return;
      }

      // Strict checking the `RowDataPacket[]`
      users.forEach((user) => {
        const id: number = user.id;

        console.log(id);
      });
    });
  }

  // Checking `ResultSetHeader | OkPacket` Procedure Calls
  {
    await conn.query(dropProcedure.update);
    await conn.query(createProcedure.update);

    const [procedureResult] = await conn.query<
      mysqlp.ProcedureCallPacket<mysqlp.ResultSetHeader | mysqlp.OkPacket>
    >(procedureCall.update, []);

    // Strict checking the `ResultSetHeader`
    const resultSetHeader: mysqlp.ResultSetHeader = procedureResult;
    console.log(resultSetHeader);
  }
})();
