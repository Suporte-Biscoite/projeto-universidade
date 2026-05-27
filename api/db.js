// api/db.js — conexão com Aurora Serverless via AWS Data API
// Usa as variáveis injetadas pela Vercel ao conectar o Aurora:
// AWS_REGION, AWS_RESOURCE_ARN, AWS_ROLE_ARN, PGDATABASE

import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand } from '@aws-sdk/client-rds-data';

const client = new RDSDataClient({ region: process.env.AWS_REGION });

const resourceArn = process.env.AWS_RESOURCE_ARN;
const secretArn   = process.env.AWS_ROLE_ARN;
const database    = process.env.PGDATABASE;

export async function query(sql, params = []) {
  const parameters = params.map(p => {
    if (p === null || p === undefined) return { isNull: true };
    if (typeof p === 'boolean') return { booleanValue: p };
    if (typeof p === 'number') return Number.isInteger(p) ? { longValue: p } : { doubleValue: p };
    return { stringValue: String(p) };
  });

  const command = new ExecuteStatementCommand({
    resourceArn,
    secretArn,
    database,
    sql,
    parameters,
    includeResultMetadata: true,
    formatRecordsAs: 'JSON',
  });

  const result = await client.send(command);
  
  // Parse JSON records
  const rows = result.formattedRecords ? JSON.parse(result.formattedRecords) : [];
  return { rows, rowCount: result.numberOfRecordsUpdated ?? rows.length };
}