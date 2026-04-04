import { schema, table, t } from 'spacetimedb/server';

const spacetimedb = schema({
  candidates: table(
    { public: true },
    {
      id: t.string(),
      username: t.string(),
      timestamp: t.string(),
      trustScore: t.f32(),
      verdict: t.string(),
      explanation: t.string(),
      flags: t.string(),      // JSON stringified array
      breakdown: t.string(),  // JSON stringified object
    }
  ),
});

export default spacetimedb;

export const init = spacetimedb.init(ctx => {
  console.info('=== SpacetimeDB Module Initialized ===');
  console.info('✅ candidates table created and ready');
  console.info(`📊 Existing candidates count: ${ctx.db.candidates.count()}`);
  console.info('======================================');
});

export const onConnect = spacetimedb.clientConnected(ctx => {
  console.info(`🔌 Client connected: ${ctx.sender.toHexString()}`);
  console.info(`📊 Total candidates in DB: ${ctx.db.candidates.count()}`);
});

export const onDisconnect = spacetimedb.clientDisconnected(ctx => {
  console.info(`🔌 Client disconnected: ${ctx.sender.toHexString()}`);
});

export const storeCandidateAnalysis = spacetimedb.reducer(
  {
    id: t.string(),
    username: t.string(),
    timestamp: t.string(),
    trustScore: t.f32(),
    verdict: t.string(),
    explanation: t.string(),
    flags: t.string(),
    breakdown: t.string(),
  },
  (ctx, { id, username, timestamp, trustScore, verdict, explanation, flags, breakdown }) => {
    console.info(`💾 Storing candidate: id=${id}, username=${username}, trustScore=${trustScore}, verdict=${verdict}`);

    ctx.db.candidates.insert({
      id,
      username,
      timestamp,
      trustScore,
      verdict,
      explanation,
      flags,
      breakdown,
    });

    const total = ctx.db.candidates.count();
    console.info(`✅ Candidate stored. Total candidates in DB: ${total}`);
  }
);

export const deleteCandidate = spacetimedb.reducer(
  { id: t.string() },
  (ctx, { id }) => {
    console.info(`🗑️ Deleting candidate: id=${id}`);
    let deleted = false;

    for (const candidate of ctx.db.candidates.iter()) {
      if (candidate.id === id) {
        ctx.db.candidates.delete(candidate);
        deleted = true;
        break;
      }
    }

    if (deleted) {
      console.info(`✅ Candidate ${id} deleted. Remaining: ${ctx.db.candidates.count()}`);
    } else {
      console.warn(`⚠️ Candidate ${id} not found — nothing deleted`);
    }
  }
);