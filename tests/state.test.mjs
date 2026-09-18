import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  storageKey,
  collectionAllowed,
  transition,
} from "../apps/shared/state.mjs";

test("two apps have separate storage and independent state", () => {
  assert.notEqual(storageKey("manufacturing"), storageKey("small-business"));
  const one = initialState("manufacturing"),
    two = initialState("small-business");
  one.gates[0] = true;
  assert.equal(two.gates[0], false);
});
for (const sector of ["manufacturing", "small-business"]) {
  test(`${sector}: each missing gate blocks collection`, () => {
    for (let i = 0; i < 5; i++) {
      const state = initialState(sector);
      state.gates.fill(true);
      state.gates[i] = false;
      assert.equal(collectionAllowed(state), false);
      assert.throws(() => transition(state, "start"));
    }
  });
  test(`${sector}: submitted session, approval, access and payment stay separate`, () => {
    let state = initialState(sector);
    state.role = "operator";
    state.gates.fill(true);
    state = transition(state, "start");
    assert.throws(() => transition(state, "submit"));
    state.marks.push({ simulated: true });
    state = transition(state, "submit");
    assert.equal(state.review, "검수 대기");
    assert.throws(() => transition(state, "approve"));
    state.role = "reviewer";
    state = transition(state, "approve");
    assert.equal(state.access, "미승인");
    assert.equal(state.payment, "모의 지급 대기");
    state = transition(state, "request-access");
    assert.throws(() => transition(state, "grant-access"));
    state.role = sector === "manufacturing" ? "manager" : "coordinator";
    state = transition(state, "grant-access");
    assert.equal(state.access, "데모 평가용 승인");
    assert.equal(state.payment, "모의 지급 대기");
  });
  test(`${sector}: self review is rejected and rework needs a reason`, () => {
    let state = initialState(sector);
    state.gates.fill(true);
    state = transition(state, "start");
    state.marks.push({ simulated: true });
    state = transition(state, "submit");
    assert.throws(() => transition(state, "approve"), /동일 역할/);
    state.role = "reviewer";
    assert.throws(() => transition(state, "rework", { reason: " " }));
    state = transition(state, "rework", { reason: "구간 보완" });
    assert.equal(state.gates[4], false);
    assert.equal(state.reason, "구간 보완");
  });
}
test("model/device UI simulation is manufacturing FDE only", () => {
  const mf = initialState("manufacturing");
  assert.throws(() => transition(mf, "simulate"));
  mf.role = "fde";
  assert.equal(transition(mf, "simulate").simulation, "모의 실행");
  const sb = initialState("small-business");
  sb.role = "fde";
  assert.throws(() => transition(sb, "simulate"));
});
test("mutations are immutable and empty task titles are rejected", () => {
  const state = initialState("manufacturing");
  assert.throws(() => transition(state, "create-task", { title: " " }));
  const changed = transition(state, "create-task", {
    title: "  데모 과제  ",
    at: "test",
  });
  assert.equal(state.task, null);
  assert.equal(changed.task.title, "데모 과제");
});
