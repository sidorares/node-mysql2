import { mysql, mysqlp } from '../index.js';
import { access } from '../mysql/baseConnection.js';
import { isResultSetHeader } from '../helpers.js';

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
  const connAsRow = mysql.createConnection({ ...access, rowsAsArray: true });

  // Checking `RowDataPacket[]` Procedure Calls
  conn.query(dropProcedure.select, () => {
    conn.query(createProcedure.select, () => {
      conn.query<mysql.ProcedureCallPacket<User[]>>(
        procedureCall.select,
        [],
        (_err, procedureResult) => {
          procedureResult.forEach((results) => {
            if (isResultSetHeader(results)) {
              console.log(results);

              return;
            }

            // Strict checking the `RowDataPacket[]`
            const user: User = results;
            const id: number = user.id;

            console.log(id);
          });
        }
      );
    });
  });

  // Checking `RowDataPacket[][]` Procedure Calls
  connAsRow.query(dropProcedure.select, () => {
    connAsRow.query(createProcedure.select, () => {
      connAsRow.query<mysql.ProcedureCallPacket<User[][]>>(
        procedureCall.select,
        [],
        (_err, procedureResult) => {
          procedureResult.forEach((results) => {
            if (isResultSetHeader(results)) {
              console.log(results);

              return;
            }

            // Strict checking the `RowDataPacket[][]`
            const users: User[] = results;

            users.forEach((user) => {
              const id: number = user.id;

              console.log(id);
            });
          });
        }
      );
    });
  });

  // Checking `ResultSetHeader | OkPacket | OkPacket[]` Procedure Calls
  conn.query(dropProcedure.update, () => {
    conn.query(createProcedure.update, () => {
      conn.query<
        mysql.ProcedureCallPacket<
          mysql.ResultSetHeader | mysql.OkPacket | mysql.OkPacket[]
        >
      >(
        procedureCall.update,
        [],
        // Strict checking the `ResultSetHeader`
        (_err, procedureResult: mysql.ResultSetHeader) => {
          console.log(procedureResult);
        }
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
  const connAsRow = await mysqlp.createConnection({
    ...access,
    rowsAsArray: true,
  });

  // Checking `RowDataPacket[]` Procedure Calls
  {
    await conn.query(dropProcedure.select);
    await conn.query(createProcedure.select);

    const [procedureResult] = await conn.query<
      mysqlp.ProcedureCallPacket<User[]>
    >(procedureCall.select, []);

    procedureResult.forEach((results) => {
      if (isResultSetHeader(results)) {
        console.log(results);

        return;
      }

      // Strict checking the `RowDataPacket[]`
      const user: User = results;
      const id: number = user.id;

      console.log(id);
    });
  }

  // Checking `RowDataPacket[][]` Procedure Calls
  {
    await connAsRow.query(dropProcedure.select);
    await connAsRow.query(createProcedure.select);

    const [procedureResult] = await connAsRow.query<
      mysqlp.ProcedureCallPacket<User[][]>
    >(procedureCall.select, []);

    procedureResult.forEach((results) => {
      if (isResultSetHeader(results)) {
        console.log(results);

        return;
      }

      // Strict checking the `RowDataPacket[][]`
      const users: User[] = results;

      users.forEach((user) => {
        const id: number = user.id;

        console.log(id);
      });
    });
  }

  // Checking `ResultSetHeader | OkPacket | OkPacket[]` Procedure Calls
  {
    await conn.query(dropProcedure.select);
    await conn.query(createProcedure.select);

    const [procedureResult] = await conn.query<
      mysqlp.ProcedureCallPacket<
        mysqlp.ResultSetHeader | mysqlp.OkPacket | mysqlp.OkPacket[]
      >
    >(procedureCall.select, []);

    // Strict checking the `ResultSetHeader`
    const resultSetHeader: mysqlp.ResultSetHeader = procedureResult;
    console.log(resultSetHeader);
  }
})();
