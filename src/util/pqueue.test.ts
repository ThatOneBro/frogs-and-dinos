import { describe, expect, test } from "vitest";
import { PriorityQueue } from "./pqueue";

describe("PriorityQueue", () => {
  test("Should have proper length after adding elements", () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.add(1);
    expect(pq.size()).toEqual(1);
    pq.add(2);
    expect(pq.size()).toEqual(2);
  });
  test("Should have proper length after polling", () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.add(1);
    pq.add(2);
    expect(pq.size()).toEqual(2);
    expect(pq.poll()).toEqual(1);
    expect(pq.size()).toEqual(1);
  });
  test("Should re-order properly when higher priority is added", () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.add(2);
    pq.add(3);
    expect(pq.size()).toEqual(2);
    expect(pq.peek()).toEqual(2);
    pq.add(1);
    expect(pq.peek()).toEqual(1);
  });
});
