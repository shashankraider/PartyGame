/** Supply local Supabase credentials without writing them to logs or checked-in files. */
import { execFileSync, spawn } from 'node:child_process';
import { parseEnv } from 'node:util';
const args=['status','-o','env'];
if(process.env.SUPABASE_WORKDIR)args.push('--workdir',process.env.SUPABASE_WORKDIR);
const local=parseEnv(execFileSync('supabase',args,{encoding:'utf8',stdio:['ignore','pipe','inherit']}));
if(!['localhost','127.0.0.1'].includes(new URL(local.API_URL).hostname))throw new Error('Local database required');
const env={...process.env,SUPABASE_URL:local.API_URL,NEXT_PUBLIC_SUPABASE_URL:local.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:local.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:local.SERVICE_ROLE_KEY,SUPABASE_JWT_SECRET:local.JWT_SECRET,INTEGRATION_DB_URL:local.API_URL,INTEGRATION_ANON_KEY:local.ANON_KEY,INTEGRATION_SERVICE_KEY:local.SERVICE_ROLE_KEY,INTEGRATION_BASE_URL:process.env.INTEGRATION_BASE_URL??'http://localhost:3100'};
const [command,...commandArgs]=process.argv.slice(2);
if(!command)throw new Error('Provide a command to run');
const child=spawn(command,commandArgs,{env,stdio:'inherit'});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
