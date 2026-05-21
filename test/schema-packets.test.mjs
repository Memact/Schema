import test from "node:test"
import assert from "node:assert/strict"
import { createSchemaPacket, formSchemaPackets, groupByCategory, inferSchemaType } from "../src/engine.mjs"

test("research records create research packet", () => {
  const packets = formSchemaPackets([
    {
      record_id: "r1",
      category: "research",
      meaningful_score: 0.8,
      canonical_themes: ["api"],
      sources: []
    }
  ])
  assert.equal(packets[0].schema_version, "memact.schema_packet.v0")
  assert.equal(packets[0].schema_type, "research")
})

test("shopping records create shopping packet", () => {
  assert.equal(inferSchemaType({ category: "shopping", evidence: { title: "discount code" } }), "shopping")
})

test("low confidence ignored", () => {
  const packets = formSchemaPackets([{ category: "research", meaningful_score: 0.01 }], { minConfidence: 0.2 })
  assert.deepEqual(packets, [])
})

test("grouping and packet creation work", () => {
  const groups = groupByCategory([{ category: "learning", meaningful_score: 0.7 }])
  const packet = createSchemaPacket(groups.learning)
  assert.equal(packet.category, "learning")
})
