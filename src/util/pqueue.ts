type Comparator<T = never> = (a: T, b: T) => number;

const TOP_OF_HEAP = 0;
const getParent = (i: number) => ((i + 1) >>> 1) - 1;
const getLeft = (i: number) => (i << 1) + 1;
const getRight = (i: number) => (i + 1) << 1;

// Original PriorityQueue implementation from: https://stackoverflow.com/a/42919752
export class PriorityQueue<T = number> {
  private heap: T[];
  private heapSize = 0;
  private comparator: Comparator<T>;

  constructor(comparator: Comparator<T>) {
    this.heap = [];
    this.comparator = comparator;
  }

  get _internalHeapSize(): number {
    return this.heap.length;
  }

  size() {
    return this.heapSize;
  }

  isEmpty() {
    return this.heapSize === 0;
  }

  peek() {
    return this.heap[TOP_OF_HEAP];
  }

  add(...values: T[]) {
    for (const val of values) {
      this.heap.push(val);
      this.heapSize++;
      this.siftUp();
    }
    return this.heapSize;
  }

  poll() {
    const poppedValue = this.peek();
    const bottom = this.heapSize - 1;
    if (bottom > TOP_OF_HEAP) {
      this.swap(TOP_OF_HEAP, bottom);
    }
    this.heap.pop();
    this.heapSize--;
    this.siftDown();
    return poppedValue;
  }

  replace(value: T): T {
    const replacedValue = this.peek();
    this.heap[TOP_OF_HEAP] = value;
    this.siftDown();
    return replacedValue;
  }

  trim() {
    this.heap = this.heap.slice(0, this.heapSize);
  }

  private isHigherPriority(i: number, j: number): boolean {
    return this.comparator(this.heap[i], this.heap[j]) < 0;
  }

  private swap(i: number, j: number) {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
  }

  private siftUp() {
    let node = this.heapSize - 1;
    let parentNode: number;
    while (node > TOP_OF_HEAP && this.isHigherPriority(node, (parentNode = getParent(node)))) {
      this.swap(node, parentNode);
      node = parentNode;
    }
  }

  private siftDown() {
    const size = this.heapSize;
    let node = TOP_OF_HEAP;
    let leftChild: number;
    let rightChild: number;

    while (
      ((leftChild = getLeft(node)) < size && this.isHigherPriority(leftChild, node)) ||
      ((rightChild = getRight(node)) < size && this.isHigherPriority(rightChild, node))
    ) {
      rightChild = getRight(node);
      let maxChild =
        rightChild < size && this.isHigherPriority(rightChild, leftChild) ? rightChild : leftChild;
      this.swap(node, maxChild);
      node = maxChild;
    }
  }
}
