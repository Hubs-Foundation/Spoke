import { BufferAttribute, InterleavedBufferAttribute } from "three";

export default class ClonableInterleavedBufferAttribute extends InterleavedBufferAttribute {
  clone() {
    console.warn("Cloning an InterleavedBufferAttribute is unsupported. Converting to a BufferAttribute instead.");

    const count = this.count;
    const itemSize = this.itemSize;
    const array = this.array.slice(0, count * itemSize);

    for (let i = 0, j = 0; i < count; ++i) {
      array[j++] = this.getX(i);
      if (itemSize >= 2) array[j++] = this.getY(i);
      if (itemSize >= 3) array[j++] = this.getZ(i);
      if (itemSize >= 4) array[j++] = this.getW(i);
    }

    return new BufferAttribute(array, itemSize, this.normalized);
  }
}
