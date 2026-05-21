declare module 'connect-sqlite3' {
    const connectSqlite3: any;
    export default connectSqlite3;
}

// // 1. Diz ao TypeScript para parar de reclamar dessa biblioteca
// declare module 'connect-sqlite3';

// // 2. Tipagem da Sessão
// import 'express-session';

// declare module 'express-session' {
//     interface SessionData {
//         userId: number;
//         isAdmin: boolean;
//     }
// }