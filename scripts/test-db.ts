import { listCredentials, getPool } from '../src/lib/db';
listCredentials().then(res => { console.log(res); getPool().end(); }).catch(err => { console.error(err); getPool().end(); });
