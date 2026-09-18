import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  storageKey,
  collectionAllowed,
  transition,
  presenterPlan,
} from "../apps/shared/state.mjs";

test("presenter plan fits the 34-second youth-centered slot", () => {
  assert.equal(presenterPlan.length, 3);
  assert.deepEqual(presenterPlan.map(({ startSecond, endSecond }) => [startSecond, endSecond]), [
    [0, 12],
    [12, 22],
    [22, 34],
  ]);
  assert.deepEqual(presenterPlan.map(({ actor }) => actor), ["청년", "검수 담당", "청년"]);
  assert.equal(new Set(presenterPlan.map(({ action }) => action)).size, 3);
});

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
    state = transition(state, "confirm-payment");
    assert.equal(state.payment, "모의 지급 확인");
  });
  test(`${sector}: payment confirmation needs approved work and an operations role`, () => {
    let state = initialState(sector);
    state.role = sector === "manufacturing" ? "manager" : "coordinator";
    assert.throws(() => transition(state, "confirm-payment"), /검수 승인/);
    state.review = "승인";
    assert.throws(() => transition(state, "confirm-payment"), /수집 기록/);
    state.marks.push({ simulated: true });
    state.role = "reviewer";
    assert.throws(() => transition(state, "confirm-payment"), /운영팀 역할/);
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
