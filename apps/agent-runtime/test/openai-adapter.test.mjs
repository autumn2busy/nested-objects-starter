import assert from 'node:assert/strict'
import test from 'node:test'
import OpenAI from 'openai'
import { setDefaultOpenAIClient, setTracingDisabled } from '@openai/agents'

import {
  AGENT_REGISTRATIONS,
  OpenAiSpecialistAdapter,
  createCorrelationContext,
  loadRuntimeConfiguration,
} from '../dist/index.js'

const enabledEnvironment = {
  AGENT_RUNTIME_ENV: 'test',
  AGENT_MODEL_EXECUTION_ENABLED: 'true',
  OPENAI_API_KEY: 'synthetic-test-key',
}

test('Astra is the optional runtime default while explicit model overrides are preserved', () => {
  for (const value of [undefined, '', '  ']) {
    const configuration = loadRuntimeConfiguration({ ...enabledEnvironment, OPENAI_AGENT_MODEL: value })
    assert.equal(configuration.model.model, 'gpt-6-astra')
    assert.equal(configuration.model.maxTurns, 4)
    assert.equal(configuration.mutationsEnabled, false)
  }

  const override = loadRuntimeConfiguration({ ...enabledEnvironment, OPENAI_AGENT_MODEL: ' pinned-model ' })
  assert.equal(override.model.model, 'pinned-model')

  assert.equal(loadRuntimeConfiguration({ OPENAI_AGENT_MODEL: 'gpt-6-astra' }).model, null)
  assert.throws(
    () => loadRuntimeConfiguration({ ...enabledEnvironment, OPENAI_API_KEY: '' }),
    /OPENAI_API_KEY is required/,
  )
})

test('installed Agents SDK sends compatible Astra Responses requests and preserves the output contract', async () => {
  // Exercise the real SDK serialization and parsing without network access or trace export.
  setTracingDisabled(true)
  const requests = []
  const output = {
    summary: 'Synthetic evaluation complete.',
    findings: [],
    data: { synthetic: true, metrics: { count: 0, revenue: null }, sources: ['fixture'] },
    proposedActions: [{
      actionType: 'internal.review',
      targetSystem: 'control-plane',
      conciseRationale: 'Synthetic recommendation only.',
      payload: { synthetic: true, nested: { enabled: false }, items: [1, 'test'] },
    }],
    conciseRationale: 'Only synthetic inputs were supplied.',
  }
  let wireOutput = {
    summary: output.summary,
    findings: output.findings,
    dataJson: JSON.stringify(output.data),
    proposedActions: output.proposedActions.map(({ payload, ...action }) => ({
      ...action,
      payloadJson: JSON.stringify(payload),
    })),
    conciseRationale: output.conciseRationale,
  }
  setDefaultOpenAIClient(new OpenAI({
    apiKey: 'synthetic-test-key',
    baseURL: 'https://openai.invalid/v1',
    maxRetries: 0,
    fetch: async (url, options) => {
      requests.push({ url: String(url), body: JSON.parse(options.body) })
      return new Response(JSON.stringify({
        id: 'resp_synthetic',
        object: 'response',
        created_at: 0,
        status: 'completed',
        model: JSON.parse(options.body).model,
        output: [{
          id: 'msg_synthetic',
          type: 'message',
          role: 'assistant',
          status: 'completed',
          content: [{ type: 'output_text', text: JSON.stringify(wireOutput), annotations: [] }],
        }],
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    },
  }))

  const input = {
    taskId: crypto.randomUUID(),
    objective: 'Evaluate synthetic migration data.',
    payload: { synthetic: true },
    evidence: [],
    sourceRefs: [],
    experiment: null,
    correlation: createCorrelationContext(),
  }
  const adapter = new OpenAiSpecialistAdapter({
    registration: AGENT_REGISTRATIONS[0],
    model: loadRuntimeConfiguration(enabledEnvironment).model,
  })
  const result = await adapter.run(input)
  assert.deepEqual(result, { ...output, evidence: [], correlation: input.correlation })

  assert.equal(requests.length, 1)
  const { url, body } = requests[0]
  assert.equal(url, 'https://openai.invalid/v1/responses')
  assert.equal(body.model, 'gpt-6-astra')
  assert.equal(body.reasoning.effort, 'low')
  assert.deepEqual(body.tools, [])
  assert.equal(body.text.format.type, 'json_schema')
  assert.equal(body.text.format.strict, true)
  assert.equal(body.text.format.schema.additionalProperties, false)
  assert.equal(body.text.format.schema.properties.proposedActions.items.additionalProperties, false)
  for (const unsupported of ['temperature', 'top_p', 'top_logprobs', 'logprobs', 'prompt_cache_retention']) {
    assert.equal(Object.hasOwn(body, unsupported), false, `${unsupported} must not be sent to Astra`)
  }
  assert.ok(!body.include?.includes('message.output_text.logprobs'))

  const overrideAdapter = new OpenAiSpecialistAdapter({
    registration: AGENT_REGISTRATIONS[0],
    model: loadRuntimeConfiguration({ ...enabledEnvironment, OPENAI_AGENT_MODEL: 'gpt-5.6-luna' }).model,
  })
  await overrideAdapter.run(input)
  assert.equal(requests[1].body.model, 'gpt-5.6-luna')
  assert.equal(requests[1].body.reasoning.effort, 'none')

  const validWireOutput = structuredClone(wireOutput)
  for (const invalidJson of ['{broken', '[]', 'null', '123', '"text"']) {
    wireOutput = { ...validWireOutput, dataJson: invalidJson }
    await assert.rejects(() => adapter.run(input), /Specialist output dataJson/)
    wireOutput = {
      ...validWireOutput,
      proposedActions: [{ ...validWireOutput.proposedActions[0], payloadJson: invalidJson }],
    }
    await assert.rejects(() => adapter.run(input), /Specialist output proposedActions\[0\].payloadJson/)
  }
})
