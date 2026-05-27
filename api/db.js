// api/db.js — conexão com Aurora via IAM (padrão Vercel)
import { Signer } from '@aws-sdk/rds-signer';
import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';
import { attachDatabasePool } from '@vercel/functions';
import pkg from 'pg';
const { Pool } = pkg;

const signer = new Signer({
  hostname: process.env.PGHOST,
  port:     Number(process.env.PGPORT),
  username: process.env.PGUSER,
  region:   process.env.AWS_REGION,
  credentials: awsCredentialsProvider({
    roleArn:      process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
});

const pool = new Pool({
  host:     process.env.PGHOST,
  user:     process.env.PGUSER,
  database: process.env.PGDATABASE || 'postgres',
  password: () => signer.getAuthToken(),
  port:     Number(process.env.PGPORT),
  ssl:      { rejectUnauthorized: false },
  max: 3,
});

attachDatabasePool(pool);

export default pool;